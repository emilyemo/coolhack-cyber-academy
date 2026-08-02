# Security Test Checklist

Run these tests with invented data in separate browser profiles or private
windows. Do not use real people or real records.

## Configuration

- [ ] Site loads over HTTPS.
- [ ] `supabase-config.js` contains only the project URL and public key.
- [ ] Repository search finds no `service_role`, database password, token,
      private key, recovery code, or real student data.
- [ ] Public source contains no answer key or model solution.

## Administrator

- [ ] New administrator account begins without administrator access.
- [ ] Manual promotion updates exactly one intended account.
- [ ] Platform administrator sees all test sections.
- [ ] Platform administrator sees recent successful sign-ins.
- [ ] Non-administrator cannot read the academy access audit.

## Professor

- [ ] Professor self-registration creates an instructor profile without an administrator code.
- [ ] Professor code claims only its matching active, unassigned class.
- [ ] Professor A cannot read, change, release, archive, or review Professor B's class.
- [ ] Professor A immediately sees only the code-claimed Section A.
- [ ] Professor A cannot read or change Section B.
- [ ] Professor A cannot promote another professor.

## Students and teams

- [ ] Invalid team code cannot create membership.
- [ ] Student A can join only the team matching the supplied code.
- [ ] Student A cannot query Team B's roster, notes, report, or reflections.
- [ ] Team A cannot see Team B's live updates.
- [ ] Student A cannot change another student's role notes.
- [ ] Student A cannot assign roles or change the team's mission.
- [ ] Student A cannot change their own application role.

## Shared and private work

- [ ] Teammates can see shared report changes.
- [ ] Teammates can see team role notes.
- [ ] Teammates cannot read another student's reflection.
- [ ] Assigned professor can review the section's reflections.
- [ ] Unassigned professor cannot read those reflections.
- [ ] A locked mission rejects student note and report changes.
- [ ] Reopening the mission restores intended editing.

## Session behavior

- [ ] Signing out removes access to protected data.
- [ ] Refreshing restores only the signed-in account's authorized workspace.
- [ ] Two simultaneous team members receive live updates.
- [ ] Error messages do not expose internal SQL, secrets, or another account's
      data.

## Negative testing

Use the browser's normal interface and Supabase client calls available to the
signed-in test user. Attempt to select, insert, and update another team's UUIDs.
Every unauthorized operation must return no data or an authorization error.
Merely hiding a button is not a pass.

## Record the result

Record:

- deployment version or commit;
- test date;
- tester;
- pass/fail for each item;
- sanitized evidence;
- defects and corrections; and
- approval decision.

Do not begin a classroom pilot with an unresolved high-severity isolation or
authorization failure.
