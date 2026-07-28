# Supabase Classroom Setup

This file is a short reference. New installers should follow the complete
[Installation Guide](docs/INSTALLATION.md), including its security tests.

After the self-service professor migration, run
`supabase/weekly-scenario-release.sql` once. It adds the class-level scenario
release setting and the professor-authorized reveal/hide function.

## Safe browser configuration

The browser receives only:

- the Supabase project URL; and
- the Supabase publishable/anonymous browser key.

Use `supabase-config.example.js` as the template. Never place a database
password, JWT secret, access token, or `service_role` key in this repository.

## Database order

For a new database, run these files once in the Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/nickname-auth-migration.sql`
3. `supabase/admin-sections-migration.sql`

An existing deployment should run only the migrations it has not already
completed. Do not rerun migrations casually after an error.

## Authentication

1. Add the exact GitHub Pages URL under
   **Authentication → URL Configuration**.
2. Enable email/password authentication.
3. The current professor/student alias design uses non-deliverable internal
   identifiers. Configure account creation without inbox confirmation before
   testing those accounts.
4. Keep registration open only while new accounts are expected.

## Platform administrator

Create the administrator through:

`?portal=admin#classroom-access`

Use one dedicated, non-institutional project email and a unique CoolHack-only
password. Then promote exactly that account:

```sql
update public.profiles
set app_role = 'platform_admin'
where id = (
  select id
  from auth.users
  where email = 'YOUR-COOLHACK-PROJECT-EMAIL-HERE'
);
```

Confirm that exactly one intended row was updated.

## Professors

Professors use:

`?portal=professor#classroom-access`

They choose a CoolHack username and password; the form does not request an
email. A new account remains pending. The platform administrator authorizes the
exact username and assigns it to a section before the professor can see
classroom data.

## Students

Students use the ordinary site with:

- a private team code;
- an invented screen name; and
- a unique CoolHack-only password.

The form does not request an email. Each student joins only the team matching
the supplied code.

## Required pilot test

Before classroom use, create:

- one administrator;
- one pending professor;
- two sections with different professor visibility where possible; and
- two test teams with separate student aliases.

Complete [Security Testing](docs/SECURITY_TESTING.md). Confirm that pending
professors see nothing, professors remain section-scoped, students remain
team-scoped, and teammates cannot read one another's reflections.

## Data rule

CoolHack is an independent instructional simulation. Do not collect or store
institutional emails, student IDs, real full names, grades, institutional
passwords, real incident data, or other personal information. Private answer
keys remain outside the public repository.
