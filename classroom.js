(() => {
  "use strict";
  const cfg = window.CoolHackConfig;
  const mount = document.querySelector("#classroomApp");
  if (!mount || !cfg || !window.supabase) return;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let currentUser = null;
  let profile = null;
  let membership = null;
  let channel = null;
  let saveTimer = null;
  let roster = [];
  const portal = new URLSearchParams(window.location.search).get("portal");
  const staffPortal = portal === "admin" || portal === "professor" || portal === "instructor";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const say = message => { const el = document.querySelector("#authMessage"); if (el) el.textContent = message; };
  const field = id => document.querySelector(`#${id}`);
  const normalizeAlias = value => value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  async function aliasEmail(displayName, teamCode) {
    const bytes = new TextEncoder().encode(`${teamCode.trim().toUpperCase()}:${normalizeAlias(displayName)}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const token = Array.from(new Uint8Array(digest)).slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join("");
    return `${token}@students.coolhack.invalid`;
  }
  async function professorAliasEmail(userName) {
    const bytes = new TextEncoder().encode(`professor:${normalizeAlias(userName)}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const token = Array.from(new Uint8Array(digest)).slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join("");
    return `${token}@professors.coolhack.invalid`;
  }

  function setPortalHeading(titleText, introText) {
    const title = document.querySelector("#classroom-title");
    const intro = title?.nextElementSibling;
    if (title) title.textContent = titleText;
    if (intro) intro.textContent = introText;
  }

  function renderWelcome() {
    document.body.classList.add("role-landing");
    setPortalHeading("Welcome to CoolHack Cyber Academy", "Choose your role to open the correct secure entrance.");
    mount.innerHTML = `
      <div class="role-welcome">
        <div class="instructions-lead"><strong>Choose how you are entering CoolHack.</strong><br>Students and professors use private classroom codes. The administrator uses the dedicated project account.</div>
        <div class="role-entry-grid">
          <a class="role-entry-card" href="?portal=student#classroom-access">
            <span class="role-entry-icon" aria-hidden="true">ST</span>
            <h3>Student</h3>
            <p>Create a team, join a team, or return to your team workspace.</p>
            <strong>Enter as a student →</strong>
          </a>
          <a class="role-entry-card" href="?portal=professor#classroom-access">
            <span class="role-entry-icon" aria-hidden="true">PR</span>
            <h3>Professor</h3>
            <p>Use the professor access code supplied for your class. No approval request is required.</p>
            <strong>Enter as a professor →</strong>
          </a>
          <a class="role-entry-card" href="?portal=admin#classroom-access">
            <span class="role-entry-icon" aria-hidden="true">AD</span>
            <h3>Administrator</h3>
            <p>Create classes, issue professor codes, and review access across the academy.</p>
            <strong>Enter as administrator →</strong>
          </a>
        </div>
      </div>`;
  }

  function renderAdministratorAccess(mode = "create") {
    const creating = mode === "create";
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Platform administrator only</strong><br>This is the only CoolHack account that uses an email address. Use a dedicated project email—not an institutional email or password.</div>
      <form class="classroom-card" id="administratorAccessForm" data-action="${mode}">
        <h3>${creating ? "Create administrator account" : "Administrator sign-in"}</h3>
        <p>${creating
          ? "First visit? Create your private CoolHack administrator account below."
          : "Use the dedicated CoolHack account you already created."}</p>
        <label for="instructorEmail">Dedicated CoolHack email</label><input id="instructorEmail" type="email" autocomplete="email" required>
        <label for="instructorPassword">${creating ? "Create a CoolHack password" : "CoolHack password"}</label><input id="instructorPassword" type="password" minlength="12" autocomplete="${creating ? "new-password" : "current-password"}" required>
        ${creating ? `<label for="instructorPasswordConfirm">Confirm CoolHack password</label><input id="instructorPasswordConfirm" type="password" minlength="12" autocomplete="new-password" required>
        <small>Use a new password made only for CoolHack. Do not reuse your email, HCC, or Supabase password.</small>` : ""}
        <div class="hero-actions"><button class="btn primary" type="submit">${creating ? "Create administrator account" : "Sign in"}</button></div>
        <button class="auth-switch" id="administratorModeSwitch" type="button">${creating ? "Already created your account? Sign in" : "First visit? Create administrator account"}</button>
      </form>
      <p class="auth-message" id="authMessage" role="status"></p>`;
    field("administratorAccessForm").addEventListener("submit", administratorAccess);
    field("administratorModeSwitch").addEventListener("click", () => renderAdministratorAccess(creating ? "signin" : "create"));
  }

  function renderProfessorAccess(mode = "signin") {
    const creating = mode === "create";
    setPortalHeading("CoolHack professor portal", "Sign in or activate the class code supplied by the platform administrator.");
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Professor access</strong><br>Use a CoolHack-only username and password. Do not use an institutional email, employee ID, or institutional password.</div>
      <div class="access-choice" aria-label="Professor access choices">
        <button class="btn ${creating ? "" : "primary"}" type="button" data-professor-mode="signin">Sign in</button>
        <button class="btn ${creating ? "primary" : ""}" type="button" data-professor-mode="create">First visit: activate class</button>
      </div>
      <form class="classroom-card" id="professorAccessForm" data-mode="${mode}">
        <h3>${creating ? "Activate professor access" : "Professor sign-in"}</h3>
        <p>${creating ? "Enter the private professor access code for your class. A valid unused code gives you immediate control of that class only." : "Use the same CoolHack username and password you created for this class."}</p>
        ${creating ? `<label for="professorClassCode">Professor access code</label><input id="professorClassCode" minlength="8" maxlength="12" pattern="[A-Za-z0-9]+" autocomplete="off" required>` : ""}
        <label for="professorAlias">Professor username</label><input id="professorAlias" minlength="3" maxlength="30" pattern="[A-Za-z0-9_-]+" autocomplete="username" required>
        <small>Use letters, numbers, underscores, or hyphens. This is a CoolHack username—not an email address.</small>
        <label for="professorPassword">${creating ? "Create a CoolHack password" : "CoolHack password"}</label><input id="professorPassword" type="password" minlength="12" autocomplete="${creating ? "new-password" : "current-password"}" required>
        ${creating ? `<label for="professorPasswordConfirm">Confirm CoolHack password</label><input id="professorPasswordConfirm" type="password" minlength="12" autocomplete="new-password" required>` : ""}
        <p class="auth-message inline-auth-message" id="authMessage" role="status"></p>
        <div class="hero-actions"><button class="btn primary" type="submit">${creating ? "Activate my class" : "Sign in"}</button></div>
      </form>
      `;
    field("professorAccessForm").addEventListener("submit", professorAccess);
    document.querySelectorAll("[data-professor-mode]").forEach(button =>
      button.addEventListener("click", () => renderProfessorAccess(button.dataset.professorMode))
    );
  }

  function authScreen() {
    document.body.classList.remove("role-landing");
    if (!portal) {
      renderWelcome();
      return;
    }
    if (portal === "admin") {
      setPortalHeading("CoolHack administrator portal", "Sign in to create classes, issue access codes, and review academy activity.");
      renderAdministratorAccess();
      return;
    }
    if (portal === "professor" || portal === "instructor") {
      renderProfessorAccess();
      return;
    }
    setPortalHeading("CoolHack student portal", "Create a team, join a team, or return to your live team workspace.");
    window.CoolHackReleasedMission = 0;
    window.dispatchEvent(new CustomEvent("coolhack:mission-release",{detail:{mission:0}}));
    renderStudentAccess();
  }

  function renderStudentAccess(mode = "signin") {
    const signingIn = mode === "signin";
    const joining = mode === "join";
    const creatingTeam = mode === "create-team";
    const title = signingIn ? "Student sign-in" : joining ? "Join an existing team" : "Create a new team";
    const intro = signingIn
      ? "Returning student? Use the same private team code, invented screen name, and CoolHack password."
      : joining
        ? "Use the private team code shared by your team leader."
        : "One student starts the team with the professor's section code and chooses the team name. CoolHack will create the private team code for the other three students.";
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Independent classroom simulation</strong><br>CoolHack is not an HCC system. Use an invented screen name—never an HCC email, student ID, official password, grade, or other personal information.</div>
      <div class="visibility-guide student-team-guide"><strong>Starting a team?</strong><span><b>Team leader:</b> choose <b>Create a team</b> first. CoolHack will give you a private team code.</span><span><b>Other three members:</b> choose <b>Join a team</b> and enter the code shared by your team leader.</span></div>
      <div class="access-choice" aria-label="Student access choices">
        <button class="btn ${signingIn ? "primary" : ""}" type="button" data-student-mode="signin">Sign in</button>
        <button class="btn ${creatingTeam ? "primary" : ""}" type="button" data-student-mode="create-team">Create a team</button>
        <button class="btn ${joining ? "primary" : ""}" type="button" data-student-mode="join">Join a team</button>
      </div>
      <form class="classroom-card" id="studentAccessForm" data-mode="${mode}">
        <h3>${title}</h3><p>${intro}</p>
        ${creatingTeam ? `
          <label for="studentSectionCode">Professor's section code</label><input id="studentSectionCode" minlength="8" maxlength="12" pattern="[A-Za-z0-9]+" autocomplete="off" required>
          <label for="studentTeamName">Team name</label><input id="studentTeamName" minlength="2" maxlength="50" placeholder="Example: Team Phoenix" required>
        ` : `
          <label for="studentTeamCode">Private team code</label><input id="studentTeamCode" minlength="6" maxlength="12" pattern="[A-Za-z0-9]+" autocomplete="off" required>
        `}
        <label for="studentAlias">Invented screen name</label><input id="studentAlias" minlength="2" maxlength="30" pattern="[A-Za-z0-9_-]+" autocomplete="username" aria-describedby="aliasHelp" required>
        <small id="aliasHelp">Use letters, numbers, underscores, or hyphens. Do not use your real full name or student ID.</small>
        <label for="studentPassword">${signingIn ? "CoolHack password" : "Create a private CoolHack password"}</label><input id="studentPassword" type="password" minlength="10" autocomplete="${signingIn ? "current-password" : "new-password"}" required>
        <div class="hero-actions"><button class="btn primary" type="submit">${signingIn ? "Sign in" : joining ? "Create access and join team" : "Create team and access"}</button></div>
      </form>
      <p class="auth-message" id="authMessage" role="status"></p>`;
    field("studentAccessForm").addEventListener("submit", studentAccess);
    document.querySelectorAll("[data-student-mode]").forEach(button =>
      button.addEventListener("click", () => renderStudentAccess(button.dataset.studentMode))
    );
  }

  async function administratorAccess(event) {
    event.preventDefault();
    const action=event.currentTarget.dataset.action||"create";
    const email=field("instructorEmail").value.trim();
    const password=field("instructorPassword").value;
    say(action==="create"?"Creating project account…":"Signing in…");
    if(action==="create"){
      if(password!==field("instructorPasswordConfirm").value){
        say("The two CoolHack passwords do not match.");
        return;
      }
      const displayName=email.split("@")[0].slice(0,80);
      const {error}=await db.auth.signUp({email,password,options:{data:{display_name:displayName,account_kind:"staff_pending"}}});
      say(error?error.message:"Administrator account created. Confirm the project email if requested. We will then activate this account as the platform administrator in Supabase.");
      return;
    }
    const { error } = await db.auth.signInWithPassword({email,password});
    if (error) say(error.message);
  }
  async function professorAccess(event) {
    event.preventDefault();
    const action=event.currentTarget.dataset.mode||"signin";
    const displayName=field("professorAlias").value.trim();
    const password=field("professorPassword").value;
    say(action==="create"?"Activating your class…":"Signing in…");
    try {
      const email=await professorAliasEmail(displayName);
      if(action==="create"){
        if(password!==field("professorPasswordConfirm").value){
          say("The two CoolHack passwords do not match.");
          return;
        }
        const signup=await db.auth.signUp({
          email,
          password,
          options:{data:{
            display_name:displayName,
            account_kind:"professor_code_claim",
            professor_code:field("professorClassCode").value.trim().toUpperCase()
          }}
        });
        if(signup.error){
          say(`Activation failed: ${signup.error.message}`);
          return;
        }
        if(signup.data.user && Array.isArray(signup.data.user.identities) && signup.data.user.identities.length===0){
          say("That professor username is already in use. Choose Sign in, or activate the class with a different username.");
          return;
        }
        let session=signup.data.session;
        if(!session){
          const login=await db.auth.signInWithPassword({email,password});
          if(login.error){
            say("The account was created but could not sign in. CoolHack email confirmation must be disabled for invented professor usernames.");
            return;
          }
          session=login.data.session;
        }
        const verification=await db.from("profiles").select("app_role").eq("id",session.user.id).single();
        if(verification.error||verification.data?.app_role!=="instructor"){
          await db.auth.signOut();
          say("Activation did not assign this account as a professor. The access code may be invalid, inactive, or already claimed.");
          return;
        }
        say("Professor access verified. Opening your assigned class…");
      } else {
        const {error}=await db.auth.signInWithPassword({email,password});
        if(error)say("That professor username or password did not match. If this is your first visit, choose “First visit: activate class.”");
      }
    } catch (_error) {
      say("Professor access could not be created. Check the entries and try again.");
    }
  }
  async function studentAccess(event) {
    event.preventDefault();
    const mode = event.currentTarget.dataset.mode || "signin";
    const displayName = field("studentAlias").value.trim();
    const password = field("studentPassword").value;
    const creatingTeam = mode === "create-team";
    const joinCode = creatingTeam ? secureTeamCode() : field("studentTeamCode").value.trim().toUpperCase();
    say(mode === "signin" ? "Signing in…" : creatingTeam ? "Creating your team…" : "Joining your team…");
    try {
      const email = await aliasEmail(displayName, joinCode);
      if (mode === "signin") {
        const { error } = await db.auth.signInWithPassword({email, password});
        if (error) say("That team code, screen name, or password did not match.");
        return;
      }
      const metadata = {
        display_name: displayName,
        join_code: joinCode,
        account_kind: creatingTeam ? "student_team_creator" : "student_alias"
      };
      if (creatingTeam) {
        metadata.section_code = field("studentSectionCode").value.trim().toUpperCase();
        metadata.team_name = field("studentTeamName").value.trim();
      }
      const { error } = await db.auth.signUp({email, password, options:{data:metadata}});
      say(error
        ? error.message
        : creatingTeam
          ? `Team created. Your private team code is ${joinCode}. Share it only with your other three teammates.`
          : "Access created and you have joined the team. If the workspace does not open automatically, choose Sign in.");
    } catch (_error) {
      say(creatingTeam
        ? "The team could not be created. Check the section code and use a team name that is not already taken."
        : "Student access could not be created. Check the entries and try again.");
    }
  }

  async function loadProfile() {
    const result = await db.from("profiles").select("*").eq("id", currentUser.id).single();
    if (result.error) throw result.error;
    profile = result.data;
  }

  function accountBar(extra="") {
    return `<div class="account-bar"><p><span class="live-dot"></span>Signed in as <strong>${esc(profile.display_name)}</strong> · ${esc(profile.app_role)}</p><div class="account-actions">${extra}${["instructor","platform_admin"].includes(profile.app_role)?`<a class="btn" href="?portal=student#classroom-access" target="_blank" rel="noopener">Preview student entrance</a>`:""}<button class="btn" id="signOut" type="button">Sign out</button></div></div>`;
  }

  async function studentScreen() {
    const m = await db.from("team_members").select("team_id,assigned_role,teams(id,name,join_code,active_mission,mission_locked,sections(released_mission))").eq("user_id",currentUser.id).maybeSingle();
    if (m.error) throw m.error;
    membership = m.data;
    if (!membership) {
      mount.innerHTML = accountBar() + `<div class="classroom-card"><h3>Account ready—team assignment pending</h3><p>Your instructor has not assigned this account to a team yet. Leave this page open or sign in again after the instructor assigns you.</p></div>`;
      bindSignOut(); return;
    }
    const teamId = membership.team_id;
    const mission = Number(membership.teams.sections?.released_mission || 0);
    window.CoolHackReleasedMission = mission;
    window.dispatchEvent(new CustomEvent("coolhack:mission-release",{detail:{mission}}));
    if (!mission) {
      mount.innerHTML = accountBar() + `
        <div class="classroom-card scenario-waiting">
          <span class="card-kicker">Weekly activity</span>
          <h3>Your professor has not revealed this week's scenario yet</h3>
          <p>Your account and team are ready. Return after your professor opens the activity; no previous work will be lost.</p>
        </div>`;
      bindSignOut();
      return;
    }
    const [rosterResult, notesResult, reportResult, reflectionResult] = await Promise.all([
      db.from("team_members").select("user_id,assigned_role,profiles(display_name)").eq("team_id",teamId),
      db.from("role_notes").select("*").eq("team_id",teamId).eq("mission_number",mission),
      db.from("team_reports").select("*").eq("team_id",teamId).eq("mission_number",mission).maybeSingle(),
      db.from("reflections").select("*").eq("team_id",teamId).eq("mission_number",mission).eq("student_id",currentUser.id).maybeSingle()
    ]);
    roster = rosterResult.data || [];
    const report = reportResult.data || {};
    const myNote = (notesResult.data || []).find(n => n.author_id === currentUser.id)?.note_text || "";
    mount.innerHTML = accountBar(`<span class="cloud-state" id="cloudState">Cloud connected</span> `) + `
      <div class="instructions-lead"><strong>${esc(membership.teams.name)} · Mission ${mission}</strong><br>Private team code: <code>${esc(membership.teams.join_code)}</code> · Your seat: ${esc(membership.assigned_role || "Not assigned")}. Share the code only with your other three teammates.</div>
      <div class="visibility-guide"><strong>Who can see this work?</strong><span>Teammates see the roster, live role notes, and shared report.</span><span>Your private reflection is visible only to you, your assigned professor, and the platform administrator.</span></div>
      <div class="classroom-grid">
        <aside class="classroom-card"><h3>Team roster</h3><ul class="roster">${roster.map(x=>`<li><strong>${esc(x.profiles?.display_name)}</strong><br>${esc(x.assigned_role||"Role pending")}</li>`).join("")}</ul><h3>Live role notes</h3><div id="teamNotes">${(notesResult.data||[]).map(n=>`<p data-note-author="${n.author_id}"><strong>${esc(roster.find(r=>r.user_id===n.author_id)?.profiles?.display_name||"Team member")}:</strong> ${esc(n.note_text)}</p>`).join("")||"<p>No notes yet.</p>"}</div></aside>
        <div>
          <div class="classroom-card"><h3>My role notes</h3><label for="liveRoleNotes">What I observe and recommend</label><textarea id="liveRoleNotes" ${membership.teams.mission_locked?"disabled":""}>${esc(myNote)}</textarea></div>
          <form class="classroom-card" id="sharedReport">
            <h3>Shared team report</h3>
            ${["findings","timeline","decision","unknowns","ai_transcript","ai_feedback"].map(k=>`<label for="cloud_${k}">${k.replaceAll("_"," ")}</label><textarea id="cloud_${k}" data-report-field="${k}" ${membership.teams.mission_locked?"disabled":""}>${esc(report[k]||"")}</textarea>`).join("")}
            <p class="cloud-state">Everyone on this team can see this report. Coordinate before editing the same section.</p>
          </form>
          <div class="classroom-card"><h3>My private reflection</h3><p>Your teammates cannot read this reflection. Your instructor can.</p><textarea id="privateReflection" ${reflectionResult.data?.submitted_at?"disabled":""}>${esc(reflectionResult.data?.reflection_text||"")}</textarea></div>
        </div>
      </div>`;
    bindSignOut();
    bindStudentSaving(teamId, mission);
    subscribe(teamId, mission);
  }

  function bindStudentSaving(teamId, mission) {
    field("liveRoleNotes")?.addEventListener("input", event => {
      clearTimeout(saveTimer); status("Saving role notes…");
      saveTimer=setTimeout(async()=>{ const {error}=await db.from("role_notes").upsert({team_id:teamId,mission_number:mission,author_id:currentUser.id,note_text:event.target.value,updated_at:new Date().toISOString()},{onConflict:"team_id,mission_number,author_id"}); status(error?error.message:"Role notes saved"); },650);
    });
    document.querySelectorAll("[data-report-field]").forEach(el=>el.addEventListener("input",()=>{
      clearTimeout(saveTimer); status("Saving shared report…");
      saveTimer=setTimeout(async()=>{ const payload={team_id:teamId,mission_number:mission,last_editor:currentUser.id,updated_at:new Date().toISOString()}; document.querySelectorAll("[data-report-field]").forEach(x=>payload[x.dataset.reportField]=x.value); const {error}=await db.from("team_reports").upsert(payload,{onConflict:"team_id,mission_number"}); status(error?error.message:"Shared report saved"); },700);
    }));
    field("privateReflection")?.addEventListener("input",event=>{
      clearTimeout(saveTimer); status("Saving private reflection…");
      saveTimer=setTimeout(async()=>{ const {error}=await db.from("reflections").upsert({team_id:teamId,mission_number:mission,student_id:currentUser.id,reflection_text:event.target.value,updated_at:new Date().toISOString()},{onConflict:"team_id,mission_number,student_id"}); status(error?error.message:"Private reflection saved"); },700);
    });
  }
  function status(text) { if(field("cloudState")) field("cloudState").textContent=text; }
  function subscribe(teamId, mission) {
    channel=db.channel(`team-${teamId}-${mission}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"role_notes",filter:`team_id=eq.${teamId}`},payload=>{
        if(payload.new.author_id===currentUser.id)return;
        const author=roster.find(r=>r.user_id===payload.new.author_id)?.profiles?.display_name||"Team member";
        let row=document.querySelector(`[data-note-author="${payload.new.author_id}"]`);
        if(!row){row=document.createElement("p");row.dataset.noteAuthor=payload.new.author_id;field("teamNotes").appendChild(row);}
        row.innerHTML=`<strong>${esc(author)}:</strong> ${esc(payload.new.note_text)}`;
        status("Teammate role notes updated");
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"team_reports",filter:`team_id=eq.${teamId}`},payload=>{
        if(payload.new.last_editor===currentUser.id)return;
        Object.entries(payload.new).forEach(([k,v])=>{const el=document.querySelector(`[data-report-field="${k}"]`);if(el&&document.activeElement!==el)el.value=v||"";});
        status("Teammate update received");
      }).subscribe();
  }

  function secureTeamCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
  }

  const sectionOptions = (sections, selected="") =>
    `<option value="">Choose a section</option>${sections.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${esc(s.name)}</option>`).join("")}`;

  function formatAccessTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, {dateStyle:"medium", timeStyle:"short"}).format(new Date(value));
  }

  function rpcCodeValue(data) {
    if (typeof data === "string") return data;
    if (Array.isArray(data) && data.length === 1) return rpcCodeValue(data[0]);
    if (data && typeof data === "object") {
      const value = Object.values(data).find(item => typeof item === "string");
      if (value) return value;
    }
    return "";
  }

  function replaceVisibleCode(button, code, kind) {
    const card = button.closest("[data-section-summary], .team-operation");
    const display = card?.querySelector(`[data-code-display="${kind}"]`);
    const copy = card?.querySelector(`[data-copy-kind="${kind}"]`);
    if (display) display.textContent = code;
    if (copy) copy.dataset.copyCode = code;
  }

  async function storedCode(table, id, column) {
    const result = await db.from(table).select(column).eq("id", id).single();
    return {code: result.data?.[column] || "", error: result.error};
  }

  async function staffScreen() {
  const isAdmin=profile.app_role==="platform_admin";
    const sectionFields=isAdmin
    ?"id,name,class_code,professor_access_code,instructor_id,is_active,released_mission,profiles!sections_instructor_id_fkey(display_name)"
    :"id,name,class_code,instructor_id,is_active,released_mission,profiles!sections_instructor_id_fkey(display_name)";
  const accessPromise=isAdmin
    ? db.from("access_events").select("id,portal,app_role,accessed_at,profiles(display_name)").order("accessed_at",{ascending:false}).limit(30)
    : Promise.resolve({data:[],error:null});
  const answerKeyPromise=profile.app_role==="instructor"
    ? db.rpc("get_professor_scenario_key",{requested_mission:1})
    : Promise.resolve({data:null,error:null});
  const [sectionsResult,teamsResult,profilesResult,membersResult,accessResult,answerKeyResult]=await Promise.all([
    db.from("sections").select(sectionFields).eq("is_active",true).order("name"),
    db.from("teams").select("*").order("name"),
    db.from("profiles").select("id,display_name,app_role").order("display_name"),
    db.from("team_members").select("team_id,user_id,assigned_role,profiles(display_name)"),
    accessPromise,
    answerKeyPromise
  ]);
  const queryError=[sectionsResult,teamsResult,profilesResult,membersResult,accessResult].find(result=>result.error)?.error;if(queryError)throw queryError;
  const sections=sectionsResult.data||[],teams=teamsResult.data||[],profiles=profilesResult.data||[],members=membersResult.data||[],accessEvents=accessResult.data||[];
  const answerKey=answerKeyResult.error?null:answerKeyResult.data;
  const professors=profiles.filter(p=>p.app_role==="instructor");
  const title=isAdmin?"Platform administrator dashboard":"Professor dashboard";
  const lead=isAdmin?"Create classes, share one-time professor codes, and review activity across the academy.":"Manage only your assigned class, share its student section code, assign seats, and review submissions.";
  mount.innerHTML=accountBar()+`
    <div class="admin-hero"><div><span class="eyebrow">${isAdmin?"Academy control center":"Section operations"}</span><h3>${title}</h3><p>${lead}</p></div><span class="privacy-badge">De-identified classroom data only</span></div>
    <div class="visibility-guide"><strong>One website, three entrances</strong><span>Student, Professor, and Administrator are role-based entrances to this same CoolHack website and database—not three separate sites.</span></div>
    <div class="visibility-guide staff-visibility"><strong>${isAdmin?"Administrator visibility":"Professor visibility"}</strong><span>${isAdmin?"You can review every class, professor, team, student alias, and submission in CoolHack.":"You can review only the class assigned to your account and its teams, student aliases, shared work, and private reflections."}</span><span>The database enforces this boundary; it is not merely hidden by the dashboard.</span></div>
    <div class="guided-workflow" aria-label="Classroom setup sequence"><span><b>1</b> Admin creates class</span><span><b>2</b> Professor claims code</span><span><b>3</b> Student creates team</span><span><b>4</b> Teammates join</span><span><b>5</b> Professor assigns seats</span></div>
    <div class="admin-stats" aria-label="Classroom overview"><div><strong>${sections.length}</strong><span>Active sections</span></div><div><strong>${teams.length}</strong><span>Teams</span></div><div><strong>${members.length}</strong><span>Student accounts</span></div><div><strong>${teams.filter(t=>!t.mission_locked).length}</strong><span>Open workspaces</span></div></div>
    ${isAdmin?`<div class="admin-panel-grid">
      <form class="classroom-card" id="createSection"><span class="card-kicker">Create class</span><h3>Open a Capstone class</h3><p>CoolHack generates a private professor code automatically. Give it to the intended professor; the first valid claim takes control of this class only.</p><label for="sectionName">Class label</label><input id="sectionName" placeholder="Example: Capstone Section 1" maxlength="80" required><div class="hero-actions"><button class="btn primary">Create class and code</button></div><p id="sectionMessage" class="form-message" role="status"></p></form>
      <div class="classroom-card"><span class="card-kicker">Automatic access</span><h3>No approval queue</h3><p>You do not type a professor's name here and no request waits for approval. Create the class, copy its professor code below, and send it privately. After activation, the professor appears on that class automatically.</p></div>
    </div>`:""}
    <div class="admin-panel-grid">
      <div class="classroom-card"><span class="card-kicker">Student self-service</span><h3>Students create their teams</h3><p>The professor shares the student section code. One student chooses the team name and creates the team; the other three join with the generated team code.</p></div>
      <div class="classroom-card"><span class="card-kicker">Professor control</span><h3>Professor manages the live roster</h3><p>Teams appear automatically. The professor sees only this class and assigns the four distinct seats.</p></div>
    </div>
    ${sections.some(section=>Number(section.released_mission)===1)?`
      <section class="classroom-card professor-briefing">
        <span class="card-kicker">Scenario 1 professor launch guide</span>
        <h3>Introducing “The Urgent Invoice”</h3>
        <p><strong>Suggested opening:</strong> “Today, you are the incident-response team at CoolHack Solutions. A finance employee received what appears to be an urgent vendor invoice, clicked the link, and then reported it. Your job is not to guess whether it is phishing. Your job is to examine the available evidence, identify what is confirmed, explain what is still uncertain, and recommend a defensible response.”</p>
        <p><strong>Set the workplace expectation:</strong> “Each person has a different professional responsibility, but the team owns one decision. Refer to evidence by artifact number, challenge unsupported claims respectfully, and document why your recommended action is proportionate to the risk.”</p>
        <p><strong>Before teams begin:</strong> Remind students not to enter real names, passwords, employer information, or institutional data into the AI role-play. Tell them to record their initial conclusion before opening the AI supervisor so they can show how their reasoning improved.</p>
        <details><summary>Discussion prompts for the professor</summary><ul>
          <li>What do we know from the evidence, and what are we merely assuming?</li>
          <li>Which artifact most strongly supports the team’s current conclusion?</li>
          <li>What could have been exposed after the click?</li>
          <li>What response protects the organization without causing unnecessary disruption?</li>
          <li>How would you explain the next action to the affected employee in plain language?</li>
        </ul></details>
        ${answerKey?`<details class="professor-answer-key"><summary>Professor answer guide</summary>
          <p><strong>Recommended conclusion:</strong> ${esc(answerKey.conclusion)}</p>
          <p><strong>Confirmed findings:</strong> ${esc(answerKey.confirmed)}</p>
          <p><strong>Important uncertainties:</strong> ${esc(answerKey.uncertainties)}</p>
          <p><strong>Proportionate response:</strong> ${esc(answerKey.response)}</p>
          <p><strong>Evidence to collect next:</strong> ${esc(answerKey.next_evidence)}</p>
          <p><strong>Discussion standard:</strong> ${esc(answerKey.discussion_standard)}</p>
        </details>`:`<p class="auth-message">The private professor answer guide is temporarily unavailable. Student-facing files do not contain the answer key.</p>`}
        <details><summary>Closing debrief</summary><p>Ask each team to state its decision, strongest evidence, remaining uncertainty, and first recommended action in sixty seconds. Close by connecting evidence handling, escalation, documentation, and professional communication to entry-level security operations work.</p></details>
      </section>`:""}
    <section class="classroom-card operations-board"><div class="operations-head"><div><span class="card-kicker">Live operations</span><h3>Sections, teams, and mission progress</h3></div><label for="sectionFilter">Show section<select id="sectionFilter"><option value="all">All available sections</option>${sections.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label></div>
      <div class="section-summary">${sections.map(section=>`<article data-section-summary="${section.id}"><strong>${esc(section.name)}</strong><span>${section.profiles?.display_name?`Professor: ${esc(section.profiles.display_name)}`:"Awaiting professor activation"}</span><small>Student section code: <code data-code-display="section">${esc(section.class_code)}</code> · ${teams.filter(t=>t.section_id===section.id).length} teams</small><div class="section-code-actions"><button class="btn compact" type="button" data-copy-kind="section" data-copy-code="${esc(section.class_code)}">Copy student section code</button><button class="btn compact" type="button" data-section-code-refresh="${section.id}">Regenerate student section code</button></div><div class="scenario-release"><label>Weekly scenario<select data-section-mission="${section.id}"><option value="0" ${Number(section.released_mission)===0?"selected":""}>Hidden</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(section.released_mission)===n?"selected":""}>Scenario ${n}</option>`).join("")}</select></label><button class="btn compact primary" type="button" data-scenario-reveal="${section.id}">${Number(section.released_mission)>0?"Change revealed scenario":"Reveal selected scenario"}</button>${Number(section.released_mission)>0?`<button class="btn compact" type="button" data-scenario-hide="${section.id}">Hide scenario</button>`:""}<small>${Number(section.released_mission)>0?`Students can access Scenario ${section.released_mission} only.`:"All scenarios are hidden from students."}</small></div>${isAdmin?(section.instructor_id?`<small>Professor access: already claimed; no professor code is needed now.</small>`:`<small>One-time professor access code: <code data-code-display="professor">${esc(section.professor_access_code)}</code></small><div class="section-code-actions"><button class="btn compact" type="button" data-copy-kind="professor" data-copy-code="${esc(section.professor_access_code)}">Copy professor code</button><button class="btn compact" type="button" data-professor-code-refresh="${section.id}">Regenerate professor code</button></div>`)+`<div class="section-danger-actions"><button class="btn compact danger" type="button" data-section-archive="${section.id}" data-section-name="${esc(section.name)}">Archive section</button><small>Archives the class without deleting student work.</small></div>`:""}</article>`).join("")||"<p>Create a class to begin.</p>"}</div>
      <div id="teamOperations">${renderTeamOperations(teams,sections,members,professors,isAdmin)}</div><div id="staffReview" aria-live="polite"></div>
    </section>
    ${isAdmin?`<details class="classroom-card access-audit"><summary><span><span class="card-kicker">Access audit</span><strong>Recent successful sign-ins</strong></span><span>${accessEvents.length} records</span></summary><p>CoolHack records role-based access without displaying student emails.</p><div class="audit-list">${accessEvents.map(event=>`<article><strong>${esc(event.profiles?.display_name||"Account")}</strong><span>${esc(event.app_role)} · ${esc(event.portal)}</span><time datetime="${esc(event.accessed_at)}">${esc(formatAccessTime(event.accessed_at))}</time></article>`).join("")||"<p>No successful sign-ins have been recorded yet.</p>"}</div></details>`:""}`;
  bindSignOut();
  field("sectionFilter")?.addEventListener("change",event=>{
    const selected=event.target.value;
    const visible=selected==="all"?teams:teams.filter(t=>t.section_id===selected);
    document.querySelectorAll("[data-section-summary]").forEach(card=>{
      card.classList.toggle("classroom-hidden",selected!=="all"&&card.dataset.sectionSummary!==selected);
    });
    field("teamOperations").innerHTML=renderTeamOperations(visible,sections,members,professors,isAdmin);
    bindOperationButtons();
  });
  field("createSection")?.addEventListener("submit",async event=>{event.preventDefault();const result=await db.from("sections").insert({name:field("sectionName").value.trim(),created_by:currentUser.id}).select("name,professor_access_code").single();field("sectionMessage").textContent=result.error?result.error.message:`${result.data.name} created. Professor code: ${result.data.professor_access_code}`;if(!result.error)setTimeout(staffScreen,1000);});
  document.querySelectorAll("[data-professor-code-refresh]").forEach(button=>button.addEventListener("click",async()=>{button.disabled=true;button.textContent="Generating…";const oldCode=button.closest("[data-section-summary]")?.querySelector('[data-code-display="professor"]')?.textContent.trim()||"";const result=await db.rpc("regenerate_professor_access_code",{requested_section:button.dataset.professorCodeRefresh});const stored=await storedCode("sections",button.dataset.professorCodeRefresh,"professor_access_code");const code=stored.code||rpcCodeValue(result.data);const failed=result.error||stored.error||!code||code===oldCode;field("staffReview").innerHTML=`<p class="${failed?"auth-message":"form-message"}">${esc(result.error?`Professor code was not changed: ${result.error.message}`:stored.error?`The new professor code could not be verified: ${stored.error.message}`:!code?"No new professor code was returned.":code===oldCode?"The stored professor code did not change. Please try again.":`Professor code regenerated and verified. Old code: ${oldCode}. New code: ${code}`)}</p>`;if(!failed)replaceVisibleCode(button,code,"professor");button.disabled=false;button.textContent="Regenerate professor code";}));
  bindOperationButtons();
  function showOperationResult(message,isError=false){field("staffReview").innerHTML=`<p class="${isError?"auth-message":"form-message"}">${esc(message)}</p>`;}
  function bindOperationButtons(){
    document.querySelectorAll("[data-copy-code]").forEach(button=>button.addEventListener("click",async()=>{await navigator.clipboard.writeText(button.dataset.copyCode);button.textContent="Code copied";setTimeout(()=>button.textContent="Copy code",1200);}));
    document.querySelectorAll("[data-section-code-refresh]").forEach(button=>button.addEventListener("click",async()=>{button.disabled=true;button.textContent="Generating…";const oldCode=button.closest("[data-section-summary]")?.querySelector('[data-code-display="section"]')?.textContent.trim()||"";const result=await db.rpc("regenerate_section_code",{requested_section:button.dataset.sectionCodeRefresh});const stored=await storedCode("sections",button.dataset.sectionCodeRefresh,"class_code");const code=stored.code||rpcCodeValue(result.data);if(result.error||stored.error||!code||code===oldCode){showOperationResult(result.error?`Student section code was not changed: ${result.error.message}`:stored.error?`The new student section code could not be verified: ${stored.error.message}`:!code?"No new student section code was returned.":"The stored student section code did not change. Please try again.",true);}else{replaceVisibleCode(button,code,"section");showOperationResult(`Student section code regenerated and verified. Old code: ${oldCode}. New code: ${code}`);}button.disabled=false;button.textContent="Regenerate student section code";}));
    document.querySelectorAll("[data-scenario-reveal]").forEach(button=>button.addEventListener("click",async()=>{const select=document.querySelector(`[data-section-mission="${button.dataset.scenarioReveal}"]`);const mission=Number(select?.value||0);if(!mission){showOperationResult("Choose a scenario before revealing it.",true);return;}const result=await db.rpc("set_section_released_mission",{requested_section:button.dataset.scenarioReveal,requested_mission:mission});if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-scenario-hide]").forEach(button=>button.addEventListener("click",async()=>{const result=await db.rpc("set_section_released_mission",{requested_section:button.dataset.scenarioHide,requested_mission:0});if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-section-archive]").forEach(button=>button.addEventListener("click",async()=>{if(!confirm(`Archive ${button.dataset.sectionName}? Student work will be retained and the class will disappear from active operations.`))return;button.disabled=true;const result=await db.rpc("archive_section",{requested_section:button.dataset.sectionArchive});if(result.error){showOperationResult(`Section was not archived: ${result.error.message}`,true);button.disabled=false;}else{await staffScreen();}}));
    document.querySelectorAll("[data-team-review]").forEach(button=>button.addEventListener("click",()=>reviewTeam(button.dataset.teamReview,button.dataset.teamName,Number(button.dataset.mission))));
    document.querySelectorAll("[data-team-control]").forEach(button=>button.addEventListener("click",async()=>{if(button.dataset.teamControl==="code"){button.disabled=true;button.textContent="Generating…";const oldCode=button.closest(".team-operation")?.querySelector('[data-code-display="team"]')?.textContent.trim()||"";const result=await db.rpc("regenerate_team_code",{requested_team:button.dataset.teamId});const stored=await storedCode("teams",button.dataset.teamId,"join_code");const code=stored.code||rpcCodeValue(result.data);if(result.error||stored.error||!code||code===oldCode){showOperationResult(result.error?`Team code was not changed: ${result.error.message}`:stored.error?`The new team code could not be verified: ${stored.error.message}`:!code?"No new team code was returned.":"The stored team code did not change. Please try again.",true);}else{replaceVisibleCode(button,code,"team");showOperationResult(`Team code regenerated and verified. Old code: ${oldCode}. New code: ${code}`);}button.disabled=false;button.textContent="Regenerate team code";return;}const changes={};if(button.dataset.teamControl==="lock")changes.mission_locked=button.dataset.locked!=="true";if(button.dataset.teamControl==="mission")changes.active_mission=Number(document.querySelector(`[data-mission-select="${button.dataset.teamId}"]`)?.value);const result=await db.from("teams").update(changes).eq("id",button.dataset.teamId);if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-member-role]").forEach(button=>button.addEventListener("click",async()=>{const select=document.querySelector(`[data-member-role-select="${button.dataset.memberRole}"]`);const result=await db.from("team_members").update({assigned_role:select.value||null}).eq("team_id",button.dataset.currentTeam).eq("user_id",button.dataset.memberRole);if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-member-move]").forEach(button=>button.addEventListener("click",async()=>{const select=document.querySelector(`[data-member-move-select="${button.dataset.memberMove}"]`);if(!select?.value){showOperationResult("Choose a destination team first.",true);return;}const result=await db.from("team_members").update({team_id:select.value,assigned_role:null}).eq("team_id",button.dataset.currentTeam).eq("user_id",button.dataset.memberMove);if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-member-remove]").forEach(button=>button.addEventListener("click",async()=>{if(!confirm(`Remove ${button.dataset.memberName} from this team? Saved submissions will be retained for staff review.`))return;button.disabled=true;const result=await db.rpc("remove_team_member",{requested_team:button.dataset.currentTeam,requested_user:button.dataset.memberRemove});if(result.error){showOperationResult(`Member was not removed: ${result.error.message}`,true);button.disabled=false;}else{await staffScreen();}}));
  }
}

  function renderTeamOperations(teams,sections,members,professors,isAdmin) {
  const roles=["SOC Analyst","Incident Responder","Security Lead","Communications Lead"];
  if(!teams.length)return "<div class=\"empty-state\"><strong>No teams yet.</strong><p>Give students the section code. The first student will create the team, and it will appear here automatically.</p></div>";
  return `<div class="team-operations">${teams.map(team=>{
    const teamMembers=members.filter(m=>m.team_id===team.id);
    const section=sections.find(s=>s.id===team.section_id);
    const destinations=teams.filter(t=>t.id!==team.id&&t.section_id===team.section_id);
    return `<article class="team-operation">
      <div class="team-operation-title"><div><span>${esc(section?.name||"Section pending")}</span><h4>${esc(team.name)}</h4></div><span class="status-pill ${team.mission_locked?"locked":"open"}">${team.mission_locked?"Locked":"Open"}</span></div>
      <div class="mission-progress" aria-label="Mission ${team.active_mission} of 6"><span style="width:${team.active_mission/6*100}%"></span></div>
      <p><strong>Mission ${team.active_mission} of 6</strong> · ${teamMembers.length} of 4 seats filled</p>
      <div class="team-roster-manager">${teamMembers.map(member=>`<div class="roster-manager">
        <strong>${esc(member.profiles?.display_name||"Student")}</strong>
        <label>Seat<select data-member-role-select="${member.user_id}"><option value="">Seat pending</option>${roles.map(role=>`<option value="${role}" ${member.assigned_role===role?"selected":""}>${role}</option>`).join("")}</select></label>
        <button class="btn compact" type="button" data-member-role="${member.user_id}" data-current-team="${team.id}">Save seat</button>
        <label>Move to team<select data-member-move-select="${member.user_id}" ${destinations.length?"":"disabled"}><option value="">Choose destination</option>${destinations.map(destination=>`<option value="${destination.id}">${esc(destination.name)}</option>`).join("")}</select></label>
        <button class="btn compact" type="button" data-member-move="${member.user_id}" data-current-team="${team.id}" ${destinations.length?"":"disabled"}>Move student</button>
        <button class="btn compact danger" type="button" data-member-remove="${member.user_id}" data-member-name="${esc(member.profiles?.display_name||"student")}" data-current-team="${team.id}">Remove member</button>
      </div>`).join("")||"<p>No students yet. Give the private team code to up to four students; they will appear here automatically after creating access.</p>"}</div>
      <div class="team-code-row"><code data-code-display="team">${esc(team.join_code)}</code><button class="btn compact" type="button" data-copy-kind="team" data-copy-code="${esc(team.join_code)}">Copy team code</button><button class="btn compact" type="button" data-team-control="code" data-team-id="${team.id}">Regenerate team code</button></div>
      <div class="mission-controls">
        <button class="btn compact" type="button" data-team-review="${team.id}" data-team-name="${esc(team.name)}" data-mission="${team.active_mission}">Review live work</button>
        <button class="btn compact" type="button" data-team-control="lock" data-team-id="${team.id}" data-locked="${team.mission_locked}">${team.mission_locked?"Reopen mission":"Lock mission"}</button>
        <label>Active mission<select data-mission-select="${team.id}">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===team.active_mission?"selected":""}>${n}</option>`).join("")}</select></label>
        <button class="btn compact" type="button" data-team-control="mission" data-team-id="${team.id}">Apply mission</button>
      </div>
    </article>`;
  }).join("")}</div>`;
}

  async function reviewTeam(teamId,teamName,mission) {
    const [reportResult,notesResult,reflectionsResult]=await Promise.all([
      db.from("team_reports").select("*").eq("team_id",teamId).eq("mission_number",mission).maybeSingle(),
      db.from("role_notes").select("note_text,updated_at,profiles!role_notes_author_id_fkey(display_name)").eq("team_id",teamId).eq("mission_number",mission),
      db.from("reflections").select("reflection_text,submitted_at,profiles!reflections_student_id_fkey(display_name)").eq("team_id",teamId).eq("mission_number",mission)
    ]);
    const error=[reportResult,notesResult,reflectionsResult].find(result=>result.error)?.error;
    if(error){field("staffReview").innerHTML=`<p class="auth-message">${esc(error.message)}</p>`;return;}
    const report=reportResult.data||{};
    field("staffReview").innerHTML=`<div class="review-drawer">
      <div class="operations-head"><div><span class="card-kicker">Mission ${mission} review</span><h3>${esc(teamName)}</h3></div><button class="btn compact" id="closeReview" type="button">Close review</button></div>
      <h4>Shared team report</h4>${["findings","timeline","decision","unknowns","ai_transcript","ai_feedback"].map(k=>`<div class="review-entry"><strong>${k.replaceAll("_"," ")}</strong><p>${esc(report[k]||"No entry yet.")}</p></div>`).join("")}
      <h4>Role notes</h4>${(notesResult.data||[]).map(n=>`<div class="review-entry"><strong>${esc(n.profiles?.display_name||"Team member")}</strong><p>${esc(n.note_text||"No entry yet.")}</p></div>`).join("")||"<p>No role notes yet.</p>"}
      <h4>Private reflections</h4>${(reflectionsResult.data||[]).map(r=>`<div class="review-entry"><strong>${esc(r.profiles?.display_name||"Student")} · ${r.submitted_at?"Submitted":"Draft"}</strong><p>${esc(r.reflection_text||"No entry yet.")}</p></div>`).join("")||"<p>No reflections yet.</p>"}
    </div>`;
    field("closeReview")?.addEventListener("click",()=>field("staffReview").innerHTML="");
    field("staffReview").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function bindSignOut(){field("signOut")?.addEventListener("click",()=>db.auth.signOut());}
  async function render() {
    if(channel){await db.removeChannel(channel);channel=null;}
    if(!currentUser){authScreen();return;}
    try {
      await loadProfile();
      const logKey=`coolhack-access-${currentUser.id}`;
      if(!sessionStorage.getItem(logKey)){
        await db.rpc("record_access_event",{requested_portal:portal||profile.app_role});
        sessionStorage.setItem(logKey,"1");
      }
      ["instructor","platform_admin"].includes(profile.app_role) ? await staffScreen() : await studentScreen();
    }
    catch(error){mount.innerHTML=`<div class="classroom-card"><h3>Classroom setup is not finished</h3><p>${esc(error.message)}</p><p>The instructor must run the supplied Supabase database setup script once before accounts can use the workspace.</p></div>`;}
  }
  db.auth.getSession().then(({data})=>{currentUser=data.session?.user||null;render();});
  db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setTimeout(render,0);});
})();
