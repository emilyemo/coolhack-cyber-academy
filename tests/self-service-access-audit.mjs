import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const classroom = readFileSync(new URL("../classroom.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../classroom.css", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../supabase/self-service-professor-migration.sql", import.meta.url),
  "utf8",
);
const releaseMigration = readFileSync(
  new URL("../supabase/weekly-scenario-release.sql", import.meta.url),
  "utf8",
);
const codeMigration = readFileSync(
  new URL("../supabase/code-regeneration.sql", import.meta.url),
  "utf8",
);
const independenceMigration = readFileSync(
  new URL("../supabase/professor-independence-ai-security.sql", import.meta.url),
  "utf8",
);

for (const role of ["Student", "Professor", "Administrator"]) {
  assert.ok(classroom.includes(`>${role}<`), `welcome page is missing ${role}`);
}

for (const required of [
  'account_kind:"professor_self_service"',
  "Create professor account",
  'db.rpc("record_access_event"',
  "Recent successful sign-ins",
  'db.rpc("create_professor_section"',
  "Preview student entrance",
  "The database enforces this boundary",
  "Teammates see the roster",
  'db.rpc("set_section_released_mission"',
  "Reveal selected scenario",
  "Hide scenario",
  'new CustomEvent("coolhack:mission-release"',
  "Scenario 1 professor launch guide",
  "What do we know from the evidence",
  "Professor answer guide",
  'db.rpc("get_professor_scenario_key"',
  'db.rpc("regenerate_section_code"',
  'db.rpc("regenerate_team_code"',
  "One website, three entrances",
  'data-section-summary="${section.id}"',
  'card.classList.toggle("classroom-hidden"',
  "rpcCodeValue",
  "replaceVisibleCode",
  "storedCode",
  "Team leader:",
  "Other three members:",
  "AI Security Brief",
  "AI security coaching guide",
  'student: "students.coolhack.example.com"',
  'professor: "professors.coolhack.example.com"',
  "signInWithAliasFallback",
]) {
  assert.ok(classroom.includes(required), `classroom.js is missing ${required}`);
}

assert.ok(
  !classroom.includes("return \`${token}@students.coolhack.invalid\`"),
  "student registration still uses the rejected .invalid email domain",
);
assert.ok(
  !classroom.includes("return \`${token}@professors.coolhack.invalid\`"),
  "professor registration still uses the rejected .invalid email domain",
);

for (const required of [
  "ai_security_brief",
  "public.create_professor_section",
  "professor_self_service",
  "set app_role = 'instructor'",
  "instructor_id = auth.uid()",
  "You may archive only your own active class",
]) {
  assert.ok(independenceMigration.includes(required), `independence migration is missing ${required}`);
}

for (const required of [
  "public.regenerate_section_code",
  "public.regenerate_team_code",
  "public.manages_team",
  "instructor_id = auth.uid()",
  "exit when new_code is distinct from old_code",
]) {
  assert.ok(codeMigration.includes(required), `code migration is missing ${required}`);
}

for (const forbidden of [
  "Assigned professor",
  "Assign later",
  "Pending professor request",
  'id="authorizeProfessor"',
  'id="sectionProfessor"',
]) {
  assert.ok(!classroom.includes(forbidden), `obsolete workflow returned: ${forbidden}`);
}

for (const required of [
  "professor_access_code",
  "public.access_events",
  "public.record_access_event",
  "public.regenerate_professor_access_code",
  "professor_code_claim",
  "and instructor_id is null",
  "set app_role = 'instructor'",
]) {
  assert.ok(migration.includes(required), `migration is missing ${required}`);
}

assert.ok(css.includes(".role-entry-grid"), "welcome-page layout is missing");
assert.ok(css.includes(".access-audit"), "access-audit layout is missing");
assert.ok(css.includes(".visibility-guide"), "visibility guidance is missing");
assert.ok(css.includes(".scenario-release"), "scenario-release controls are missing");

for (const required of [
  "released_mission",
  "public.set_section_released_mission",
  "s.instructor_id = auth.uid()",
  "requested_mission > 0",
]) {
  assert.ok(releaseMigration.includes(required), `release migration is missing ${required}`);
}

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(index.includes("const definedAcronyms = new Set()"), "one-time term definitions are missing");
assert.ok(index.includes('definedAcronyms.add(match[0])'), "defined terms are not tracked");
assert.ok(index.includes("Why an employer would care about this exercise"), "Scenario 1 employer relevance is missing");
assert.ok(index.includes("What you can tell an employer"), "Scenario 1 interview language is missing");
assert.ok(index.includes("The three-side interview anchor"), "AI cybersecurity interview anchor is missing");
assert.equal((index.match(/aiSecurity:\s*\{/g) || []).length, 6, "all six missions need an AI security challenge");
assert.ok(index.includes('id="aiSecurityBrief"'), "browser report is missing the AI Security Brief");
assert.ok(index.includes('window.addEventListener("coolhack:mission-release"'), "student mission gating is missing");
assert.ok(index.includes("applyMissionRelease(window.CoolHackReleasedMission || 0)"), "student pre-login gating is missing");

const dollarQuotes = migration.match(/\$\$/g) || [];
assert.equal(dollarQuotes.length % 2, 0, "migration has unmatched dollar quotes");

console.log("CoolHack self-service access audit passed.");
