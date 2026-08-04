import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://emilyemo.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
]);
const attempts = new Map<string, { count: number; resetAt: number }>();

function cors(origin: string | null) {
  const safeOrigin = origin && allowedOrigins.has(origin) ? origin : "https://emilyemo.github.io";
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function reply(origin: string | null, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

function allowedAttempt(req: Request, action: string) {
  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${ip}:${action}`;
  const windowMs = action === "create" ? 60 * 60_000 : 5 * 60_000;
  const limit = action === "create" ? 12 : 30;
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

async function tokenFor(role: string, username: string, classToken: string) {
  const source = role === "professor" ? `professor:${username}` : `${classToken}:${username}`;
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(bytes)).slice(0, 12)
    .map((value) => value.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return reply(origin, 405, { ok: false, message: "Method not allowed." });
  if (origin && !allowedOrigins.has(origin)) return reply(origin, 403, { ok: false, message: "Origin not allowed." });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(origin, 400, { ok: false, message: "Invalid request." });
  }

  const action = String(body.action || "");
  const role = String(body.role || "");
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const classToken = String(body.class_token || "").trim().toLowerCase();
  const teamId = String(body.team_id || "").trim();
  if (!allowedAttempt(req, action)) return reply(origin, 429, { ok: false, message: "Too many attempts. Wait a few minutes and try again." });
  if (action === "class_context") {
    if (!/^[a-f0-9]{36}$/.test(classToken)) return reply(origin, 404, { ok: false, message: "This class link is invalid." });
    const projectUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false } });
    const section = await admin.from("sections").select("id,name").eq("class_link_token", classToken).eq("is_active", true).maybeSingle();
    if (section.error || !section.data) return reply(origin, 404, { ok: false, message: "This class link is invalid or the class is archived." });
    const teams = await admin.from("teams").select("id,name,team_members(count)").eq("section_id", section.data.id).order("name");
    return reply(origin, 200, { ok: true, class_name: section.data.name, teams: (teams.data || []).map((team) => ({ id: team.id, name: team.name, member_count: team.team_members?.[0]?.count || 0 })).filter((team) => team.member_count < 4) });
  }
  if (!['create', 'signin'].includes(action) || !['professor', 'student'].includes(role)) {
    return reply(origin, 400, { ok: false, message: "Invalid account request." });
  }
  if (!/^[a-z0-9_-]{2,30}$/.test(username) || (role === "professor" && username.length < 3)) {
    return reply(origin, 400, { ok: false, message: "Use only letters, numbers, underscores, or hyphens in the username." });
  }
  if ((role === "professor" && password.length < 12) || (role === "student" && password.length < 10)) {
    return reply(origin, 400, { ok: false, message: "The CoolHack password is too short." });
  }
  if (role === "student" && !/^[a-f0-9]{36}$/.test(classToken)) {
    return reply(origin, 400, { ok: false, message: "Open the class link provided by your professor." });
  }

  const projectUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const publicAuth = createClient(projectUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = await tokenFor(role, username, classToken);
  const identifiers = [
    `${token}@emilyemo.github.io`,
    `${token}@${role === "professor" ? "professors" : "students"}.coolhack.example.com`,
    `${token}@${role === "professor" ? "professors" : "students"}.coolhack.invalid`,
  ];

  if (action === "create") {
    const suppliedMetadata = body.metadata && typeof body.metadata === "object"
      ? body.metadata as Record<string, unknown>
      : {};
    const userMetadata: Record<string, unknown> = role === "professor"
      ? { display_name: String(body.display_name || username).slice(0, 80), account_kind: "professor_self_service" }
      : {
          display_name: String(suppliedMetadata.display_name || username).slice(0, 80),
          class_token: classToken,
          account_kind: suppliedMetadata.account_kind === "student_team_creator" ? "student_team_creator" : "student_alias",
          team_id: suppliedMetadata.account_kind === "student_team_creator" ? "" : teamId,
          ...(suppliedMetadata.account_kind === "student_team_creator" ? {
            team_name: String(suppliedMetadata.team_name || "").trim().slice(0, 50),
          } : {}),
        };
    const created = await admin.auth.admin.createUser({
      email: identifiers[0],
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (created.error) {
      const duplicate = /already|registered|exists/i.test(created.error.message);
      return reply(origin, duplicate ? 409 : 400, {
        ok: false,
        message: duplicate
          ? "That username is already in use. Choose Sign in or use another username."
          : role === "professor"
            ? "The professor account could not be created. Check the username and try again."
            : "Student access could not be created. Check the class link and entries.",
      });
    }
    return reply(origin, 200, { ok: true });
  }

  // Kept for compatibility with older published clients. Current browsers sign
  // in directly so Auth and database requests share one client-side session.
  for (const identifier of identifiers) {
    const signedIn = await publicAuth.auth.signInWithPassword({ email: identifier, password });
    if (!signedIn.error && signedIn.data.session) {
      const { access_token, refresh_token, expires_at, expires_in, token_type } = signedIn.data.session;
      return reply(origin, 200, {
        ok: true,
        session: { access_token, refresh_token, expires_at, expires_in, token_type },
      });
    }
  }
  return reply(origin, 401, { ok: false, message: "That username or password did not match." });
});
