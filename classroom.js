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

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const say = message => { const el = document.querySelector("#authMessage"); if (el) el.textContent = message; };
  const field = id => document.querySelector(`#${id}`);

  function authScreen() {
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Why sign in?</strong> Your account connects you to your assigned team, saves work in the shared classroom database, and lets the instructor see progress. Never reuse an important personal password.</div>
      <div class="auth-grid">
        <form class="classroom-card" id="signInForm">
          <h3>Sign in</h3>
          <label for="loginEmail">Email address</label><input id="loginEmail" type="email" autocomplete="email" required>
          <label for="loginPassword">Password</label><input id="loginPassword" type="password" autocomplete="current-password" required>
          <div class="hero-actions"><button class="btn primary" type="submit">Sign in</button></div>
        </form>
        <form class="classroom-card" id="signUpForm">
          <h3>Create a student account</h3>
          <p>Your instructor may ask you to use a course-created or school-approved email.</p>
          <label for="displayName">Name shown to your team</label><input id="displayName" maxlength="80" required>
          <label for="signupEmail">Email address</label><input id="signupEmail" type="email" autocomplete="email" required>
          <label for="signupPassword">Create a password</label><input id="signupPassword" type="password" minlength="8" autocomplete="new-password" required>
          <div class="hero-actions"><button class="btn" type="submit">Create account</button></div>
        </form>
      </div><p class="auth-message" id="authMessage" role="status"></p>`;
    field("signInForm").addEventListener("submit", signIn);
    field("signUpForm").addEventListener("submit", signUp);
  }

  async function signIn(event) {
    event.preventDefault(); say("Signing in…");
    const { error } = await db.auth.signInWithPassword({email:field("loginEmail").value.trim(), password:field("loginPassword").value});
    if (error) say(error.message);
  }
  async function signUp(event) {
    event.preventDefault(); say("Creating account…");
    const { error } = await db.auth.signUp({
      email:field("signupEmail").value.trim(),
      password:field("signupPassword").value,
      options:{data:{display_name:field("displayName").value.trim()}}
    });
    say(error ? error.message : "Account created. Check your email if confirmation is required, then sign in.");
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
    const report = reportResult.data || {};
    const myNote = (notesResult.data || []).find(n => n.author_id === currentUser.id)?.note_text || "";
    mount.innerHTML = accountBar(`<span class="cloud-state" id="cloudState">Cloud connected</span> `) + `
      <div class="instructions-lead"><strong>${esc(membership.teams.name)} · Mission ${mission}</strong><br>Your seat: ${esc(membership.assigned_role || "Not assigned")}. Each member writes in a separate role-notes box; the team report is shared.</div>
      <div class="classroom-grid">
        <aside class="classroom-card"><h3>Team roster</h3><ul class="roster">${(rosterResult.data||[]).map(x=>`<li><strong>${esc(x.profiles?.display_name)}</strong><br>${esc(x.assigned_role||"Role pending")}</li>`).join("")}</ul><h3>Live role notes</h3><div id="teamNotes">${(notesResult.data||[]).map(n=>`<p data-note-author="${n.author_id}"><strong>${esc((rosterResult.data||[]).find(r=>r.user_id===n.author_id)?.profiles?.display_name||"Team member")}:</strong> ${esc(n.note_text)}</p>`).join("")||"<p>No notes yet.</p>"}</div></aside>
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
        const author=(rosterResult.data||[]).find(r=>r.user_id===payload.new.author_id)?.profiles?.display_name||"Team member";
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

  async function instructorScreen() {
    const [teams, profiles, members] = await Promise.all([
      db.from("teams").select("*").order("name"),
      db.from("profiles").select("id,display_name,app_role").order("display_name"),
      db.from("team_members").select("team_id,user_id,assigned_role,profiles(display_name)")
    ]);
    const studentProfiles=(profiles.data||[]).filter(p=>p.app_role==="student");
    mount.innerHTML = accountBar() + `
      <div class="instructions-lead"><strong>Instructor dashboard</strong><br>Create teams, assign students, and open a team to review its live work. Students appear here after creating their accounts.</div>
      <div class="classroom-grid">
        <div>
          <form class="classroom-card" id="createTeam"><h3>Create a team</h3><label for="teamName">Team name</label><input id="teamName" required maxlength="50"><label for="joinCode">Internal team code</label><input id="joinCode" required minlength="6" maxlength="12" pattern="[A-Z0-9]+"><div class="hero-actions"><button class="btn primary">Create team</button></div><p id="instructorMessage" role="status"></p></form>
          <form class="classroom-card" id="assignStudent"><h3>Assign a student and seat</h3>
            <label for="assignUser">Student</label><select id="assignUser" required><option value="">Choose a student</option>${studentProfiles.map(p=>`<option value="${p.id}">${esc(p.display_name)}</option>`).join("")}</select>
            <label for="assignTeam">Team</label><select id="assignTeam" required><option value="">Choose a team</option>${(teams.data||[]).map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select>
            <label for="assignRole">Seat (role)</label><select id="assignRole" required><option value="">Choose a role</option>${["SOC Analyst","Incident Responder","Security Lead","Communications Lead"].map(r=>`<option>${r}</option>`).join("")}</select>
            <div class="hero-actions"><button class="btn primary">Save assignment</button></div><p id="assignmentMessage" role="status"></p>
          </form>
        </div>
        <div class="classroom-card"><h3>Teams and assignments</h3>${(teams.data||[]).map(t=>`<div class="instructor-team"><strong>${esc(t.name)}</strong> · Mission ${t.active_mission} · ${t.mission_locked?"Locked":"Open"}<ul>${(members.data||[]).filter(m=>m.team_id===t.id).map(m=>`<li>${esc(m.profiles?.display_name)} — ${esc(m.assigned_role||"Role pending")}</li>`).join("")||"<li>No students assigned yet.</li>"}</ul><button class="btn" type="button" data-team-review="${t.id}" data-team-name="${esc(t.name)}" data-mission="${t.active_mission}">Review live work</button></div>`).join("")||"<p>No teams created yet.</p>"}<div id="instructorReview"></div><h3>Unassigned student accounts</h3><ul>${studentProfiles.filter(p=>!(members.data||[]).some(m=>m.user_id===p.id)).map(p=>`<li>${esc(p.display_name)}</li>`).join("")||"<li>None</li>"}</ul></div>
      </div>`;
    bindSignOut();
    field("createTeam").addEventListener("submit",async event=>{event.preventDefault();const {error}=await db.from("teams").insert({name:field("teamName").value.trim(),join_code:field("joinCode").value.trim().toUpperCase(),created_by:currentUser.id});field("instructorMessage").textContent=error?error.message:"Team created.";if(!error)instructorScreen();});
    field("assignStudent").addEventListener("submit",async event=>{event.preventDefault();const userId=field("assignUser").value;const {error}=await db.from("team_members").upsert({team_id:field("assignTeam").value,user_id:userId,assigned_role:field("assignRole").value},{onConflict:"team_id,user_id"});field("assignmentMessage").textContent=error?error.message:"Student assigned.";if(!error)instructorScreen();});
    document.querySelectorAll("[data-team-review]").forEach(button=>button.addEventListener("click",async()=>{
      const result=await db.from("team_reports").select("*").eq("team_id",button.dataset.teamReview).eq("mission_number",Number(button.dataset.mission)).maybeSingle();
      const report=result.data||{};
      field("instructorReview").innerHTML=`<div class="instructor-team"><h3>${esc(button.dataset.teamName)} live report</h3>${["findings","timeline","decision","unknowns","ai_transcript","ai_feedback"].map(k=>`<p><strong>${k.replaceAll("_"," ")}:</strong><br>${esc(report[k]||"No entry yet.")}</p>`).join("")}</div>`;
    }));
  }

  function bindSignOut(){field("signOut")?.addEventListener("click",()=>db.auth.signOut());}
  async function render() {
    if(channel){await db.removeChannel(channel);channel=null;}
    if(!currentUser){authScreen();return;}
    try { await loadProfile(); profile.app_role==="instructor" ? await instructorScreen() : await studentScreen(); }
    catch(error){mount.innerHTML=`<div class="classroom-card"><h3>Classroom setup is not finished</h3><p>${esc(error.message)}</p><p>The instructor must run the supplied Supabase database setup script once before accounts can use the workspace.</p></div>`;}
  }
  db.auth.getSession().then(({data})=>{currentUser=data.session?.user||null;render();});
  db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setTimeout(render,0);});
})();
