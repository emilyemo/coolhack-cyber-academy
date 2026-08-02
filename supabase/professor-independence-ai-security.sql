-- CoolHack independent-professor onboarding and AI Security Brief migration.
-- Run after class-management-controls.sql.

alter table public.team_reports
  add column if not exists ai_security_brief text not null default '';

-- Active class names need to be unique only for the professor who owns them.
alter table public.sections
  drop constraint if exists sections_name_key;

drop index if exists public.sections_active_instructor_name_key;
create unique index sections_active_instructor_name_key
  on public.sections (instructor_id, lower(name))
  where is_active and instructor_id is not null;

create or replace function public.create_professor_section(requested_name text)
returns table (id uuid, name text, class_code text)
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
  returning sections.id, sections.name, sections.class_code;
exception
  when unique_violation then
    raise exception 'You already have an active class with that name';
end;
$$;

revoke all on function public.create_professor_section(text) from public;
grant execute on function public.create_professor_section(text) to authenticated;

create or replace function public.archive_section(requested_section uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.sections
      where id = requested_section
        and instructor_id = auth.uid()
        and is_active
    )
  ) then
    raise exception 'You may archive only your own active class';
  end if;

  update public.sections
  set is_active = false
  where id = requested_section and is_active;

  if not found then
    raise exception 'Active class not found';
  end if;
  return true;
end;
$$;

revoke all on function public.archive_section(uuid) from public;
grant execute on function public.archive_section(uuid) to authenticated;

-- Preserve student creation and legacy professor-code claims while adding
-- independent professor registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested_team uuid;
  requested_code text;
  requested_section uuid;
  requested_section_code text;
  requested_team_name text;
  requested_professor_code text;
  account_kind text;
begin
  account_kind := coalesce(new.raw_user_meta_data ->> 'account_kind', '');
  requested_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'join_code', '')));
  requested_section_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'section_code', '')));
  requested_team_name := trim(coalesce(new.raw_user_meta_data ->> 'team_name', ''));
  requested_professor_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'professor_code', '')));

  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );

  if account_kind = 'student_alias' then
    select id into requested_team from public.teams where join_code = requested_code;
    if requested_team is null then raise exception 'Invalid team code'; end if;
    insert into public.team_members (team_id, user_id) values (requested_team, new.id);

  elsif account_kind = 'student_team_creator' then
    select id into requested_section
    from public.sections
    where class_code = requested_section_code and is_active;
    if requested_section is null then raise exception 'Invalid or inactive section code'; end if;
    if requested_code !~ '^[A-Z0-9]{8}$' then raise exception 'Invalid generated team code'; end if;
    insert into public.teams (name, join_code, section_id, created_by)
    values (requested_team_name, requested_code, requested_section, new.id)
    returning id into requested_team;
    insert into public.team_members (team_id, user_id) values (requested_team, new.id);

  elsif account_kind = 'professor_self_service' then
    update public.profiles set app_role = 'instructor' where id = new.id;

  elsif account_kind = 'professor_code_claim' then
    select id into requested_section
    from public.sections
    where professor_access_code = requested_professor_code
      and is_active and instructor_id is null
    for update;
    if requested_section is null then
      raise exception 'Invalid, inactive, or already claimed professor access code';
    end if;
    update public.profiles set app_role = 'instructor' where id = new.id;
    update public.sections set instructor_id = new.id
    where id = requested_section and instructor_id is null;
    if not found then raise exception 'That professor access code was already claimed'; end if;
  end if;
  return new;
end;
$$;

grant select, insert, update on table public.team_reports to authenticated;
