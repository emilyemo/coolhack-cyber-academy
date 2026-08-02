# Installation

This guide creates a new CoolHack deployment using GitHub Pages and Supabase.
Complete it with test data before inviting students.

## 1. Prerequisites

- A GitHub account
- A Supabase account
- A dedicated, non-institutional project email for the platform administrator
- A modern browser
- Permission to use the tools in the intended teaching environment

Do not use an institutional password for any CoolHack account.

## 2. Copy and publish the site

1. Fork or copy this repository into a repository you control.
2. Keep `index.html` in the repository root.
3. Open **Settings → Pages** in the new GitHub repository.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main` and `/(root)`, then save.
6. Record the Pages URL GitHub displays, for example:
   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
7. Open the URL and confirm that the public mission dashboard loads.

At this point the browser-only workspace works, but the live classroom does not.

## 3. Create the Supabase project

1. Create a new Supabase project.
2. Save the database password in a password manager.
3. Never paste that password into GitHub, the website, documentation, an AI
   prompt, or a student handout.
4. Wait for the project to finish provisioning.

## 4. Install the database

For the current release, a **new installation must run all eight files in this
exact order**:

1. `supabase/schema.sql`
2. `supabase/nickname-auth-migration.sql`
3. `supabase/admin-sections-migration.sql`
4. `supabase/self-service-professor-migration.sql`
5. `supabase/weekly-scenario-release.sql`
6. `supabase/code-regeneration.sql`
7. `supabase/class-management-controls.sql`
8. `supabase/professor-independence-ai-security.sql`

For each file:

1. Open the file on GitHub.
2. Select **Raw**.
3. Copy all of the SQL.
4. In Supabase, open **SQL Editor → New query**.
5. Paste the SQL.
6. Verify that the query is from this repository and contains no unknown
   credentials or unrelated destructive statements.
7. Select **Run** once.
8. Confirm **Success** before continuing to the next file.

Do not repeatedly rerun a migration after an error. Copy the complete error and
use [Troubleshooting](TROUBLESHOOTING.md).

### Existing installation

- If only `schema.sql` was previously run, run migrations 2 and 3 in order.
- If the nickname migration was already run, run only migration 3.
- If the first three completed successfully on an existing installation, run
  only migration 4.
- If all four completed successfully, do not rerun them.

## 5. Configure authentication

1. In Supabase, open **Authentication → URL Configuration**.
2. Set the Site URL to the GitHub Pages address.
3. Add the exact Pages address as an allowed redirect URL.
4. In **Authentication → Providers → Email**, ensure email/password
   authentication is enabled.
5. The current nickname design requires account creation without inbox
   confirmation for the derived professor/student identifiers. Configure the
   project's email-confirmation setting accordingly before alias accounts are
   tested.
6. Keep public registration open only when new accounts are expected.

Turning off confirmation changes the security tradeoff: possession of the
chosen identifier is not verified by email. CoolHack compensates with private
team codes, passwords, single-use professor class claims, section isolation, and
row-level security. Complete the security tests before classroom use.

## 6. Connect the browser safely

1. In Supabase, open **Project Settings → API**.
2. Copy the project URL.
3. Copy the **publishable** key (or legacy `anon` browser key).
4. Copy `supabase-config.example.js` to `supabase-config.js`.
5. Replace only the two placeholders:

```js
window.CoolHackConfig = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-PUBLISHABLE-KEY"
};
```

Never use the `service_role` key. Commit and publish the updated browser
configuration. The project URL and publishable key will be visible publicly;
that is expected.

## 7. Create the administrator account

1. Open:
   `https://YOUR-PAGES-URL/?portal=admin#classroom-access`
2. Select **Create administrator account**.
3. Enter the dedicated project email.
4. Create a unique password of at least 12 characters and confirm it.
5. If confirmation is enabled and an email arrives, use the newest
   confirmation message.
6. In Supabase **Authentication → Users**, confirm that exactly one intended
   administrator account exists.
7. Before promotion, verify the migration installed the administrator role:

```sql
select e.enumlabel as allowed_role
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname = 'app_role'
order by e.enumsortorder;
```

The result must include `student`, `instructor`, and `platform_admin`. Stop
and use [Troubleshooting](TROUBLESHOOTING.md) if `platform_admin` is absent.

8. Confirm that exactly one intended administrator account is verified, then
   run this guarded promotion query. It updates nothing unless there is exactly
   one verified account:

```sql
with verified_account as (
  select id
  from auth.users
  where email_confirmed_at is not null
), only_verified_account as (
  select id
  from verified_account
  where (select count(*) from verified_account) = 1
)
update public.profiles as p
set app_role = 'platform_admin'
where p.id = (select id from only_verified_account)
returning p.display_name, p.app_role;
```

9. Confirm that exactly one row returns `app_role = platform_admin`. If zero
   rows return, do not rerun the query; verify the account and profile counts.
10. Sign in through the administrator portal and confirm the dashboard appears.

## 8. Create a professor test account

1. Open a private/incognito window.
2. Open:
   `https://YOUR-PAGES-URL/?portal=professor#classroom-access`
3. Select **First visit: create account**.
4. Choose a non-identifying CoolHack username and a unique password of at least
   12 characters.
5. Create the account, then create a neutral test class.
6. Confirm that its student section code appears immediately.
7. Create a second professor test account and confirm it cannot see, change, or
   archive the first professor's class.
8. Confirm that the administrator access audit records both successful sign-ins.

## 9. Create and isolate two test teams

1. Create two test teams inside the test section.
2. Use **Generate code** for each team.
3. Copy each code privately.
4. In separate private windows, create one invented student alias in each team.
5. Assign each alias a role.
6. Enter different test notes and reports.
7. Verify that neither student can see the other team's data.
8. Complete every item in [Security testing](SECURITY_TESTING.md).

Only after all tests pass should a classroom pilot begin.

## 10. Deployment checklist

- [ ] GitHub Pages loads over HTTPS
- [ ] All four SQL files completed in order
- [ ] `app_role` includes `student`, `instructor`, and `platform_admin`
- [ ] Only public Supabase values are in `supabase-config.js`
- [ ] Administrator account uses a dedicated project email
- [ ] Administrator role promotion affected exactly one account
- [ ] Professor self-registration creates an instructor profile
- [ ] Professor sees only classes created by that professor
- [ ] Administrator can review recent successful sign-ins
- [ ] Students see only their own team
- [ ] Teammates cannot read another student's reflection
- [ ] Locked missions reject student edits
- [ ] No answer keys or real data are in the public repository
- [ ] Backup and deletion responsibilities are assigned
