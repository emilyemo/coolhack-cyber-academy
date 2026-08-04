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
const classLinkMigration = readFileSync(
  new URL("../supabase/simple-class-links.sql", import.meta.url),
  "utf8",
);
const independenceMigration = readFileSync(
  new URL("../supabase/professor-independence-ai-security.sql", import.meta.url),
  "utf8",
);
const usernameAuth = readFileSync(
  new URL("../supabase/functions/username-auth/index.ts", import.meta.url),
  "utf8",
);

for (const role of ["Student", "Professor", "Administrator"]) {
  assert.ok(classroom.includes(`>${role}<`), `welcome page is missing ${role}`);
}

for (const required of [
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
  'data-copy-link="${esc(section.class_link_token)}"',
  "Copy class link",
  "One website, three entrances",
  'data-section-summary="${section.id}"',
  'card.classList.toggle("classroom-hidden"',
  "First teammate:",
  "Other teammates:",
  "AI Security Brief",
  "AI security coaching guide",
  'db.functions.invoke("username-auth"',
  'action:"create",role:"professor"',
  'action:"signin",role:"student"',
  'action:"class_context"',
  'field("studentTeamId").value',
]) {
  assert.ok(classroom.includes(required), `classroom.js is missing ${required}`);
}

for (const forbidden of ["professors.coolhack.example.com", "students.coolhack.example.com", "professorAliasEmail", "aliasEmail(displayName", "signInWithAliasFallback"]) {
  assert.ok(!classroom.includes(forbidden), `browser authentication still exposes the old alias-email path: ${forbidden}`);
}

for (const required of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "admin.auth.admin.createUser",
  "email_confirm: true",
  "signInWithPassword",
  "allowedOrigins",
  "Too many attempts",
  'account_kind: "professor_self_service"',
  'action === "class_context"',
  'class_link_token',
]) {
  assert.ok(usernameAuth.includes(required), `username-auth function is missing ${required}`);
}
assert.ok(!usernameAuth.includes("console.log(serviceKey"), "service-role key must never be logged");
assert.ok(!usernameAuth.includes("session: { service"), "service-role key must never be returned");

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
  "class_link_token",
  "public.create_professor_section",
  "student_team_creator",
  "student_alias",
  "instructor_id = auth.uid()",
]) {
  assert.ok(classLinkMigration.includes(required), `class-link migration is missing ${required}`);
}

for (const forbidden of ["studentSectionCode", "studentTeamCode", "Regenerate team code", "Regenerate student section code", "Private team code:"]) {
  assert.ok(!classroom.includes(forbidden), `obsolete visible-code workflow returned: ${forbidden}`);
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
assert.ok(index.trimEnd().endsWith("</html>"), "index.html is missing its closing document tags");
assert.ok(index.includes("</script>\n</body>\n</html>"), "main page script is not closed before the document ends");
assert.ok(index.includes("const definedAcronyms = new Set()"), "one-time term definitions are missing");
assert.ok(index.includes('definedAcronyms.add(match[0])'), "defined terms are not tracked");
assert.ok(index.includes("Why an employer would care about this exercise"), "Scenario 1 employer relevance is missing");
assert.ok(index.includes("What you can tell an employer"), "Scenario 1 interview language is missing");
assert.ok(index.includes("The three-side interview anchor"), "AI cybersecurity interview anchor is missing");
assert.equal((index.match(/aiSecurity:\s*\{/g) || []).length, 6, "all six missions need an AI security challenge");
assert.ok(index.includes('id="aiSecurityBrief"'), "browser report is missing the AI Security Brief");
assert.ok(index.includes('window.addEventListener("coolhack:mission-release"'), "student mission gating is missing");
assert.ok(index.includes("applyMissionRelease(window.CoolHackReleasedMission || 0)"), "student pre-login gating is missing");
assert.ok(index.indexOf('tab.addEventListener("click"') < index.indexOf("decorateAcronyms();"), "primary tabs must bind before optional page enhancements");
assert.ok(index.includes('document.querySelector(`[data-view="${viewName}"]`)?.scrollIntoView'), "selected tab content must be brought into view");
assert.ok(classroom.includes("authTransition = true"), "username sign-in transition guard is missing");
assert.ok(classroom.includes("db.auth.refreshSession()"), "profile-load authorization recovery is missing");
assert.ok(!classroom.includes('const verification=await db.from("profiles")'), "professor registration must not race an immediate profile query");

const dollarQuotes = migration.match(/\$\$/g) || [];
assert.equal(dollarQuotes.length % 2, 0, "migration has unmatched dollar quotes");

console.log("CoolHack self-service access audit passed.");
