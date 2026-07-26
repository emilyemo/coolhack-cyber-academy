# Troubleshooting

## Site cannot be reached

1. Open the base GitHub Pages URL without query parameters.
2. Confirm **Settings → Pages** shows a successful deployment.
3. Try a private window.
4. Check VPN, DNS filtering, and the network connection.
5. Verify the repository name and Pages URL exactly.

## Old page still appears

Perform a hard refresh, open a private window, or clear site data. Confirm that
the deployed commit contains the expected file version.

## Email rate limit exceeded

This comes from Supabase authentication, not GitHub Pages.

1. Stop retrying.
2. Check whether the account already exists under
   **Supabase → Authentication → Users**.
3. Check the administrator project's inbox and junk folder for the newest
   confirmation message.
4. Wait for the project's configured email rate-limit window to reset before
   requesting another message.
5. Configure a suitable SMTP provider before production-like use if the
   built-in sender is insufficient.

Repeated clicks can produce duplicate attempts and prolong confusion.

## Invalid team code

- Confirm the code was copied without spaces.
- Confirm the team exists and is in the correct section.
- Confirm the code has not been replaced.
- Never publish the code while troubleshooting.

## Professor remains pending

1. Confirm the exact username spelling.
2. Confirm the account exists in Supabase Authentication.
3. Authorize the username from the platform administrator dashboard.
4. Assign the professor to an active section.
5. Sign out and sign in again.

## Administrator dashboard does not appear

- Confirm the account exists.
- Confirm the account's `profiles.app_role` is `platform_admin`.
- Confirm the SQL update affected exactly one row.
- Confirm all three SQL scripts completed in order.
- Sign out and sign in through `?portal=admin#classroom-access`.

## Professor sees no section

Authorization and assignment are separate. Confirm:

- the profile role is `instructor`;
- the section's `instructor_id` is the professor's profile ID; and
- the section is active.

## Student account is ready but role is pending

The student joined the team but staff have not assigned one of the four roles.
Assign the alias to an open seat.

## Work is not saving

1. Stop typing and read the save-status message.
2. Confirm the mission is not locked.
3. Confirm the browser is online.
4. Refresh only after the last save finishes.
5. Check the Supabase table and browser console with invented test data.
6. Confirm row-level policies and migration order.

## Live updates are missing

- Confirm both users are in the same team and mission.
- Confirm Supabase Realtime includes the relevant tables.
- Confirm browser/network filtering is not blocking the realtime connection.
- Refresh both test windows once.

## SQL reports an existing object

Do not keep rerunning the script. Determine which migration already completed.
Compare the database objects with the expected schema and run only the missing
migration. Back up before making corrective SQL changes.

## A user can see another section or team

Treat this as a security incident:

1. Stop the pilot.
2. Lock affected missions and disable new registrations.
3. Preserve sanitized evidence.
4. Verify the deployed commit and SQL policies.
5. Complete the entire security checklist again.
6. Resume only after the cause is fixed and isolation tests pass.
