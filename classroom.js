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

  function authScreen() {
    if (staffPortal) {
      const title = document.querySelector("#classroom-title");
      const intro = title?.nextElementSibling;
      if (portal === "admin") {
        if (title) title.textContent = "CoolHack administrator portal";
        if (intro) intro.textContent = "Create or sign in to the dedicated CoolHack project account used only by the platform administrator.";
        renderAdministratorAccess();
      } else {
        if (title) title.textContent = "CoolHack professor portal";
        if (intro) intro.textContent = "Create or sign in to a dedicated CoolHack professor account. No email address is required.";
        mount.innerHTML = `
        <div class="instructions-lead"><strong>Professor access</strong><br>Choose a CoolHack-only username and password. Do not use an institutional email, employee ID, or institutional password.</div>
        <form class="classroom-card" id="professorAccessForm">
          <h3>Professor sign-in</h3>
          <p>New accounts remain pending until the platform administrator authorizes the username and assigns a section.</p>
          <label for="professorAlias">Professor username</label><input id="professorAlias" minlength="3" maxlength="30" pattern="[A-Za-z0-9_-]+" autocomplete="username" required>
          <small>Use letters, numbers, underscores, or hyphens. This is a CoolHack username—not an email address.</small>
          <label for="professorPassword">CoolHack password</label><input id="professorPassword" type="password" minlength="12" autocomplete="current-password" required>
          <div class="hero-actions"><button class="btn primary" type="submit" name="staffAction" value="signin">Sign in</button><button class="btn" type="submit" name="staffAction" value="create">First visit: request access</button></div>
        </form>
        <p class="auth-message" id="authMessage" role="status"></p>`;
        field("professorAccessForm").addEventListener("submit", professorAccess);
      }
      return;
    }
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Independent classroom simulation</strong><br>CoolHack is not an HCC system. Students use an invented screen name—never an HCC email, student ID, official password, grade, or other personal information. A private CoolHack password connects you to your team and restores your work after a refresh.</div>
      <form class="classroom-card" id="studentAccessForm">
        <h3>Student access</h3>
        <p>No student email is collected. Use the team code from your instructor and an invented screen name.</p>
        <label for="studentTeamCode">Team code</label><input id="studentTeamCode" minlength="6" maxlength="12" pattern="[A-Za-z0-9]+" autocomplete="off" required>
        <label for="studentAlias">Screen name</label><input id="studentAlias" minlength="2" maxlength="30" pattern="[A-Za-z0-9_-]+" autocomplete="username" aria-describedby="aliasHelp" required>
        <small id="aliasHelp">Use letters, numbers, underscores, or hyphens. Do not use your real full name or student ID.</small>
        <label for="studentPassword">Private CoolHack password</label><input id="studentPassword" type="password" minlength="10" autocomplete="current-password" required>
        <div class="hero-actions"><button class="btn primary" type="submit" name="studentAction" value="signin">Sign in</button><button class="btn" type="submit" name="studentAction" value="create">First visit: create access</button></div>
      </form>
      <p class="auth-message" id="authMessage" role="status"></p>`;
    field("studentAccessForm").addEventListener("submit", studentAccess);
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
    const action=event.submitter?.value||"signin";
    const displayName=field("professorAlias").value.trim();
    const password=field("professorPassword").value;
    say(action==="create"?"Creating professor access request…":"Signing in…");
    try {
      const email=await professorAliasEmail(displayName);
      if(action==="create"){
        const {error}=await db.auth.signUp({
          email,
          password,
          options:{data:{display_name:displayName,account_kind:"professor_alias_pending"}}
        });
        say(error?error.message:"Request created. The platform administrator must authorize this username before any section is visible.");
      } else {
        const {error}=await db.auth.signInWithPassword({email,password});
        if(error)say("That professor username or password did not match.");
      }
    } catch (_error) {
      say("Professor access could not be created. Check the entries and try again.");
    }
  }
  async function studentAccess(event) {
    event.preventDefault();
    const action = event.submitter?.value || "signin";
    const displayName = field("studentAlias").value.trim();
    const joinCode = field("studentTeamCode").value.trim().toUpperCase();
    const password = field("studentPassword").value;
    say(action === "create" ? "Creating private student access…" : "Signing in…");
    try {
      const email = await aliasEmail(displayName, joinCode);
      if (action === "create") {
        const { error } = await db.auth.signUp({
          email,
          password,
          options:{data:{display_name:displayName, join_code:joinCode, account_kind:"student_alias"}}
        });
        say(error ? error.message : "Access created. If the workspace does not open automatically, choose Sign in.");
      } else {
        const { error } = await db.auth.signInWithPassword({email, password});
        if (error) say("That team code, screen name, or password did not match.");
      }
    } catch (_error) {
      say("Student access could not be created. Check the entries and try again.");
    }
  }

  async function loadProfile() {
    const result = await db.from("profiles").select("*").eq("id", currentUser.id).single();
    if (result.error) throw result.error;
    profile = result.data;
  }

  function accountBar(extra="") {
    return `<div class="account-bar"><p><span class="live-dot"></span>Signed in as <strong>${esc(profile.display_name)}</strong> · ${esc(profile.app_role)}</p><div>${extra}<button class="btn" id="signOut" type="button">Sign out</button></div></div>`;
  }

  async function studentScreen() {
    const m = await db.from("team_members").select("team_id,assigned_role,teams(id,name,active_mission,mission_locked)").eq("user_id",currentUser.id).maybeSingle();
    if (m.error) throw m.error;
    membership = m.data;
    if (!membership) {
      mount.innerHTML = accountBar() + `<div class="classroom-card"><h3>Account ready—team assignment pending</h3><p>Your instructor has not assigned this account to a team yet. Leave this page open or sign in again after the instructor assigns you.</p></div>`;
      bindSignOut(); return;
    }
    const teamId = membership.team_id;
    const mission = membership.teams.active_mission;
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
      <div class="instructions-lead"><strong>${esc(membership.teams.name)} · Mission ${mission}</strong><br>Your seat: ${esc(membership.assigned_role || "Not assigned")}. Each member writes in a separate role-notes box; the team report is shared.</div>
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

  async function staffScreen() {
    const isAdmin = profile.app_role === "platform_admin";
    const [sectionsResult, teamsResult, profilesResult, membersResult] = await Promise.all([
      db.from("sections").select("id,name,instructor_id,is_active,profiles!sections_instructor_id_fkey(display_name)").order("name"),
      db.from("teams").select("*").order("name"),
      db.from("profiles").select("id,display_name,app_role").order("display_name"),
      db.from("team_members").select("team_id,user_id,assigned_role,profiles(display_name)")
    ]);
    const queryError = [sectionsResult,teamsResult,profilesResult,membersResult].find(result=>result.error)?.error;
    if (queryError) throw queryError;
    const sections = sectionsResult.data || [];
    const teams = teamsResult.data || [];
    const profiles = profilesResult.data || [];
    const members = membersResult.data || [];
    const professors = profiles.filter(p=>p.app_role==="instructor");
    const students = profiles.filter(p=>p.app_role==="student");
    const assignedIds = new Set(members.map(m=>m.user_id));
    const unassigned = students.filter(p=>!assignedIds.has(p.id));
    const assignedSection = sections[0]?.id || "";
    const title = isAdmin ? "Platform administrator dashboard" : "Professor dashboard";
    const lead = isAdmin
      ? "Manage every Capstone section, authorize professors, create teams, and supervise live mission activity across the academy."
      : "Manage only your assigned Capstone section, create teams, assign seats, and review live mission work.";

    mount.innerHTML = accountBar() + `
      <div class="admin-hero">
        <div><span class="eyebrow">${isAdmin?"Academy control center":"Section operations"}</span><h3>${title}</h3><p>${lead}</p></div>
        <span class="privacy-badge">De-identified classroom data only</span>
      </div>
      <div class="admin-stats" aria-label="Classroom overview">
        <div><strong>${sections.length}</strong><span>Active sections</span></div>
        <div><strong>${teams.length}</strong><span>Teams</span></div>
        <div><strong>${members.length}</strong><span>Student accounts</span></div>
        <div><strong>${teams.filter(t=>!t.mission_locked).length}</strong><span>Open workspaces</span></div>
      </div>
      ${isAdmin?`
      <div class="admin-panel-grid">
        <form class="classroom-card" id="authorizeProfessor">
          <span class="card-kicker">Access control</span><h3>Authorize a professor</h3>
          <p>The professor must first request access with a CoolHack username. No professor email is collected.</p>
          <label for="professorUsername">Pending professor username</label><input id="professorUsername" minlength="3" maxlength="30" pattern="[A-Za-z0-9_-]+" autocomplete="off" required>
          <div class="hero-actions"><button class="btn primary">Authorize professor</button></div><p id="professorMessage" class="form-message" role="status"></p>
        </form>
        <form class="classroom-card" id="createSection">
          <span class="card-kicker">Three-section setup</span><h3>Create a Capstone section</h3>
          <label for="sectionName">Section label</label><input id="sectionName" placeholder="Example: Capstone Section 1" maxlength="80" required>
          <label for="sectionProfessor">Assigned professor</label><select id="sectionProfessor"><option value="">Assign later</option>${professors.map(p=>`<option value="${p.id}">${esc(p.display_name)}</option>`).join("")}</select>
          <div class="hero-actions"><button class="btn primary">Create section</button></div><p id="sectionMessage" class="form-message" role="status"></p>
        </form>
      </div>`:""}
      <div class="admin-panel-grid">
        <form class="classroom-card" id="createTeam">
          <span class="card-kicker">Team setup</span><h3>Create a team</h3>
          <label for="teamSection">Capstone section</label><select id="teamSection" required>${sectionOptions(sections,assignedSection)}</select>
          <label for="teamName">Team name</label><input id="teamName" placeholder="Example: Team Phoenix" required maxlength="50">
          <label for="joinCode">Private team code</label>
          <div class="code-builder"><input id="joinCode" required minlength="8" maxlength="12" pattern="[A-Z0-9]+" readonly><button class="btn" id="generateCode" type="button">Generate code</button></div>
          <small>Give this code only to the four students assigned to this team.</small>
          <div class="hero-actions"><button class="btn primary">Create team</button></div><p id="teamMessage" class="form-message" role="status"></p>
        </form>
        <form class="classroom-card" id="assignStudent">
          <span class="card-kicker">Roster</span><h3>Assign a student and seat</h3>
          <label for="assignUser">Unassigned screen name</label><select id="assignUser" required><option value="">Choose a student</option>${unassigned.map(p=>`<option value="${p.id}">${esc(p.display_name)}</option>`).join("")}</select>
          <label for="assignTeam">Team</label><select id="assignTeam" required><option value="">Choose a team</option>${teams.map(t=>`<option value="${t.id}">${esc(t.name)} · ${esc(sections.find(s=>s.id===t.section_id)?.name||"Section pending")}</option>`).join("")}</select>
          <label for="assignRole">Seat (role)</label><select id="assignRole" required><option value="">Choose a role</option>${["SOC Analyst","Incident Responder","Security Lead","Communications Lead"].map(r=>`<option>${r}</option>`).join("")}</select>
          <div class="hero-actions"><button class="btn primary">Save assignment</button></div><p id="assignmentMessage" class="form-message" role="status"></p>
        </form>
      </div>
      <section class="classroom-card operations-board">
        <div class="operations-head"><div><span class="card-kicker">Live operations</span><h3>Sections, teams, and mission progress</h3></div><label for="sectionFilter">Show section<select id="sectionFilter"><option value="all">All available sections</option>${sections.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label></div>
        <div class="section-summary">${sections.map(section=>`<article><strong>${esc(section.name)}</strong><span>${esc(section.profiles?.display_name||"Professor not assigned")}</span><small>${teams.filter(t=>t.section_id===section.id).length} teams</small></article>`).join("")||"<p>Create a section to begin.</p>"}</div>
        <div id="teamOperations">${renderTeamOperations(teams,sections,members)}</div>
        <div id="staffReview" aria-live="polite"></div>
      </section>`;

    bindSignOut();
    const newCode = () => { field("joinCode").value = secureTeamCode(); };
    newCode();
    field("generateCode")?.addEventListener("click",newCode);
    field("sectionFilter")?.addEventListener("change",event=>{
      const visible = event.target.value==="all" ? teams : teams.filter(t=>t.section_id===event.target.value);
      field("teamOperations").innerHTML=renderTeamOperations(visible,sections,members);
      bindOperationButtons();
    });
    field("authorizeProfessor")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const result=await db.rpc("authorize_professor",{professor_username:field("professorUsername").value.trim()});
      field("professorMessage").textContent=result.error?result.error.message:`${result.data} is now authorized as a professor.`;
      if(!result.error)setTimeout(staffScreen,700);
    });
    field("createSection")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const payload={name:field("sectionName").value.trim(),created_by:currentUser.id};
      if(field("sectionProfessor").value)payload.instructor_id=field("sectionProfessor").value;
      const result=await db.from("sections").insert(payload);
      field("sectionMessage").textContent=result.error?result.error.message:"Section created.";
      if(!result.error)setTimeout(staffScreen,500);
    });
    field("createTeam")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const payload={name:field("teamName").value.trim(),join_code:field("joinCode").value,section_id:field("teamSection").value,created_by:currentUser.id};
      const result=await db.from("teams").insert(payload);
      field("teamMessage").textContent=result.error?result.error.message:"Team created and its code is ready to share.";
      if(!result.error)setTimeout(staffScreen,500);
    });
    field("assignStudent")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const result=await db.from("team_members").upsert({team_id:field("assignTeam").value,user_id:field("assignUser").value,assigned_role:field("assignRole").value},{onConflict:"team_id,user_id"});
      field("assignmentMessage").textContent=result.error?result.error.message:"Student and seat assigned.";
      if(!result.error)setTimeout(staffScreen,500);
    });
    bindOperationButtons();

    function bindOperationButtons() {
      document.querySelectorAll("[data-copy-code]").forEach(button=>button.addEventListener("click",async()=>{
        await navigator.clipboard.writeText(button.dataset.copyCode);
        button.textContent="Code copied";
        setTimeout(()=>button.textContent="Copy code",1200);
      }));
      document.querySelectorAll("[data-team-review]").forEach(button=>button.addEventListener("click",()=>reviewTeam(button.dataset.teamReview,button.dataset.teamName,Number(button.dataset.mission))));
      document.querySelectorAll("[data-team-control]").forEach(button=>button.addEventListener("click",async()=>{
        const changes={};
        if(button.dataset.teamControl==="lock")changes.mission_locked=button.dataset.locked!=="true";
        if(button.dataset.teamControl==="mission")changes.active_mission=Number(document.querySelector(`[data-mission-select="${button.dataset.teamId}"]`)?.value);
        const result=await db.from("teams").update(changes).eq("id",button.dataset.teamId);
        if(result.error)field("staffReview").innerHTML=`<p class="auth-message">${esc(result.error.message)}</p>`;
        else staffScreen();
      }));
    }
  }

  function renderTeamOperations(teams,sections,members) {
    if(!teams.length)return "<p>No teams are available in this view.</p>";
    return `<div class="team-operations">${teams.map(team=>{
      const teamMembers=members.filter(m=>m.team_id===team.id);
      const section=sections.find(s=>s.id===team.section_id);
      return `<article class="team-operation">
        <div class="team-operation-title"><div><span>${esc(section?.name||"Section pending")}</span><h4>${esc(team.name)}</h4></div><span class="status-pill ${team.mission_locked?"locked":"open"}">${team.mission_locked?"Locked":"Open"}</span></div>
        <div class="mission-progress" aria-label="Mission ${team.active_mission} of 6"><span style="width:${team.active_mission/6*100}%"></span></div>
        <p><strong>Mission ${team.active_mission} of 6</strong> · ${teamMembers.length} of 4 seats filled</p>
        <ul>${teamMembers.map(m=>`<li>${esc(m.profiles?.display_name)} — ${esc(m.assigned_role||"Seat pending")}</li>`).join("")||"<li>No student accounts yet.</li>"}</ul>
        <div class="team-code-row"><code>${esc(team.join_code)}</code><button class="btn compact" type="button" data-copy-code="${esc(team.join_code)}">Copy code</button></div>
        <div class="mission-controls">
          <button class="btn compact" type="button" data-team-review="${team.id}" data-team-name="${esc(team.name)}" data-mission="${team.active_mission}">Review live work</button>
          <button class="btn compact" type="button" data-team-control="lock" data-team-id="${team.id}" data-locked="${team.mission_locked}">${team.mission_locked?"Reopen mission":"Lock mission"}</button>
          <label>Active mission<select data-mission-select="${team.id}">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===team.active_mission?"selected":""}>${n}</option>`).join("")}</select></label>
          <button class="btn compact" type="button" data-team-control="mission" data-team-id="${team.id}" data-mission-target="${team.active_mission}">Apply</button>
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
      if (currentUser.user_metadata?.account_kind === "professor_alias_pending" && profile.app_role === "student") {
        mount.innerHTML = accountBar() + `<div class="classroom-card"><h3>Professor authorization pending</h3><p>Your CoolHack account is secure, but no classroom information is available yet. Ask the platform administrator to authorize the username <strong>${esc(profile.display_name)}</strong> and assign your section.</p></div>`;
        bindSignOut();
      } else {
        ["instructor","platform_admin"].includes(profile.app_role) ? await staffScreen() : await studentScreen();
      }
    }
    catch(error){mount.innerHTML=`<div class="classroom-card"><h3>Classroom setup is not finished</h3><p>${esc(error.message)}</p><p>The instructor must run the supplied Supabase database setup script once before accounts can use the workspace.</p></div>`;}
  }
  db.auth.getSession().then(({data})=>{currentUser=data.session?.user||null;render();});
  db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setTimeout(render,0);});
})();
