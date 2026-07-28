-- CoolHack platform administrator and multi-section migration
-- Run once after schema.sql and nickname-auth-migration.sql.

alter type public.app_role add value if not exists 'platform_admin';

do $
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'app_role'
      and e.enumlabel = 'platform_admin'
  ) then
    raise exception 'CoolHack migration stopped: platform_admin role was not installed';
  end if;
end $;

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  instructor_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.teams
  add column if not exists section_id uuid references public.sections(id) on delete restrict;

create index if not exists teams_section_id_idx on public.teams(section_id);
create index if not exists sections_instructor_id_idx on public.sections(instructor_id);

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and app_role::text = 'platform_admin'
  );
$$;

create or replace function public.manages_section(requested_section uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.sections
    where id = requested_section
      and instructor_id = auth.uid()
      and is_active
  );
$$;

create or replace function public.manages_team(requested_team uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.teams t
    join public.sections s on s.id = t.section_id
    where t.id = requested_team
      and s.instructor_id = auth.uid()
      and s.is_active
  );
$$;

drop function if exists public.authorize_professor(text);

create or replace function public.authorize_professor(professor_username text)
returns text
language plpgsql security definer set search_path = public, auth
as $$
declare
  target_id uuid;
  target_name text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only the platform administrator can authorize professors';
  end if;

  select u.id into target_id
  from auth.users u
  where u.raw_user_meta_data ->> 'account_kind' = 'professor_alias_pending'
    and lower(u.raw_user_meta_data ->> 'display_name') = lower(trim(professor_username));

  if target_id is null then
    raise exception 'No pending professor account exists for that username';
  end if;

  update public.profiles
  set app_role = 'instructor'
  where id = target_id and app_role::text <> 'platform_admin'
  returning display_name into target_name;

  if target_name is null then
    raise exception 'The platform administrator account cannot be changed';
  end if;

  return target_name;
end;
$$;

revoke all on function public.authorize_professor(text) from public;
grant execute on function public.authorize_professor(text) to authenticated;

alter table public.sections enable row level security;

drop policy if exists "administrators manage sections" on public.sections;
create policy "administrators manage sections"
on public.sections for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "professors read assigned sections" on public.sections;
create policy "professors read assigned sections"
on public.sections for select
using (instructor_id = auth.uid());

drop policy if exists "instructors manage teams" on public.teams;
create policy "authorized staff manage teams"
on public.teams for all
using (public.manages_team(id))
with check (
  public.is_platform_admin()
  or (
    section_id is not null
    and public.manages_section(section_id)
  )
);

drop policy if exists "instructors manage memberships" on public.team_members;
create policy "authorized staff manage memberships"
on public.team_members for all
using (public.manages_team(team_id))
with check (public.manages_team(team_id));

drop policy if exists "members and instructor read role notes" on public.role_notes;
create policy "members and authorized staff read role notes"
on public.role_notes for select
using (public.is_team_member(team_id) or public.manages_team(team_id));

drop policy if exists "members and instructor read team reports" on public.team_reports;
create policy "members and authorized staff read team reports"
on public.team_reports for select
using (public.is_team_member(team_id) or public.manages_team(team_id));

drop policy if exists "student owns reflection; instructor reads all" on public.reflections;
create policy "student owns reflection; authorized staff reads team"
on public.reflections for select
using (student_id = auth.uid() or public.manages_team(team_id));

drop policy if exists "students update only their own role notes" on public.role_notes;
create policy "students or authorized staff update role notes"
on public.role_notes for update
using (
  public.manages_team(team_id)
  or (
    author_id = auth.uid()
    and not exists (
      select 1 from public.teams t
      where t.id = team_id and t.mission_locked
    )
  )
)
with check (author_id = auth.uid() or public.manages_team(team_id));

drop policy if exists "members create team reports" on public.team_reports;
create policy "members or authorized staff create team reports"
on public.team_reports for insert
with check (public.is_team_member(team_id) or public.manages_team(team_id));

drop policy if exists "members update unlocked team reports" on public.team_reports;
create policy "members or authorized staff update team reports"
on public.team_reports for update
using (
  public.manages_team(team_id)
  or (
    public.is_team_member(team_id)
    and status <> 'locked'
    and not exists (
      select 1 from public.teams t
      where t.id = team_id and t.mission_locked
    )
  )
)
with check (
  public.manages_team(team_id)
  or (
    public.is_team_member(team_id)
    and status in ('draft', 'submitted')
    and not exists (
      select 1 from public.teams t
      where t.id = team_id and t.mission_locked
    )
  )
);

drop policy if exists "student updates own unsubmitted reflection" on public.reflections;
create policy "student or authorized staff updates reflection"
on public.reflections for update
using (
  (student_id = auth.uid() and submitted_at is null)
  or public.manages_team(team_id)
)
with check (student_id = auth.uid() or public.manages_team(team_id));

drop policy if exists "read own profile or instructor" on public.profiles;
create policy "read relevant profiles"
on public.profiles for select
using (
  id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.team_members visible_member
    join public.teams visible_team on visible_team.id = visible_member.team_id
    join public.sections visible_section on visible_section.id = visible_team.section_id
    where visible_member.user_id = profiles.id
      and visible_section.instructor_id = auth.uid()
  )
  or exists (
    select 1
    from public.team_members mine
    join public.team_members theirs on theirs.team_id = mine.team_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.sections;
  exception when duplicate_object then
    null;
  end;
end $$;
