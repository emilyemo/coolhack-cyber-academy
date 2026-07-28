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
7. Give the assigned professor the section's private section code.
8. One student in each group uses that section code to create the team and choose its neutral team name.
9. That student shares the generated private team code only with the other three teammates.
10. The assigned professor verifies the live roster and assigns the four distinct seats.

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

After creating a section, CoolHack displays its private section code. Give that
code only to the assigned professor. A team belongs to one section, and
professor visibility is derived from that relationship.

## Student-created teams and codes

1. The professor shares the section code with the class.
2. One student from each four-person group selects **Create a team**.
3. That student enters the section code, a neutral team name, an invented screen
   name, and a CoolHack-only password.
4. CoolHack creates the team and displays its private team code.
5. The team leader shares that team code only with the other three members.
6. The professor verifies the roster before assigning seats.

Do not post team codes in a general announcement. A team code is an enrollment
secret. Regenerate it if it is exposed before enrollment is complete.

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
