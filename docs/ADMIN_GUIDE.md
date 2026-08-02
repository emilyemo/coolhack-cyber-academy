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
2. Confirm the independent-professor migration is installed.
3. Each professor creates a professor account and their own class.
4. The professor gives students the generated student section code.
5. One student in each group uses the student section code to create the team.
6. That student shares the generated private team code only with the other
   three teammates.
7. The professor verifies the live roster and assigns the four distinct seats.

Do not store official section numbers, employee IDs, student IDs, real rosters,
or grades in CoolHack.

## Professor independence

Professors do not need an administrator code or approval. Each professor creates
their account and classes, manages their own codes and rosters, releases weekly
scenarios, and archives their own classes. The administrator retains academy-wide
visibility for monitoring and support. Test periodically that one professor
cannot retrieve or change another professor's section.

## Creating sections

Professors use neutral labels such as `Fall 2026 Thursday Capstone`, not official
institutional course records. CoolHack generates the student section code
automatically. A team belongs to one section, and professor visibility is
derived from that relationship.

## Reviewing access

The administrator dashboard lists recent successful sign-ins with the invented
username, role, entrance used, and time. It does not expose student email
identifiers. Use this list to confirm expected activity and investigate an
unexpected role or entrance.

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
- Unexpected professor account: preserve the access audit, disable the account
  in Supabase, and investigate before classroom use continues.
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
