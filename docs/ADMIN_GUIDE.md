# Platform Administrator Guide

The platform administrator operates the shared academy across all sections.
Only this account uses a real email address.

## Sign in

Use the private administrator route:

`https://YOUR-PAGES-URL/?portal=admin#classroom-access`

Use the dedicated project email and CoolHack-only password. Do not share this
link as a security control; the password and database policies provide the
actual protection.

## First-day setup

1. Confirm the account has the `platform_admin` role.
2. Create each Capstone section with a neutral label.
3. Ask each professor to create a username-only account through the professor
   portal.
4. Verify the requested username outside CoolHack before authorizing it.
5. Authorize the exact pending username.
6. Assign the authorized professor to the correct section.
7. Create teams in the correct section.
8. Generate a separate private team code for every team.
9. Share each code only with that team's four students.
10. Assign all four student aliases to distinct roles.

Do not store official section numbers, employee IDs, student IDs, real rosters,
or grades in CoolHack.

## Approving a professor

1. Have the professor tell you the exact CoolHack username through an approved
   communication channel.
2. Confirm the account is expected.
3. In **Authorize a professor**, enter the exact username.
4. Approve it once.
5. Assign the professor to a section.
6. Ask the professor to sign out and sign in again.
7. Verify that the professor sees only the assigned section.

Authorization and section assignment are separate. An authorized professor
without an assigned section should not see classroom data.

## Creating sections

Use neutral labels such as `Capstone Section 1`, not institutional course
records. Select an authorized professor or choose **Assign later** if the
professor account is not ready.

Before creating teams, verify the section-professor pairing. A team belongs to
one section, and professor visibility is derived from that relationship.

## Creating teams and codes

1. Select the correct section.
2. Enter a neutral team name.
3. Select **Generate code**.
4. Create the team.
5. Use **Copy code** and send it privately to the four assigned students.

Do not post all team codes in one announcement. A code is an enrollment secret,
not a general class password. Generate a new code if one is exposed before
students enroll.

## Assigning the four seats

Each team should have exactly one:

- SOC Analyst
- Incident Responder
- Security Lead
- Communications Lead

Use invented aliases when assigning roles. Maintain any real-name-to-alias
mapping only in an approved system outside CoolHack.

## Mission controls

- **Change mission:** moves a team workspace to Missions 1–6.
- **Lock:** prevents students from editing the current mission.
- **Reopen:** allows student editing again.

Before changing missions, tell students to confirm that saving is complete.
Lock submitted work before review. Reopen only when revision is intentionally
allowed.

## Live review

The administrator can review all available sections, team rosters, role notes,
shared reports, AI transcripts, and private reflections. Use section filters to
avoid acting on the wrong class.

CoolHack is not a gradebook. Transfer any assessment result to the approved
course system; do not enter grades in CoolHack.

## Account and incident response

- Forgotten administrator password: use the dedicated project's email recovery
  process; check rate limits before retrying.
- Unknown professor request: do not authorize it.
- Exposed team code: pause enrollment, investigate whether an unexpected alias
  joined, and replace/rebuild the team if necessary.
- Suspected cross-team access: stop classroom use, preserve evidence, and review
  row-level security before continuing.
- Public secret exposure: rotate the affected secret immediately. A
  `service_role` key or database password must never be treated as safe merely
  because a commit was deleted.

## End of term

1. Lock all missions.
2. Export required, de-identified records.
3. Confirm grades and official records are stored only in the approved system.
4. Delete test accounts and data according to the approved retention decision.
5. Disable new registration.
6. Back up before any material deletion.
7. Document which sections were retired.

See [Backup and recovery](BACKUP_RECOVERY.md) before deleting data.
