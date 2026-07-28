# Security and Privacy

## Purpose and scope

CoolHack is designed for de-identified instructional simulations. It is not an
institutional identity system, gradebook, evidence repository, or secure store
for real incident data.

## Data that must not be entered

- Real student or employee names
- Institutional or personal email addresses for professor/student aliases
- Student or employee IDs
- Phone numbers or addresses
- Grades or official education records
- Institutional, email, Supabase, or other passwords
- Real employer, client, patient, or incident data
- API keys, tokens, database passwords, or private answer keys

The platform administrator may use one dedicated, non-institutional project
email solely for account recovery.

## Security controls

- Supabase authentication for all live-classroom accounts
- Unique passwords for administrator, professors, and students
- Single-use professor access codes
- Automatic class assignment for the professor who claims the code
- Administrator-only audit of recent successful sign-ins
- Private team codes for student enrollment
- Row-level security on classroom tables
- Team-scoped live updates
- Mission locking
- Separate student reflections
- No privileged database credential in browser code

Interface hiding is not a security control. The administrator and professor
routes are separate for usability, but database authorization must still block
unauthorized access.

## Public configuration

The Supabase project URL and publishable/anonymous key are browser-safe public
values. They identify the project but do not bypass row-level security.

Never publish:

- the Supabase `service_role` key;
- a database password;
- a JWT secret;
- a personal access token;
- an email-provider secret; or
- a recovery code.

If a privileged secret is committed, rotate it immediately. Removing it from
the latest file does not erase it from Git history.

## Account design

Professor and student forms do not request email addresses. The browser derives
non-deliverable internal identifiers because Supabase password authentication
uses an email-shaped identifier internally. These derived values:

- are not verified inboxes;
- must not be treated as identities;
- do not replace passwords;
- may be predictable from a known username or team-code/alias pair; and
- are protected by the password, private codes, membership, and row-level policies.

## Privacy responsibilities

The deployment owner is responsible for:

- selecting an appropriate Supabase region and settings;
- reviewing applicable institutional policies and law;
- defining retention and deletion periods;
- responding to access incidents;
- controlling administrator access;
- keeping real-name-to-alias mappings outside CoolHack; and
- documenting any local changes to the data model.

Open source availability does not constitute institutional approval.

## Known limitations

- CoolHack is a teaching pilot and has not been independently certified.
- GitHub Pages is public; private material cannot be hidden in client-side
  source.
- The administrator is currently promoted through a manual SQL statement.
- Professor/student alias accounts depend on a project setting that permits
  account creation without inbox confirmation.
- The application does not provide a complete self-service alias password-reset
  workflow.
- A team code shared with the wrong person can permit an unwanted account to
  join before staff intervene.
- Browser-only case notes use local browser storage and are not a durable
  backup.
- Application review cannot guarantee secure deployment; database-policy and
  cross-account tests are required.

## Before classroom use

1. Review the SQL policies.
2. Complete [Security testing](SECURITY_TESTING.md).
3. Use invented test accounts from separate browser sessions.
4. Confirm cross-team and cross-section denial.
5. Confirm private reflections are not visible to teammates.
6. Confirm no privileged secret exists in the repository or Git history.
7. Establish a backup, incident-response, and deletion owner.

## Reporting a vulnerability

Do not open a public issue containing personal data, credentials, active team
codes, or exploit details. Use the repository owner's private security-reporting
channel if one is configured. A maintainer should acknowledge, reproduce,
contain, fix, test, and disclose the issue responsibly.
