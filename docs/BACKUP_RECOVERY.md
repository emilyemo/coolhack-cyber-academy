# Backup, Recovery, and Retirement

Test backup and restore with fictional data before relying on the live
classroom.

## What to protect

- Supabase database schema
- Classroom tables
- Authentication-user relationships
- GitHub repository and deployment configuration
- A separate record of deployed versions

Do not add real-name mappings, grades, or private answer keys to a general
CoolHack backup.

## Before a backup

1. Announce a maintenance window.
2. Lock active missions or ask users to stop editing.
3. Confirm the latest saves completed.
4. Record the deployed Git commit.
5. Use Supabase's supported backup/export features for the project's plan.
6. Store exports in an approved encrypted location with limited access.

The browser-only local-storage workspace is not a centralized backup. Students
must download sanitized work when instructed.

## Recovery plan

1. Create or identify the recovery Supabase project.
2. Restore the database using the supported Supabase procedure.
3. Restore or re-create authentication relationships carefully; table rows that
   reference `auth.users` require matching user IDs.
4. Configure the GitHub Pages copy with the recovery project's public URL and
   publishable key.
5. Recheck redirect URLs and authentication settings.
6. Run the complete [Security test checklist](SECURITY_TESTING.md).
7. Confirm the administrator, professor-section, team, and reflection
   boundaries before reopening access.

A SQL table export alone may not recreate Supabase Auth users. Document the
chosen plan's authentication backup capabilities before the term begins.

## Accidental deletion

1. Stop additional writes.
2. Record the time, user, table, and known scope.
3. Do not improvise destructive SQL.
4. Use the latest valid backup or point-in-time recovery supported by the
   project's Supabase plan.
5. Restore into a separate environment first when possible.
6. Validate relationships and security policies before replacing production.

## End-of-term retirement

1. Lock missions and disable new registration.
2. Export only the de-identified work that policy permits retaining.
3. Transfer official assessment records to the approved course system.
4. Confirm the retention decision and responsible owner.
5. Delete expired classroom content and accounts through a reviewed procedure.
6. Verify deletion.
7. Retain only the minimum operational audit record required.
8. Rotate or retire project credentials if the deployment is shut down.

## Destructive-action rule

Before deleting sections, teams, accounts, tables, or a Supabase project:

- identify the exact target;
- confirm the request and retention requirement;
- create and verify a recoverable backup;
- test the restore path;
- record who approved the action; and
- avoid broad or unreviewed deletion commands.
