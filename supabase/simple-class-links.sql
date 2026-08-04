-- Simple class-link enrollment. Existing code columns remain for compatibility,
-- but new classroom onboarding uses a private class-link token and team names.

alter table public.sections
  add column if not exists class_link_token text;

update public.sections
set class_link_token = encode(gen_random_bytes(18), 'hex')
where class_link_token is null;

alter table public.sections
  alter column class_link_token set default encode(gen_random_bytes(18), 'hex'),
  alter column class_link_token set not null;

create unique index if not exists sections_class_link_token_key
  on public.sections (class_link_token);

drop function if exists public.create_professor_section(text);
create function public.create_professor_section(requested_name text)
returns table (id uuid, name text, class_link_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_name text;
begin
  if auth.uid() is null or not public.is_instructor() or public.is_platform_admin() then
    raise exception 'A signed-in professor account is required';
  end if;
  safe_name := trim(coalesce(requested_name, ''));
  if char_length(safe_name) < 2 or char_length(safe_name) > 80 then
    raise exception 'Class name must contain 2 to 80 characters';
  end if;
  if (select count(*) from public.sections where instructor_id = auth.uid() and is_active) >= 12 then
    raise exception 'This professor account already has the maximum of 12 active classes';
  end if;
  return query
  insert into public.sections (name, instructor_id, created_by)
  values (safe_name, auth.uid(), auth.uid())
  returning sections.id, sections.name, sections.class_link_token;
exception when unique_violation then
  raise exception 'You already have an active class with that name';
end;
$$;

revoke all on function public.create_professor_section(text) from public;
grant execute on function public.create_professor_section(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested_team uuid;
  selected_team uuid;
  requested_section uuid;
  requested_class_token text;
  requested_team_name text;
  requested_professor_code text;
  account_kind text;
begin
  account_kind := coalesce(new.raw_user_meta_data ->> 'account_kind', '');
  requested_class_token := trim(coalesce(new.raw_user_meta_data ->> 'class_token', ''));
  requested_team_name := trim(coalesce(new.raw_user_meta_data ->> 'team_name', ''));
  requested_professor_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'professor_code', '')));
  begin selected_team := nullif(new.raw_user_meta_data ->> 'team_id', '')::uuid;
  exception when invalid_text_representation then raise exception 'Invalid team selection'; end;

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)));

  if account_kind in ('student_alias', 'student_team_creator') then
    select id into requested_section from public.sections
    where class_link_token = requested_class_token and is_active;
    if requested_section is null then raise exception 'This class link is invalid or inactive'; end if;

    if account_kind = 'student_team_creator' then
      if char_length(requested_team_name) < 2 or char_length(requested_team_name) > 50 then
        raise exception 'Team name must contain 2 to 50 characters';
      end if;
      insert into public.teams (name, section_id, created_by)
      values (requested_team_name, requested_section, new.id)
      returning id into requested_team;
    else
      select t.id into requested_team from public.teams t
      where t.id = selected_team and t.section_id = requested_section;
      if requested_team is null then raise exception 'Select a team from this class'; end if;
    end if;
    insert into public.team_members (team_id, user_id) values (requested_team, new.id);

  elsif account_kind = 'professor_self_service' then
    update public.profiles set app_role = 'instructor' where id = new.id;
  elsif account_kind = 'professor_code_claim' then
    select id into requested_section from public.sections
    where professor_access_code = requested_professor_code and is_active and instructor_id is null for update;
    if requested_section is null then raise exception 'Invalid, inactive, or already claimed professor access code'; end if;
    update public.profiles set app_role = 'instructor' where id = new.id;
    update public.sections set instructor_id = new.id where id = requested_section and instructor_id is null;
    if not found then raise exception 'That professor access code was already claimed'; end if;
  end if;
  return new;
end;
$$;

-- This function is invoked only by the auth.users trigger, never as a public RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;
