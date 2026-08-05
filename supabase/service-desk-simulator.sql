-- CoolHack Service Desk collaborative simulator
-- Run after the existing class/team migrations.

alter table public.sections
  add column if not exists released_service_case integer
  check (released_service_case between 1 and 30);

create table if not exists public.service_desk_workspaces (
  team_id uuid not null references public.teams(id) on delete cascade,
  case_id integer not null check (case_id between 1 and 30),
  workspace jsonb not null default '{"tickets":[],"drafts":{},"counter":1024}'::jsonb,
  last_editor uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (team_id, case_id)
);

alter table public.service_desk_workspaces enable row level security;

drop policy if exists "team reads shared service desk" on public.service_desk_workspaces;
create policy "team reads shared service desk"
on public.service_desk_workspaces for select
using (public.is_team_member(team_id) or public.manages_team(team_id));

drop policy if exists "team creates shared service desk" on public.service_desk_workspaces;
create policy "team creates shared service desk"
on public.service_desk_workspaces for insert
with check (public.is_team_member(team_id) or public.manages_team(team_id));

drop policy if exists "team updates shared service desk" on public.service_desk_workspaces;
create policy "team updates shared service desk"
on public.service_desk_workspaces for update
using (public.is_team_member(team_id) or public.manages_team(team_id))
with check (public.is_team_member(team_id) or public.manages_team(team_id));

grant select, insert, update on public.service_desk_workspaces to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'service_desk_workspaces'
  ) then
    alter publication supabase_realtime add table public.service_desk_workspaces;
  end if;
end $$;

create or replace function public.release_service_desk_case(
  requested_section uuid,
  requested_case integer
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if requested_case is not null and (requested_case < 1 or requested_case > 30) then
    raise exception 'Case number must be between 1 and 30';
  end if;

  if not exists (
    select 1 from public.sections
    where id = requested_section
      and (instructor_id = auth.uid() or public.is_platform_admin())
  ) then
    raise exception 'You do not manage this class';
  end if;

  update public.sections
  set released_service_case = requested_case
  where id = requested_section;
end;
$$;

revoke all on function public.release_service_desk_case(uuid, integer) from public;
grant execute on function public.release_service_desk_case(uuid, integer) to authenticated;
