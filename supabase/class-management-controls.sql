-- CoolHack guarded class and roster management
-- Run after self-service-professor-migration.sql.

create or replace function public.archive_section(requested_section uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only the platform administrator can archive sections';
  end if;

  update public.sections
  set is_active = false
  where id = requested_section
    and is_active;

  if not found then
    raise exception 'Active section not found';
  end if;

  return true;
end;
$$;

create or replace function public.remove_team_member(requested_team uuid, requested_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.manages_team(requested_team) then
    raise exception 'You may remove members only from a team in your assigned class';
  end if;

  delete from public.team_members
  where team_id = requested_team
    and user_id = requested_user;

  if not found then
    raise exception 'Team member not found';
  end if;

  return true;
end;
$$;

revoke all on function public.archive_section(uuid) from public;
revoke all on function public.remove_team_member(uuid, uuid) from public;
grant execute on function public.archive_section(uuid) to authenticated;
grant execute on function public.remove_team_member(uuid, uuid) to authenticated;
