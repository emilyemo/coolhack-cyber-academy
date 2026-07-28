-- CoolHack professor-controlled weekly scenario release
-- Run once after self-service-professor-migration.sql.

alter table public.sections
  add column if not exists released_mission smallint not null default 0
  check (released_mission between 0 and 6);

create or replace function public.set_section_released_mission(
  requested_section uuid,
  requested_mission integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if requested_mission < 0 or requested_mission > 6 then
    raise exception 'Scenario number must be between 0 and 6';
  end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1
      from public.sections s
      where s.id = requested_section
        and s.instructor_id = auth.uid()
        and s.is_active
    )
  ) then
    raise exception 'You may release scenarios only for your assigned class';
  end if;

  update public.sections
  set released_mission = requested_mission
  where id = requested_section
    and is_active;

  if not found then
    raise exception 'Active class not found';
  end if;

  if requested_mission > 0 then
    update public.teams
    set active_mission = requested_mission,
        mission_locked = false
    where section_id = requested_section;
  end if;
end;
$$;

revoke all on function public.set_section_released_mission(uuid, integer) from public;
grant execute on function public.set_section_released_mission(uuid, integer) to authenticated;
