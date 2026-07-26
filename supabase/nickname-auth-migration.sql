-- CoolHack nickname authentication migration
-- Run once after the original schema.sql was installed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested_team uuid;
  requested_code text;
begin
  requested_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'join_code', '')));
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
  end if;
  return new;
end;
$$;

drop policy if exists "read own profile or instructor" on public.profiles;
create policy "read own profile or instructor"
on public.profiles for select
using (
  id = auth.uid()
  or public.is_instructor()
  or exists (
    select 1
    from public.team_members mine
    join public.team_members theirs on theirs.team_id = mine.team_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);
