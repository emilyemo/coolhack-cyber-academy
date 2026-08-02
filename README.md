# CoolHack Cyber Academy

CoolHack Cyber Academy is an open, mobile-friendly cybersecurity role-play
environment for the fictional organization **CoolHack Solutions**. Teams of four
investigate realistic incidents, work from assigned professional roles, use an
AI tool as a questioning supervisor, produce one shared report, and complete
individual reflections.

> **Independent instructional simulation:** CoolHack is not an HCC system.
> Never enter institutional credentials, grades, student IDs, real incident
> data, or other personal information.

## What is included

- Six-mission student dashboard and evidence rooms
- Professor-controlled weekly scenario reveal/hide by class
- Scenario 1 professor launch script and student employer-relevance guide
- Clickable cybersecurity acronym refreshers
- Downloadable browser-only case notes
- Optional Supabase-backed live classroom
- Platform-administrator, professor, section, team, and student role separation
- Role-selection welcome page with separate student, professor, and administrator entrances
- Nickname-only student access and self-service professor accounts
- Professor-created classes with professor-to-professor isolation
- Six mandatory AI Security Challenges and interview-practice answers
- Shared five-sentence AI Security Brief in every mission
- Administrator access audit for recent successful sign-ins
- Row-level security and live team updates

The public repository intentionally contains **no instructor answer keys,
grading keys, model solutions, production secrets, or real student data**.

## Start here

| Goal | Guide |
|---|---|
| Understand the system | [Architecture](docs/ARCHITECTURE.md) |
| Deploy a new copy | [Installation](docs/INSTALLATION.md) |
| Operate the academy | [Administrator guide](docs/ADMIN_GUIDE.md) |
| Run a class section | [Professor guide](docs/PROFESSOR_GUIDE.md) |
| Join and complete a mission | [Student guide](docs/STUDENT_GUIDE.md) |
| Review privacy and access controls | [Security and privacy](docs/SECURITY_PRIVACY.md) |
| Test before classroom use | [Security test checklist](docs/SECURITY_TESTING.md) |
| Fix a problem | [Troubleshooting](docs/TROUBLESHOOTING.md) |
| Back up, restore, or retire a deployment | [Backup and recovery](docs/BACKUP_RECOVERY.md) |

## Quick start

The simplest public version needs only GitHub Pages:

1. Fork or copy this repository.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select `main` and `/(root)`, then save.
5. Open the Pages address shown by GitHub.

This publishes the missions and browser-only workspace. To enable accounts,
sections, cloud saving, live updates, and staff dashboards, complete the
[Supabase installation](docs/INSTALLATION.md).

## Account model

| Person | Sign-in information | Access |
|---|---|---|
| Platform administrator | One dedicated project email and CoolHack-only password | All sections |
| Professor | CoolHack username and CoolHack-only password; no email or administrator code requested | Classes created by that professor only |
| Student | Private team code, invented screen name, and CoolHack-only password; no email requested | Assigned team only |

The application internally converts professor usernames and student
team-code/screen-name combinations into non-deliverable authentication
identifiers. Those identifiers are implementation details and are not presented
as real email addresses.

## Classroom learning model

- Four students take four distinct roles.
- Each student maintains separate role notes.
- The team maintains one shared report and one shared AI transcript.
- The team completes one five-sentence AI Security Brief in every mission.
- Each student completes a private reflection of at least 100 words.
- The public evidence does not reveal the mission answer.
- Private instructor materials must be stored outside this repository.

## Configuration safety

`supabase-config.example.js` is the safe template. A deployed copy needs a
`supabase-config.js` containing only:

- the Supabase project URL; and
- the Supabase publishable/anonymous browser key.

These two values are designed to be public. Security depends on Supabase
authentication and row-level security. Never commit a database password,
JWT secret, access token, or `service_role` key.

## Project status

CoolHack is an instructional pilot. Review the [known limitations](docs/SECURITY_PRIVACY.md#known-limitations)
and complete the full [security test checklist](docs/SECURITY_TESTING.md) before
using a fork with students.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for safe contribution rules and
[CHANGELOG.md](CHANGELOG.md) for notable changes. The source is available under
the [MIT License](LICENSE). Mission content and third-party material remain
subject to any separately stated rights.
