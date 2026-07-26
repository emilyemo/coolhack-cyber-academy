-- CoolHack Cyber Academy collaborative classroom schema
-- Run this once in a new Supabase project's SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'instructor');
create type public.team_role as enum (
  'SOC Analyst',
  'Incident Responder',
  'Security Lead',
  'Communications Lead'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  app_role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 50),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6,12}$'),
  active_mission integer not null default 1 check (active_mission between 1 and 6),
  mission_locked boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_role public.team_role,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (team_id, assigned_role)
);

create table public.role_notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  mission_number integer not null check (mission_number between 1 and 6),
  author_id uuid not null references public.profiles(id) on delete cascade,
  note_text text not null default '',
  updated_at timestamptz not null default now(),
  unique (team_id, mission_number, author_id)
);

create table public.team_reports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  mission_number integer not null check (mission_number between 1 and 6),
  findings text not null default '',
  timeline text not null default '',
  decision text not null default '',
  unknowns text not null default '',
  ai_transcript text not null default '',
  ai_feedback text not null default '',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'locked')),
  last_editor uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (team_id, mission_number)
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  mission_number integer not null check (mission_number between 1 and 6),
  student_id uuid not null references public.profiles(id) on delete cascade,
  reflection_text text not null default '',
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (team_id, mission_number, student_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_instructor()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and app_role = 'instructor'
  );
$$;

create or replace function public.is_team_member(requested_team uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = requested_team and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.role_notes enable row level security;
alter table public.team_reports enable row level security;
alter table public.reflections enable row level security;

create policy "read own profile or instructor"
on public.profiles for select
using (id = auth.uid() or public.is_instructor());

create policy "instructors manage teams"
on public.teams for all
using (public.is_instructor()) with check (public.is_instructor());

create policy "members read assigned team"
on public.teams for select
using (public.is_team_member(id));

create policy "instructors manage memberships"
on public.team_members for all
using (public.is_instructor()) with check (public.is_instructor());

create policy "members read team roster"
on public.team_members for select
using (public.is_team_member(team_id));

create policy "members and instructor read role notes"
on public.role_notes for select
using (public.is_team_member(team_id) or public.is_instructor());

create policy "students write only their own role notes"
on public.role_notes for insert
with check (
  author_id = auth.uid()
  and public.is_team_member(team_id)
  and not exists (
    select 1 from public.teams t
    where t.id = team_id and t.mission_locked
  )
);

create policy "students update only their own role notes"
on public.role_notes for update
using (
  public.is_instructor()
  or (
    author_id = auth.uid()
    and not exists (
      select 1 from public.teams t
      where t.id = team_id and t.mission_locked
    )
  )
)
with check (author_id = auth.uid() or public.is_instructor());

create policy "members and instructor read team reports"
on public.team_reports for select
using (public.is_team_member(team_id) or public.is_instructor());

create policy "members create team reports"
on public.team_reports for insert
with check (public.is_team_member(team_id) or public.is_instructor());

create policy "members update unlocked team reports"
on public.team_reports for update
using (
  public.is_instructor()
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
  public.is_instructor()
  or (
    public.is_team_member(team_id)
    and status in ('draft', 'submitted')
    and not exists (
      select 1 from public.teams t
      where t.id = team_id and t.mission_locked
    )
  )
);

create policy "student owns reflection; instructor reads all"
on public.reflections for select
using (student_id = auth.uid() or public.is_instructor());

create policy "student creates own reflection"
on public.reflections for insert
with check (student_id = auth.uid() and public.is_team_member(team_id));

create policy "student updates own unsubmitted reflection"
on public.reflections for update
using (
  (student_id = auth.uid() and submitted_at is null)
  or public.is_instructor()
)
with check (student_id = auth.uid() or public.is_instructor());

alter publication supabase_realtime add table
  public.role_notes,
  public.team_reports,
  public.reflections,
  public.team_members,
  public.teams;
