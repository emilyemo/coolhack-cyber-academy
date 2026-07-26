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
   and run `supabase/nickname-auth-migration.sql` once.
4. Paste and run `supabase/admin-sections-migration.sql` once to add the
   platform administrator dashboard, professor-owned sections, secure team
   management, and section-scoped access controls.
5. In **Authentication → URL Configuration**, add:
   `https://emilyemo.github.io/coolhack-cyber-academy/`
6. Enable email/password authentication. In **Authentication → Providers →
   Email**, turn off **Confirm email** before students create access. Student
   accounts use a generated, non-deliverable internal identifier; the site
   never asks students for an email address.
7. Keep registration open only during the classroom pilot.

## Platform administrator account

Use a dedicated non-institutional CoolHack project email. Create the account in
the private instructor portal, then promote only your account in the SQL Editor:

```sql
update public.profiles
set app_role = 'platform_admin'
where id = (
  select id from auth.users where email = 'YOUR-COOLHACK-PROJECT-EMAIL-HERE'
);
```

Never use or request an HCC password.

## Professor accounts and three sections

1. Each professor creates a dedicated, non-institutional CoolHack project
   account through the private instructor portal.
2. In the platform administrator dashboard, use **Authorize a professor** with
   that project email.
3. Create each Capstone section and assign its professor.
4. Professors can see and manage only their assigned section. The platform
   administrator can see all sections.
5. Create teams inside the correct section and use **Generate code**. Give each
   private team code only to that team's four students.

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
- The platform administrator creates sections and authorizes professors.
- Each professor creates teams only in the assigned section and assigns four
  distinct roles.
- Each student edits a separate role-notes area.
- The team shares one report and AI transcript.
- Each student owns a private individual reflection.
- A professor can read teams and reflections only in the assigned section and
  control its missions.
- The platform administrator can review and support all sections.
- Row-level security prevents students from reading another team's work.

## Privacy rule

CoolHack is an independent instructional simulation, not an HCC system. Do not
collect or store student email addresses, student IDs, real full names, grades,
institutional passwords, real incident data, or other personal information.
Students must use invented screen names and unique CoolHack-only passwords.
