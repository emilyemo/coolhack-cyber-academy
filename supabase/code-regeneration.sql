-- CoolHack code-regeneration controls
-- Run once after self-service-professor-migration.sql.

create or replace function public.regenerate_section_code(requested_section uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
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
    raise exception 'You may regenerate the student section code only for your assigned class';
  end if;

  new_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  update public.sections
  set class_code = new_code
  where id = requested_section and is_active;

  if not found then
    raise exception 'Active class not found';
  end if;
  return new_code;
end;
$$;

create or replace function public.regenerate_team_code(requested_team uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not public.manages_team(requested_team) then
    raise exception 'You may regenerate codes only for a team in your class';
  end if;

  new_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  update public.teams
  set join_code = new_code
  where id = requested_team;

  if not found then
    raise exception 'Team not found';
  end if;
  return new_code;
end;
$$;

revoke all on function public.regenerate_section_code(uuid) from public;
revoke all on function public.regenerate_team_code(uuid) from public;
grant execute on function public.regenerate_section_code(uuid) to authenticated;
grant execute on function public.regenerate_team_code(uuid) to authenticated;
