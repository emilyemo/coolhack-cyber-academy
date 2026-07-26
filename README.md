# CoolHack Cyber Academy

A mobile-friendly, student-facing cybersecurity role-play dashboard for the fictional organization **CoolHack Solutions**.

Students work through realistic incident-response missions, rotate through professional team roles, follow a five-phase investigation workflow, and download case notes for their course submissions and employment portfolios.

## Student workflow

1. Select a mission.
2. Review the scenario, evidence sources, deliverables, and decision point.
3. Work through the case in an assigned professional role.
4. Draft findings and decisions in the case-notes workspace.
5. Download the notes and submit them through the instructor-approved course system.

## Privacy and instructor materials

The public GitHub Pages site contains student-facing content only. Instructor answer keys, grading notes, and model responses must not be committed to this public repository.

The signed-in classroom uses nickname-based student access, Supabase
authentication, row-level security, cloud
saving, and real-time team updates. The older downloadable case-notes area
remains available as a backup. Students should never enter passwords, grades,
real incident data, or unnecessary private information in mission content.
The classroom does not request student email addresses, student IDs, or real
full names and is explicitly presented as an independent simulation.

## Supabase classroom

Run `supabase/schema.sql` once in the project's Supabase SQL Editor, then follow
`SUPABASE_SETUP.md`. Browser-safe connection values live in
`supabase-config.js`; never place a database password or `service_role` key in
the public repository.

## Publish with GitHub Pages

In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then save.

The expected site address is:

`https://emilyemo.github.io/coolhack-cyber-academy/`
