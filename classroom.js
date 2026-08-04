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
  let authTransition = false;
  let renderTimer = null;
  const portal = new URLSearchParams(window.location.search).get("portal");
  const staffPortal = portal === "admin" || portal === "professor" || portal === "instructor";
  const aiSecurityGuides = [
    null,
    {title:"AI-assisted phishing and trustworthy analysis", opening:"The AI is not the evidence and confidence is not accuracy. Today, your team must catch one unsupported AI claim, protect case data, and show how a human analyst verifies the result.", prompts:["How could an attacker use AI in this incident?","What information is unsafe to paste into a public AI tool?","Which AI statement did your team verify rather than trust?"], takeaway:"AI can support phishing triage, but analysts must minimize data, verify outputs against original evidence, and retain accountability."},
    {title:"AI risk scores and human oversight", opening:"A high AI risk score can help us prioritize an alert, but it is not proof of compromise. Today, your team must inspect the signals behind the score and consider the cost of both kinds of error.", prompts:["What makes the score explainable?","What would a false positive harm?","What would a false negative harm?"], takeaway:"AI may prioritize identity risk; humans validate the underlying evidence before high-impact action."},
    {title:"Prompt injection and bounded AI agents", opening:"Logs and webpages are evidence, but an AI assistant may also interpret their text as instructions. Today, treat retrieved content as untrusted and design a boundary the assistant cannot cross alone.", prompts:["Where could indirect prompt injection hide?","Which permissions does the assistant truly need?","Which actions always require human approval?"], takeaway:"AI agents need least privilege, untrusted-input handling, sandboxing, logging, and human approval for consequential actions."},
    {title:"AI data security and privacy", opening:"Speed does not justify uploading confidential records to an unapproved AI service. Today, your team must decide the minimum data needed and prove that its proposed AI use follows classification and retention rules.", prompts:["What is the data classification?","Can the task use redacted or synthetic data?","Who may access prompts and outputs, and for how long?"], takeaway:"AI use inherits normal data-governance duties: classify, minimize, de-identify, restrict, retain only as needed, and delete safely."},
    {title:"AI availability and resilient automation", opening:"An automated defense can become part of the outage if attackers manipulate it or the service fails. Today, your team must bound the AI's authority and preserve a tested fallback.", prompts:["How could an attacker influence the model's decision?","What is the maximum action AI may take automatically?","How will the team roll back safely?"], takeaway:"Secure AI must remain available and resilient, with bounded automation, monitoring, fallback, and rollback."},
    {title:"AI governance and lifecycle security", opening:"Leadership is not buying magic; it is accepting a new system, supplier, data flow, and attack surface. Today, your team must define the security conditions for adopting an AI SOC platform.", prompts:["How will we assess the vendor and model supply chain?","What data and tool access will the system receive?","Who owns AI incidents and can stop automated action?"], takeaway:"Cybersecurity in AI covers securing AI systems, using AI safely for defense, and defending against AI-enabled attacks across the lifecycle."}
  ];

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const say = message => { const el = document.querySelector("#authMessage"); if (el) el.textContent = message; };
  const field = id => document.querySelector(`#${id}`);
  const normalizeAlias = value => value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const classToken = new URLSearchParams(location.search).get("class")?.trim().toLowerCase() || "";
  async function usernameAuth(payload) {
    const {data,error}=await db.functions.invoke("username-auth",{body:payload});
    if(error) throw new Error("CoolHack username service is unavailable. Please try again.");
    if(!data?.ok) throw new Error(data?.message||"The username or password did not match.");
    if(!data.session?.access_token||!data.session?.refresh_token) throw new Error("CoolHack did not return a valid session.");
    authTransition = true;
    try {
      const result=await db.auth.setSession({
        access_token:data.session.access_token,
        refresh_token:data.session.refresh_token
      });
      if(result.error) throw result.error;
      if(!result.data.session?.user) throw new Error("CoolHack could not start the signed-in session.");
      currentUser=result.data.session.user;
      return result.data;
    } finally {
      authTransition = false;
    }
  }

  function scheduleRender(delay = 0) {
    clearTimeout(renderTimer);
    renderTimer=setTimeout(async()=>{
      const sessionResult=await db.auth.getSession();
      currentUser=sessionResult.data.session?.user||null;
      await render();
    },delay);
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
            <p>Create your own professor account and classes. No administrator code or approval is required.</p>
            <strong>Enter as a professor →</strong>
          </a>
          <a class="role-entry-card" href="?portal=admin#classroom-access">
            <span class="role-entry-icon" aria-hidden="true">AD</span>
            <h3>Administrator</h3>
            <p>Review activity across the academy and provide support when needed.</p>
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
    setPortalHeading("CoolHack professor portal", "Create your professor account or sign in, then create and run your own classes.");
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Professor access</strong><br>Use a CoolHack-only username and password. Do not use an institutional email, employee ID, or institutional password.</div>
      <div class="access-choice" aria-label="Professor access choices">
        <button class="btn ${creating ? "" : "primary"}" type="button" data-professor-mode="signin">Sign in</button>
        <button class="btn ${creating ? "primary" : ""}" type="button" data-professor-mode="create">First visit: create account</button>
        <button class="btn" id="professorSignOut" type="button">Sign out</button>
      </div>
      <form class="classroom-card" id="professorAccessForm" data-mode="${mode}">
        <h3>${creating ? "Create professor account" : "Professor sign-in"}</h3>
        <p>${creating ? "Create a CoolHack professor account. After sign-in, create each class you teach; CoolHack assigns it to you automatically." : "Use the same CoolHack username and password you created."}</p>
        <label for="professorAlias">Professor username</label><input id="professorAlias" minlength="3" maxlength="30" pattern="[A-Za-z0-9_-]+" autocomplete="username" required>
        <small>Use letters, numbers, underscores, or hyphens. This is a CoolHack username—not an email address.</small>
        <label for="professorPassword">${creating ? "Create a CoolHack password" : "CoolHack password"}</label><input id="professorPassword" type="password" minlength="12" autocomplete="${creating ? "new-password" : "current-password"}" required>
        ${creating ? `<label for="professorPasswordConfirm">Confirm CoolHack password</label><input id="professorPasswordConfirm" type="password" minlength="12" autocomplete="new-password" required>` : ""}
        <p class="auth-message inline-auth-message" id="authMessage" role="status"></p>
        <div class="hero-actions"><button class="btn primary" type="submit">${creating ? "Create professor account" : "Sign in"}</button></div>
      </form>
      `;
    field("professorAccessForm").addEventListener("submit", professorAccess);
    document.querySelectorAll("[data-professor-mode]").forEach(button =>
      button.addEventListener("click", () => renderProfessorAccess(button.dataset.professorMode))
    );
    field("professorSignOut").addEventListener("click", signOutCurrentSession);
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
    setPortalHeading("CoolHack student portal", "Enter a nickname, then create your team or select a team to join.");
    window.CoolHackReleasedMission = 0;
    window.dispatchEvent(new CustomEvent("coolhack:mission-release",{detail:{mission:0}}));
    renderStudentAccess();
  }

  async function renderStudentAccess(mode = "create-team") {
    if (!classToken) {
      mount.innerHTML = `<div class="classroom-card"><h3>Open your professor's class link</h3><p>Ask your professor for the CoolHack class link posted in Canvas. There is no code to enter.</p></div>`;
      return;
    }
    let context;
    try {
      const {data,error}=await db.functions.invoke("username-auth",{body:{action:"class_context",class_token:classToken}});
      if(error||!data?.ok) throw new Error(data?.message||"This class link could not be opened.");
      context=data;
    } catch(error) {
      mount.innerHTML=`<div class="classroom-card"><h3>Class link unavailable</h3><p>${esc(error.message)}</p></div>`;
      return;
    }
    const signingIn = mode === "signin";
    const joining = mode === "join";
    const creatingTeam = mode === "create-team";
    const title = signingIn ? "Student sign-in" : joining ? "Join an existing team" : "Create a new team";
    const intro = signingIn
      ? "Returning student? Use the same nickname and CoolHack password."
      : joining
        ? "Select your team name from the list."
        : "The first teammate creates the team. Everyone else selects that team name and joins.";
    mount.innerHTML = `
      <div class="instructions-lead"><strong>Independent classroom simulation</strong><br>CoolHack is not an HCC system. Use an invented screen name—never an HCC email, student ID, official password, grade, or other personal information.</div>
      <div class="visibility-guide student-team-guide"><strong>${esc(context.class_name)}</strong><span><b>First teammate:</b> create and name the team.</span><span><b>Other teammates:</b> select the team name and join. Teams close automatically at four students.</span></div>
      <div class="access-choice" aria-label="Student access choices">
        <button class="btn ${signingIn ? "primary" : ""}" type="button" data-student-mode="signin">Sign in</button>
        <button class="btn ${creatingTeam ? "primary" : ""}" type="button" data-student-mode="create-team">Create a team</button>
        <button class="btn ${joining ? "primary" : ""}" type="button" data-student-mode="join">Join a team</button>
      </div>
      <form class="classroom-card" id="studentAccessForm" data-mode="${mode}">
        <h3>${title}</h3><p>${intro}</p>
        ${creatingTeam ? `
          <label for="studentTeamName">Team name</label><input id="studentTeamName" minlength="2" maxlength="50" placeholder="Example: Team Phoenix" required>
        ` : joining ? `<label for="studentTeamId">Select your team</label><select id="studentTeamId" required><option value="">Choose a team</option>${context.teams.map(team=>`<option value="${esc(team.id)}">${esc(team.name)} (${team.member_count}/4)</option>`).join("")}</select>${context.teams.length?"":"<small>No open team is available yet. Ask the first teammate to create it.</small>"}` : ""}
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
    say(action==="create"?"Creating professor account…":"Signing in…");
    try {
      if(action==="create"){
        if(password!==field("professorPasswordConfirm").value){
          say("The two CoolHack passwords do not match.");
          return;
        }
        await usernameAuth({action:"create",role:"professor",username:normalizeAlias(displayName),password,display_name:displayName});
        say("Professor account verified. Opening your dashboard…");
      } else {
        await usernameAuth({action:"signin",role:"professor",username:normalizeAlias(displayName),password});
      }
      await render();
    } catch (error) {
      say(error.message||"Professor access could not be completed. Check the entries and try again.");
    }
  }
  async function studentAccess(event) {
    event.preventDefault();
    const mode = event.currentTarget.dataset.mode || "signin";
    const displayName = field("studentAlias").value.trim();
    const password = field("studentPassword").value;
    const creatingTeam = mode === "create-team";
    say(mode === "signin" ? "Signing in…" : creatingTeam ? "Creating your team…" : "Joining your team…");
    try {
      if (mode === "signin") {
        await usernameAuth({action:"signin",role:"student",username:normalizeAlias(displayName),password,class_token:classToken});
        await render();
        return;
      }
      const metadata = {
        display_name: displayName,
        account_kind: creatingTeam ? "student_team_creator" : "student_alias"
      };
      if (creatingTeam) {
        metadata.team_name = field("studentTeamName").value.trim();
      }
      await usernameAuth({action:"create",role:"student",username:normalizeAlias(displayName),password,class_token:classToken,team_id:creatingTeam?"":field("studentTeamId").value,metadata});
      say(creatingTeam ? "Team created. Your teammates can now select its name from this class link." : "Access created and you have joined the team.");
      await render();
    } catch (error) {
      say(error.message||(creatingTeam
        ? "The team could not be created. Use a team name that is not already taken."
        : "Student access could not be created. Check the entries and try again."));
    }
  }

  async function loadProfile() {
    let result = await db.from("profiles").select("*").eq("id", currentUser.id).single();
    if(result.error && /permission denied|jwt|unauthorized/i.test(result.error.message||"")){
      authTransition=true;
      try {
        const refreshed=await db.auth.refreshSession();
        if(!refreshed.error&&refreshed.data.session?.user){
          currentUser=refreshed.data.session.user;
          result=await db.from("profiles").select("*").eq("id",currentUser.id).single();
        }
      } finally {
        authTransition=false;
      }
    }
    if (result.error) throw result.error;
    profile = result.data;
  }

  function accountBar(extra="") {
    return `<div class="account-bar"><p><span class="live-dot"></span>Signed in as <strong>${esc(profile.display_name)}</strong> · ${esc(profile.app_role)}</p><div class="account-actions">${extra}${["instructor","platform_admin"].includes(profile.app_role)?`<a class="btn" href="?portal=student#classroom-access" target="_blank" rel="noopener">Preview student entrance</a>`:""}<button class="btn" id="signOut" type="button">Sign out</button></div></div>`;
  }

  async function studentScreen() {
    const m = await db.from("team_members").select("team_id,assigned_role,teams(id,name,active_mission,mission_locked,sections(released_mission))").eq("user_id",currentUser.id).maybeSingle();
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
      <div class="instructions-lead"><strong>${esc(membership.teams.name)} · Mission ${mission}</strong><br>Your seat: ${esc(membership.assigned_role || "Not assigned")}.</div>
      <div class="visibility-guide"><strong>Who can see this work?</strong><span>Teammates see the roster, live role notes, and shared report.</span><span>Your private reflection is visible only to you, your assigned professor, and the platform administrator.</span></div>
      <div class="classroom-grid">
        <aside class="classroom-card"><h3>Team roster</h3><ul class="roster">${roster.map(x=>`<li><strong>${esc(x.profiles?.display_name)}</strong><br>${esc(x.assigned_role||"Role pending")}</li>`).join("")}</ul><h3>Live role notes</h3><div id="teamNotes">${(notesResult.data||[]).map(n=>`<p data-note-author="${n.author_id}"><strong>${esc(roster.find(r=>r.user_id===n.author_id)?.profiles?.display_name||"Team member")}:</strong> ${esc(n.note_text)}</p>`).join("")||"<p>No notes yet.</p>"}</div></aside>
        <div>
          <div class="classroom-card"><h3>My role notes</h3><label for="liveRoleNotes">What I observe and recommend</label><textarea id="liveRoleNotes" ${membership.teams.mission_locked?"disabled":""}>${esc(myNote)}</textarea></div>
          <form class="classroom-card" id="sharedReport">
            <h3>Shared team report</h3>
            ${["findings","timeline","decision","unknowns","ai_transcript","ai_feedback","ai_security_brief"].map(k=>`<label for="cloud_${k}">${k==="ai_security_brief"?"AI Security Brief — risk, asset, evidence, control, and human owner":k.replaceAll("_"," ")}</label><textarea id="cloud_${k}" data-report-field="${k}" ${membership.teams.mission_locked?"disabled":""}>${esc(report[k]||"")}</textarea>`).join("")}
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

  const sectionOptions = (sections, selected="") =>
    `<option value="">Choose a section</option>${sections.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${esc(s.name)}</option>`).join("")}`;

  function formatAccessTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, {dateStyle:"medium", timeStyle:"short"}).format(new Date(value));
  }

  async function staffScreen() {
  const isAdmin=profile.app_role==="platform_admin";
    const sectionFields="id,name,class_link_token,instructor_id,is_active,released_mission,profiles!sections_instructor_id_fkey(display_name)";
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
  const releasedAiGuides=[...new Set(sections.map(section=>Number(section.released_mission)).filter(Boolean))].map(mission=>({mission,guide:aiSecurityGuides[mission]})).filter(item=>item.guide);
  const title=isAdmin?"Platform administrator dashboard":"Professor dashboard";
  const lead=isAdmin?"Review activity across the academy and provide support when needed.":"Create and manage your own classes, release weekly scenarios, assign seats, and review submissions.";
  mount.innerHTML=accountBar()+`
    <div class="admin-hero"><div><span class="eyebrow">${isAdmin?"Academy control center":"Section operations"}</span><h3>${title}</h3><p>${lead}</p></div><span class="privacy-badge">De-identified classroom data only</span></div>
    <div class="visibility-guide"><strong>One website, three entrances</strong><span>Student, Professor, and Administrator are role-based entrances to this same CoolHack website and database—not three separate sites.</span></div>
    <div class="visibility-guide staff-visibility"><strong>${isAdmin?"Administrator visibility":"Professor visibility"}</strong><span>${isAdmin?"You can review every class, professor, team, student alias, and submission in CoolHack.":"You can review only the classes created by your account and their teams, student aliases, shared work, and private reflections."}</span><span>The database enforces this boundary; it is not merely hidden by the dashboard.</span></div>
      <div class="guided-workflow" aria-label="Classroom setup sequence"><span><b>1</b> Professor creates class</span><span><b>2</b> Professor posts class link</span><span><b>3</b> First student creates team</span><span><b>4</b> Others select team</span><span><b>5</b> Professor assigns seats</span></div>
    <div class="admin-stats" aria-label="Classroom overview"><div><strong>${sections.length}</strong><span>Active sections</span></div><div><strong>${teams.length}</strong><span>Teams</span></div><div><strong>${members.length}</strong><span>Student accounts</span></div><div><strong>${teams.filter(t=>!t.mission_locked).length}</strong><span>Open workspaces</span></div></div>
    ${!isAdmin?`<div class="admin-panel-grid">
      <form class="classroom-card" id="createSection"><span class="card-kicker">Create class</span><h3>Open your Capstone class</h3><p>Name the class. CoolHack gives you one student link to post in Canvas.</p><label for="sectionName">Class label</label><input id="sectionName" placeholder="Example: Fall 2026 Thursday Capstone" maxlength="80" required><div class="hero-actions"><button class="btn primary">Create my class</button></div><p id="sectionMessage" class="form-message" role="status"></p></form>
      <div class="classroom-card"><span class="card-kicker">Independent professor</span><h3>You run your own class</h3><p>Create or archive classes, release one scenario each week, manage rosters, and review student work. Other professors cannot see or control your classes.</p></div>
    </div>`:`<div class="classroom-card"><span class="card-kicker">Administrator oversight</span><h3>Professors are independent</h3><p>Professors create and manage their own classes. Use this dashboard for academy-wide monitoring and support; no professor access code is required.</p></div>`}
    <div class="admin-panel-grid">
      <div class="classroom-card"><span class="card-kicker">Student self-service</span><h3>One link—no codes</h3><p>Post the class link in Canvas. One student creates the team; the others select its name and join.</p></div>
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
    ${releasedAiGuides.map(({mission,guide})=>`<section class="classroom-card professor-briefing ai-professor-briefing">
      <span class="card-kicker">Scenario ${mission} AI security coaching guide</span>
      <h3>${esc(guide.title)}</h3>
      <p><strong>Suggested introduction:</strong> “${esc(guide.opening)}”</p>
      <details><summary>AI security discussion prompts</summary><ul>${guide.prompts.map(prompt=>`<li>${esc(prompt)}</li>`).join("")}</ul></details>
      <details><summary>What students should be able to say afterward</summary><p>${esc(guide.takeaway)}</p><p>Ask one student from each team to answer: <strong>What is the AI risk, what control reduces it, and which human remains accountable?</strong></p></details>
    </section>`).join("")}
    <section class="classroom-card operations-board"><div class="operations-head"><div><span class="card-kicker">Live operations</span><h3>Sections, teams, and mission progress</h3></div><label for="sectionFilter">Show section<select id="sectionFilter"><option value="all">All available sections</option>${sections.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label></div>
      <div class="section-summary">${sections.map(section=>`
        <article data-section-summary="${section.id}">
          <strong>${esc(section.name)}</strong>
          <span>Professor: ${esc(section.profiles?.display_name||(isAdmin?"Unassigned legacy class":profile.display_name))}</span>
          <small>${teams.filter(t=>t.section_id===section.id).length} teams</small>
          <div class="section-code-actions"><button class="btn compact primary" type="button" data-copy-link="${esc(section.class_link_token)}">Copy class link</button></div>
          <div class="scenario-release"><label>Weekly scenario<select data-section-mission="${section.id}"><option value="0" ${Number(section.released_mission)===0?"selected":""}>Hidden</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(section.released_mission)===n?"selected":""}>Scenario ${n}</option>`).join("")}</select></label><button class="btn compact primary" type="button" data-scenario-reveal="${section.id}">${Number(section.released_mission)>0?"Change revealed scenario":"Reveal selected scenario"}</button>${Number(section.released_mission)>0?`<button class="btn compact" type="button" data-scenario-hide="${section.id}">Hide scenario</button>`:""}<small>${Number(section.released_mission)>0?`Students can access Scenario ${section.released_mission} only.`:"All scenarios are hidden from students."}</small></div>
          <div class="section-danger-actions"><button class="btn compact danger" type="button" data-section-archive="${section.id}" data-section-name="${esc(section.name)}">Archive section</button><small>Archives the class without deleting student work.</small></div>
        </article>`).join("")||"<p>No active classes yet.</p>"}</div>
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
  field("createSection")?.addEventListener("submit",async event=>{event.preventDefault();const result=await db.rpc("create_professor_section",{requested_name:field("sectionName").value.trim()});const created=Array.isArray(result.data)?result.data[0]:result.data;field("sectionMessage").textContent=result.error?result.error.message:`${created.name} created. Copy its class link below and post it in Canvas.`;if(!result.error)setTimeout(staffScreen,1400);});
  bindOperationButtons();
  function showOperationResult(message,isError=false){field("staffReview").innerHTML=`<p class="${isError?"auth-message":"form-message"}">${esc(message)}</p>`;}
  function bindOperationButtons(){
    document.querySelectorAll("[data-copy-link]").forEach(button=>button.addEventListener("click",async()=>{
      const link=`${location.origin}${location.pathname}?portal=student&class=${button.dataset.copyLink}#classroom-access`;
      try {
        await navigator.clipboard.writeText(link);
        button.textContent="Class link copied";
      } catch (_) {
        const input=document.createElement("textarea");
        input.value=link;input.setAttribute("readonly","");input.style.position="fixed";input.style.opacity="0";
        document.body.appendChild(input);input.select();
        const copied=document.execCommand("copy");input.remove();
        if(!copied){showOperationResult(`Copy this class link: ${link}`,true);return;}
        button.textContent="Class link copied";
      }
      setTimeout(()=>button.textContent="Copy class link",1200);
    }));
    document.querySelectorAll("[data-scenario-reveal]").forEach(button=>button.addEventListener("click",async()=>{const select=document.querySelector(`[data-section-mission="${button.dataset.scenarioReveal}"]`);const mission=Number(select?.value||0);if(!mission){showOperationResult("Choose a scenario before revealing it.",true);return;}const result=await db.rpc("set_section_released_mission",{requested_section:button.dataset.scenarioReveal,requested_mission:mission});if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-scenario-hide]").forEach(button=>button.addEventListener("click",async()=>{const result=await db.rpc("set_section_released_mission",{requested_section:button.dataset.scenarioHide,requested_mission:0});if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-section-archive]").forEach(button=>button.addEventListener("click",async()=>{if(!confirm(`Archive ${button.dataset.sectionName}? Student work will be retained and the class will disappear from active operations.`))return;button.disabled=true;const result=await db.rpc("archive_section",{requested_section:button.dataset.sectionArchive});if(result.error){showOperationResult(`Section was not archived: ${result.error.message}`,true);button.disabled=false;}else{await staffScreen();}}));
    document.querySelectorAll("[data-team-review]").forEach(button=>button.addEventListener("click",()=>reviewTeam(button.dataset.teamReview,button.dataset.teamName,Number(button.dataset.mission))));
    document.querySelectorAll("[data-team-control]").forEach(button=>button.addEventListener("click",async()=>{const changes={};if(button.dataset.teamControl==="lock")changes.mission_locked=button.dataset.locked!=="true";if(button.dataset.teamControl==="mission")changes.active_mission=Number(document.querySelector(`[data-mission-select="${button.dataset.teamId}"]`)?.value);const result=await db.from("teams").update(changes).eq("id",button.dataset.teamId);if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-member-role]").forEach(button=>button.addEventListener("click",async()=>{const select=document.querySelector(`[data-member-role-select="${button.dataset.memberRole}"]`);const result=await db.from("team_members").update({assigned_role:select.value||null}).eq("team_id",button.dataset.currentTeam).eq("user_id",button.dataset.memberRole);if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-member-move]").forEach(button=>button.addEventListener("click",async()=>{const select=document.querySelector(`[data-member-move-select="${button.dataset.memberMove}"]`);if(!select?.value){showOperationResult("Choose a destination team first.",true);return;}const result=await db.from("team_members").update({team_id:select.value,assigned_role:null}).eq("team_id",button.dataset.currentTeam).eq("user_id",button.dataset.memberMove);if(result.error)showOperationResult(result.error.message,true);else staffScreen();}));
    document.querySelectorAll("[data-member-remove]").forEach(button=>button.addEventListener("click",async()=>{if(!confirm(`Remove ${button.dataset.memberName} from this team? Saved submissions will be retained for staff review.`))return;button.disabled=true;const result=await db.rpc("remove_team_member",{requested_team:button.dataset.currentTeam,requested_user:button.dataset.memberRemove});if(result.error){showOperationResult(`Member was not removed: ${result.error.message}`,true);button.disabled=false;}else{await staffScreen();}}));
  }
}

  function renderTeamOperations(teams,sections,members,professors,isAdmin) {
  const roles=["SOC Analyst","Incident Responder","Security Lead","Communications Lead"];
  if(!teams.length)return "<div class=\"empty-state\"><strong>No teams yet.</strong><p>Post the class link in Canvas. The first student will create a team, and it will appear here automatically.</p></div>";
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
      </div>`).join("")||"<p>No students yet. Students will appear here after opening the class link and selecting this team.</p>"}</div>
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
      <h4>Shared team report</h4>${["findings","timeline","decision","unknowns","ai_transcript","ai_feedback","ai_security_brief"].map(k=>`<div class="review-entry"><strong>${k.replaceAll("_"," ")}</strong><p>${esc(report[k]||"No entry yet.")}</p></div>`).join("")}
      <h4>Role notes</h4>${(notesResult.data||[]).map(n=>`<div class="review-entry"><strong>${esc(n.profiles?.display_name||"Team member")}</strong><p>${esc(n.note_text||"No entry yet.")}</p></div>`).join("")||"<p>No role notes yet.</p>"}
      <h4>Private reflections</h4>${(reflectionsResult.data||[]).map(r=>`<div class="review-entry"><strong>${esc(r.profiles?.display_name||"Student")} · ${r.submitted_at?"Submitted":"Draft"}</strong><p>${esc(r.reflection_text||"No entry yet.")}</p></div>`).join("")||"<p>No reflections yet.</p>"}
    </div>`;
    field("closeReview")?.addEventListener("click",()=>field("staffReview").innerHTML="");
    field("staffReview").scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function signOutCurrentSession(event){
    const button=event?.currentTarget;
    if(button){button.disabled=true;button.textContent="Signing out…";}
    authTransition=true;
    try {
      const {error}=await db.auth.signOut({scope:"local"});
      if(error) throw error;
      currentUser=null;
      profile=null;
      membership=null;
      if(channel){await db.removeChannel(channel);channel=null;}
      Object.keys(sessionStorage).filter(key=>key.startsWith("coolhack-access-")).forEach(key=>sessionStorage.removeItem(key));
      authScreen();
    } catch(error) {
      if(button){button.disabled=false;button.textContent="Sign out";}
      say(error.message||"CoolHack could not sign out. Refresh the page and try again.");
    } finally {
      authTransition=false;
    }
  }
  function bindSignOut(){field("signOut")?.addEventListener("click",signOutCurrentSession);}
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
    catch(error){mount.innerHTML=`<div class="classroom-card"><h3>CoolHack could not open the classroom</h3><p>${esc(error.message)}</p><p>Refresh once. If the message remains, sign out and sign in again.</p><div class="hero-actions"><button class="btn" id="retryClassroom" type="button">Try again</button><button class="btn" id="signOut" type="button">Sign out</button></div></div>`;field("retryClassroom")?.addEventListener("click",()=>scheduleRender());bindSignOut();}
  }
  db.auth.getSession().then(()=>scheduleRender());
  db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(!authTransition)scheduleRender();});
})();
