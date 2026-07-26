# CoolHack shared-workspace setup

The public academy remains on GitHub Pages. Supabase supplies authentication,
assigned teams, automatic saving, live updates, and the instructor dashboard.

## Information needed to connect the app

The browser configuration uses only the Supabase project URL and publishable
key. Never place a database password or `service_role` key in this repository.

## Database installation

1. Open the project's **SQL Editor**.
2. For a new database, paste and run `supabase/schema.sql`.
3. If the original schema was installed before nickname access was added, paste
   and run `supabase/nickname-auth-migration.sql` once instead.
4. In **Authentication → URL Configuration**, add:
   `https://emilyemo.github.io/coolhack-cyber-academy/`
5. Enable email/password authentication. In **Authentication → Providers →
   Email**, turn off **Confirm email** before students create access. Student
   accounts use a generated, non-deliverable internal identifier; the site
   never asks students for an email address.
6. Keep registration open only during the classroom pilot.

## Instructor account

Use a dedicated non-institutional CoolHack project email. Create the account in
Supabase Authentication, then promote only that account in the SQL Editor:

```sql
update public.profiles
set app_role = 'instructor'
where id = (
  select id from auth.users where email = 'INSTRUCTOR-EMAIL-HERE'
);
```

Never use or request an HCC password.

## First classroom test

1. Sign in as the instructor.
2. Create one test team and its private team code.
3. In a private/incognito browser window, use that code, an invented screen
   name, and a unique CoolHack password to create student access.
4. Assign the test screen name to one of the four seats.
5. Return to the student window. The team workspace should load.
6. Type test content, refresh both windows, and confirm that the saved work and
   live updates remain.
7. Repeat with a second test team and confirm that neither student can view the
   other team's work.

## Classroom data model

- Students use invented screen names, private passwords, and instructor-issued
  team codes; no student email is requested.
- The instructor creates teams and assigns four distinct roles.
- Each student edits a separate role-notes area.
- The team shares one report and AI transcript.
- Each student owns a private individual reflection.
- The instructor can read every team and reflection and lock a mission.
- Row-level security prevents students from reading another team's work.

## Privacy rule

CoolHack is an independent instructional simulation, not an HCC system. Do not
collect or store student email addresses, student IDs, real full names, grades,
institutional passwords, real incident data, or other personal information.
Students must use invented screen names and unique CoolHack-only passwords.
