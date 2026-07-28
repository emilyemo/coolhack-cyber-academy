-- CoolHack self-service professor access and sign-in audit migration
-- Run once after admin-sections-migration.sql.

alter table public.sections
  add column if not exists professor_access_code text;

update public.sections
set professor_access_code = upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12))
where professor_access_code is null;

alter table public.sections
  alter column professor_access_code
    set default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12)),
  alter column professor_access_code set not null;

create unique index if not exists sections_professor_access_code_key
  on public.sections (professor_access_code);

create table if not exists public.access_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  app_role text not null,
  portal text not null check (char_length(portal) between 2 and 30),
  accessed_at timestamptz not null default now()
);

create index if not exists access_events_user_time_idx
  on public.access_events (user_id, accessed_at desc);

alter table public.access_events enable row level security;

drop policy if exists "administrator reads access events" on public.access_events;
create policy "administrator reads access events"
on public.access_events for select
using (public.is_platform_admin());

grant select on table public.access_events to authenticated;

create or replace function public.record_access_event(requested_portal text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  caller_role text;
  safe_portal text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select app_role::text into caller_role
  from public.profiles
  where id = auth.uid();

  safe_portal := left(lower(trim(coalesce(requested_portal, caller_role))), 30);
  if safe_portal !~ '^[a-z_-]{2,30}$' then
    safe_portal := caller_role;
  end if;

  if not exists (
    select 1
    from public.access_events
    where user_id = auth.uid()
      and accessed_at > now() - interval '5 minutes'
  ) then
    insert into public.access_events (user_id, app_role, portal)
    values (auth.uid(), caller_role, safe_portal);
  end if;
end;
$$;

revoke all on function public.record_access_event(text) from public;
grant execute on function public.record_access_event(text) to authenticated;

create or replace function public.regenerate_professor_access_code(requested_section uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  new_code text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only the platform administrator can regenerate professor codes';
  end if;

  new_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12));
  update public.sections
  set professor_access_code = new_code
  where id = requested_section
    and is_active;

  if not found then
    raise exception 'Active class not found';
  end if;

  return new_code;
end;
$$;

revoke all on function public.regenerate_professor_access_code(uuid) from public;
grant execute on function public.regenerate_professor_access_code(uuid) to authenticated;

-- A professor code claim atomically creates the profile, grants the professor
-- role, and assigns the matching unclaimed class. Student account behavior is
-- preserved from the preceding migration.
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
begin
  requested_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'join_code', '')));
  requested_section_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'section_code', '')));
  requested_team_name := trim(coalesce(new.raw_user_meta_data ->> 'team_name', ''));
  requested_professor_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'professor_code', '')));

  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );

  if new.raw_user_meta_data ->> 'account_kind' = 'student_alias' then
    select id into requested_team
    from public.teams
    where join_code = requested_code;

    if requested_team is null then
      raise exception 'Invalid team code';
    end if;

    insert into public.team_members (team_id, user_id)
    values (requested_team, new.id);

  elsif new.raw_user_meta_data ->> 'account_kind' = 'student_team_creator' then
    select id into requested_section
    from public.sections
    where class_code = requested_section_code
      and is_active;

    if requested_section is null then
      raise exception 'Invalid or inactive section code';
    end if;

    if requested_code !~ '^[A-Z0-9]{8}$' then
      raise exception 'Invalid generated team code';
    end if;

    insert into public.teams (name, join_code, section_id, created_by)
    values (requested_team_name, requested_code, requested_section, new.id)
    returning id into requested_team;

    insert into public.team_members (team_id, user_id)
    values (requested_team, new.id);

  elsif new.raw_user_meta_data ->> 'account_kind' = 'professor_code_claim' then
    select id into requested_section
    from public.sections
    where professor_access_code = requested_professor_code
      and is_active
      and instructor_id is null
    for update;

    if requested_section is null then
      raise exception 'Invalid, inactive, or already claimed professor access code';
    end if;

    update public.profiles
    set app_role = 'instructor'
    where id = new.id;

    update public.sections
    set instructor_id = new.id
    where id = requested_section
      and instructor_id is null;

    if not found then
      raise exception 'That professor access code was already claimed';
    end if;
  end if;

  return new;
end;
$$;
