import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const classroom = readFileSync(new URL("../classroom.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../classroom.css", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../supabase/self-service-professor-migration.sql", import.meta.url),
  "utf8",
);

for (const role of ["Student", "Professor", "Administrator"]) {
  assert.ok(classroom.includes(`>${role}<`), `welcome page is missing ${role}`);
}

for (const required of [
  'account_kind:"professor_code_claim"',
  "Professor access code",
  'db.rpc("record_access_event"',
  'db.rpc("regenerate_professor_access_code"',
  "Recent successful sign-ins",
  "No approval queue",
]) {
  assert.ok(classroom.includes(required), `classroom.js is missing ${required}`);
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

const dollarQuotes = migration.match(/\$\$/g) || [];
assert.equal(dollarQuotes.length % 2, 0, "migration has unmatched dollar quotes");

console.log("CoolHack self-service access audit passed.");
