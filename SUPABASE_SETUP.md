# CoolHack shared-workspace setup

The public academy can remain on GitHub Pages. Supabase supplies student
authentication, assigned teams, automatic saving, live updates, and the
instructor dashboard.

## Information needed to connect the app

Create a free Supabase project, then provide only:

1. Project URL
2. Public anonymous (`anon`) key

These are browser-facing configuration values. Never share the database
password or `service_role` key.

## Database installation

1. Open the project's **SQL Editor**.
2. Paste and run `supabase/schema.sql`.
3. In **Authentication → URL Configuration**, add:
   `https://emilyemo.github.io/coolhack-cyber-academy/`
4. Enable email/password authentication.
5. Disable open public registration after the class accounts are created.
6. Create the instructor's account normally, then promote only that account in
   the SQL Editor:

   ```sql
   update public.profiles
   set app_role = 'instructor'
   where id = (
     select id from auth.users where email = 'INSTRUCTOR-EMAIL-HERE'
   );
   ```

   Confirm the email address before running this statement.

## Classroom data model

- Every student has an individual authenticated account.
- The instructor creates teams and assigns four students and four distinct roles.
- Each student edits a separate role-notes area.
- The team shares one report and AI transcript.
- Each student owns a private individual reflection.
- The instructor can read every team and reflection, monitor updates, and lock a mission.
- Row-level security prevents students from reading another team's work.

## Important privacy rule

Use course-created accounts or school-approved student email addresses according
to institutional policy. Do not store passwords, grades, real incident data, or
unnecessary personal information in the academy.
