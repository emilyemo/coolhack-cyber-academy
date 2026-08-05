(() => {
  "use strict";

  const cases = [
    [1,"Password reset request","Jordan Lee","I cannot remember my password, and I have a meeting in twenty minutes.","Access & Identity","Identity & Access",[["Can you verify your username and department?","I am jlee in Finance. I can verify through the approved employee process."],["What exactly happens when you try to sign in?","The portal says the username or password is incorrect. I have not seen a lockout message."],["Do you still have access to your registered verification method?","Yes, I have my company phone and can complete MFA."],["May I have your password?","No. A service-desk technician should never ask me to disclose it."]]],
    [1,"Account locked after repeated attempts","Casey Morgan","My account suddenly stopped working. I tried the password many times.","Access & Identity","Identity & Access",[["What message do you see?","It says the account is locked after too many unsuccessful attempts."],["Which systems are affected?","Email, the employee portal, and the laptop sign-in all use this account."],["Did you make all of the attempts?","Yes. I changed my password yesterday and kept trying the old one."],["Is anyone else affected?","No, only me."]]],
    [1,"Office printer unavailable","Taylor Reed","The printer is broken again. I need these documents now.","Hardware","Endpoint Support",[["What is the printer name or location?","PRN-FIN-03 beside the Finance copy room."],["What happens when you print?","The job stays in the queue and shows Offline."],["Can other people print to it?","Two coworkers say it is offline for them too."],["Are any warning lights or messages visible?","The display says Network unavailable. There is paper and no jam."]]],
    [1,"Laptop cannot connect to Wi-Fi","Avery Brooks","My laptop will not connect to the office Wi-Fi, but my phone works.","Network","Network Operations",[["Which network are you selecting?","The approved CoolHack-Staff wireless network."],["What error appears?","It says Cannot connect to this network."],["Did it work previously?","Yes, yesterday. The laptop installed updates overnight."],["Is anyone else affected?","The people beside me are connected normally."]]],
    [1,"Email will not send","Morgan Hayes","My email is stuck and will not send to a customer.","Email & Collaboration","Messaging Support",[["Can you receive messages?","Yes, new messages are arriving."],["Is there an error or is it in the Outbox?","It remains in the Outbox and says the attachment is too large."],["How large is the attachment?","About 38 MB."],["Does a smaller test message send?","Yes, a message without the attachment sent immediately."]]],
    [1,"Approved software request","Riley Chen","My new employee needs the design application installed today.","Software","Service Desk",[["What is the employee's role and device?","Junior designer using assigned laptop LAP-1187."],["Has the manager approved the request?","Yes, the approval is in the onboarding request."],["Is a license already assigned?","I do not know; licensing must check."],["What is the business need?","The employee starts client design work tomorrow morning."]]],
    [1,"Shared-folder access request","Jamie Patel","I need access to the Payroll shared folder like everyone else on my team.","Access & Identity","Identity & Access",[["Who owns or approves access to the folder?","The Payroll manager is the data owner."],["Is there an approved access request?","Not yet. I was told to call the desk."],["What access level is required?","Read-only for monthly reconciliation."],["Should we copy another employee's permissions?","No. My access should be approved for my job, not copied automatically."]]],
    [1,"Monitor shows No Signal","Drew Foster","My screen is black and says No Signal, so I think the computer died.","Hardware","Endpoint Support",[["Is the computer powered on?","Yes. The laptop screen works and I can hear notification sounds."],["Which input is selected on the monitor?","DisplayPort, but the dock is connected through HDMI."],["Are the cables secure?","The HDMI cable at the dock feels loose."],["Did anything change recently?","The desk was moved yesterday."]]],
    [1,"Slow computer complaint","Skyler James","Everything on my computer is painfully slow today.","Hardware","Endpoint Support",[["When did the problem begin?","This morning after I opened a very large spreadsheet."],["Is one application slow or the whole device?","Mostly the spreadsheet and browser; other applications respond."],["Have you restarted?","Not for eleven days because I have many tabs open."],["Do you see any warnings?","The disk has less than 2 GB free."]]],
    [1,"VPN connection failure","Parker Adams","I am at home and the VPN refuses to connect.","Network","Network Operations",[["What exact message appears?","Authentication failed: certificate expired."],["Does normal internet access work?","Yes, websites load normally."],["When did VPN last work?","Friday, before the laptop was off for a week."],["Are you using the company laptop?","Yes, asset LAP-1022."]]],
    [2,"Suspicious password-reset email","Sam Rivera","I received a password reset message, but I did not request one.","Security","Security Operations Center",[["Did you click any link or open an attachment?","No. I called before touching anything."],["What is the sender address?","security-update@coolhack-support.example, not our normal domain."],["Does the message create urgency?","Yes. It says my account will be disabled in fifteen minutes."],["Can you forward it safely?","I can use the approved Report Phishing button without opening links."]]],
    [2,"User clicked a phishing link","Alex Kim","I clicked a delivery link and the page looked strange. I closed it.","Security","Security Operations Center",[["Did you enter any information?","Yes, I entered my work username and password before noticing the address."],["Did you approve any MFA prompt?","No. One arrived, but I denied it."],["Is the device still connected?","Yes, and I have stopped using it."],["When did this happen?","About six minutes ago."]]],
    [2,"Unexpected MFA prompts","Robin Walker","My phone keeps asking me to approve a sign-in that is not mine.","Security","Security Operations Center",[["How many prompts and when?","Seven prompts in the last ten minutes."],["Did you approve any?","I may have approved the first one by habit."],["Have you shared or reused your password?","I reused a similar password on a shopping site last year."],["Can you still access the account?","Yes, but I have not changed anything yet."]]],
    [2,"Missing company laptop","Cameron Bell","My company laptop is missing after my flight.","Security","Security Operations Center",[["When and where was it last seen?","At the airport security checkpoint about an hour ago."],["Was it powered off and encrypted?","It was asleep. Company laptops are supposed to use full-disk encryption."],["Was sensitive work stored locally?","A client report was saved for offline review."],["Have you reported it to airport security?","Yes, and I have the reference number."]]],
    [2,"Unknown USB drive","Quinn Davis","I found a USB drive labeled Payroll in the parking lot. Should I plug it in to identify the owner?","Security","Security Operations Center",[["Did anyone connect it to a device?","No. It is still on my desk."],["Where exactly was it found?","Near the employee entrance this morning."],["Has it been handled safely?","Only by the edges, but no chain-of-custody record exists yet."],["Should it be tested on a spare laptop?","Not by normal staff. Security should collect and analyze it safely."]]],
    [2,"Antivirus alert","Devon Price","A red antivirus message says a threat was blocked. Can I ignore it?","Security","Security Operations Center",[["What is the alert name?","Trojan.Generic in a file named invoice_viewer.exe."],["What were you doing when it appeared?","Opening an invoice attachment from an unfamiliar vendor."],["Did the file run?","I double-clicked it; then the antivirus alert appeared."],["Are there other symptoms?","A command window flashed briefly before the alert."]]],
    [2,"Browser redirects","Reese Coleman","My browser keeps sending searches to strange websites.","Security","Security Operations Center",[["When did this begin?","After I installed a free PDF converter yesterday."],["Does it affect more than one browser?","Yes, both approved browsers."],["Are there new extensions?","There is one called QuickSearch that I do not recognize."],["Has antivirus been run?","Not yet."]]],
    [2,"Sensitive email sent externally","Harper Long","I accidentally emailed a confidential spreadsheet to the wrong outside address.","Security","Security Operations Center",[["What classification was the file?","Confidential: employee compensation."],["When was it sent?","Four minutes ago."],["Was it encrypted or password protected?","No."],["Have you contacted the recipient?","No. I called the desk first."]]],
    [2,"Former employee account active","Emerson Grant","An employee who left last week still appears in our shared application.","Security","Identity & Access",[["What was the termination date?","Last Friday at 5:00 p.m."],["Is the account only listed or has it been used?","The audit screen shows a login early this morning."],["What access did the employee have?","Vendor payment approval."],["Has HR or the manager confirmed the departure?","Yes, the offboarding ticket says completed."]]],
    [2,"Files have strange extensions","Finley Scott","All my project files now end in .locked and a message wants payment.","Security","Security Operations Center",[["Is the device still connected to the network?","Yes, through both Wi-Fi and a dock."],["Are shared-drive files affected?","The project share also has renamed files."],["When did it begin?","About fifteen minutes after I opened a resume attachment."],["Has anyone else reported it?","A teammate just messaged that the shared folder will not open."]]],
    [3,"Business application outage","Operations Desk","Several people cannot reach the order system, and customers are waiting.","Business Application","Application Support",[["How many users and locations are affected?","At least 24 users at two offices."],["What error appears?","503 Service Unavailable."],["When did it begin?","At 9:12 a.m., immediately after a planned release."],["Is there a workaround?","Staff can record orders manually for about thirty minutes."]]],
    [3,"Executive mobile-device issue","Executive Assistant","The COO's phone cannot access email before an important trip. Fix it now.","Email & Collaboration","Messaging Support",[["Is only email affected?","Calls and internet work; company email requests repeated sign-in."],["Was the device replaced or updated?","It updated overnight."],["Can identity be verified through the approved process?","Yes, but do not bypass verification because the caller is an executive."],["Are other executives affected?","No reports yet."]]],
    [3,"Failed logins from unfamiliar location","Identity Monitoring","A user has repeated failed logins from another country.","Security","Security Operations Center",[["Was there a successful login?","One successful login followed 34 failures."],["Is the employee traveling?","The travel register shows the employee is working in Houston."],["Was MFA used?","The successful event records MFA approval."],["What account privileges exist?","The user can approve purchasing requests."]]],
    [3,"Department folder inaccessible","Legal Operations","The entire Legal team suddenly lost access to its shared folder.","Access & Identity","Identity & Access",[["How many people are affected?","The full team of 18."],["What changed recently?","An access-group cleanup finished thirty minutes ago."],["Can administrators reach the data?","Storage is online and administrators can open it."],["Is there a workaround?","No approved alternate location contains the current files."]]],
    [3,"Possible business email compromise","Accounts Payable","Our CEO emailed new banking instructions for an urgent vendor payment.","Security","Security Operations Center",[["Does the request follow the payment process?","No. It asks us to skip the second approval."],["Does the sender address exactly match?","The display name is right, but the domain uses a look-alike letter."],["Has anyone transferred money?","No. The analyst paused the payment."],["Can the request be verified independently?","Yes, using the known executive contact process, not by replying."]]],
    [3,"Unusual web-server traffic","Monitoring System","The public web server is making large outbound connections at 2:00 a.m.","Security","Security Operations Center",[["What is the destination?","An unapproved external IP over port 443."],["Is this normal backup traffic?","No matching job exists in the approved schedule."],["Are there related alerts?","A new administrator account and web-shell signature appeared first."],["Is the site still available?","Yes, but response time is degrading."]]],
    [3,"Unauthorized remote-access tool","Endpoint Monitoring","Remote-control software appeared on a sales laptop.","Security","Security Operations Center",[["Is the software approved?","No. It is not in the application catalog."],["Who installed it?","The user says a caller claiming to be IT guided the installation."],["Is a session active?","Telemetry shows an external session connected now."],["What did the caller request?","The user was told to open banking reports for troubleshooting."]]],
    [3,"Vendor account outside maintenance window","Access Monitoring","A vendor account accessed production at midnight outside its approved window.","Security","Security Operations Center",[["What was the approved window?","Saturday from 6:00 to 8:00 p.m.; this is Wednesday."],["What actions occurred?","Database queries and a large export."],["Has the vendor confirmed the activity?","The vendor manager says no work was scheduled."],["Is the account still active?","Yes, the session remains open."]]],
    [3,"Possible denial-of-service condition","Network Monitoring","The customer portal is slow while inbound traffic has increased twentyfold.","Network","Network Operations",[["Is the traffic from one source?","It comes from thousands of distributed addresses."],["Are legitimate users affected?","Yes. Checkout requests are timing out."],["Are servers compromised?","No evidence yet; CPU is high because of request volume."],["Are protections enabled?","The standard rate limit is active but insufficient."]]],
    [3,"Multiple alerts, one incident","SOC Monitoring","We have an impossible-travel alert, mailbox rule change, and unusual file download for one user.","Security","Security Operations Center",[["What is the event order?","Successful foreign login, mailbox rule creation, then 3.2 GB downloaded."],["Did the user approve MFA?","The user reports approving a prompt while distracted."],["Could the alerts be unrelated?","Possibly, but the shared identity and timeline suggest one incident."],["What access does the user have?","Sales proposals and customer contact records."]]]
  ].map((item,index)=>({id:index+1,level:item[0],title:item[1],caller:item[2],statement:item[3],suggestedCategory:item[4],suggestedGroup:item[5],questions:item[6]}));

  function evidenceFor(item){
    const answers=item.questions.map(pair=>pair[1]);
    const common=[
      {id:"intake",icon:"☎",name:"Caller interview",source:"Recorded intake",result:answers.map((answer,index)=>`Q${index+1}: ${answer}`).join("\n")},
      {id:"knowledge",icon:"▣",name:"Knowledge & procedure",source:"Approved support library",result:`Procedure match: ${item.suggestedCategory}. Verify identity when required, preserve evidence, use least privilege, document each action, and route to ${item.suggestedGroup}. Never request passwords or bypass approval.`}
    ];
    const profiles={
      "Access & Identity":[
        {id:"identity",icon:"◎",name:"Identity audit",source:"IAM console",result:`Account and access events reviewed for “${item.title}.” Relevant observation: ${answers[1]||answers[0]} No password content is available to analysts.`},
        {id:"change",icon:"↺",name:"Access/change records",source:"Change management",result:`Recent approvals and changes reviewed. Relevant observation: ${answers[2]||"No matching approved change was found in the available window."}`}
      ],
      "Security":[
        {id:"telemetry",icon:"⌁",name:"Endpoint / identity telemetry",source:"EDR and IAM",result:`Correlated security events for “${item.title}.” ${answers[1]||answers[0]} Timeline correlation: ${answers[3]||"additional validation required."}`},
        {id:"intel",icon:"◇",name:"Threat & exposure check",source:"SIEM / threat intelligence",result:`Indicators and related alerts reviewed. ${answers[2]||"No confirmed related alert yet."} Treat the evidence as suspicious until containment and scope are verified.`}
      ],
      "Network":[
        {id:"network",icon:"⌁",name:"Network health",source:"NMS and firewall",result:`Connectivity and traffic reviewed for “${item.title}.” ${answers[1]||answers[0]} Scope observation: ${answers[2]||"Scope is not yet established."}`},
        {id:"changes",icon:"↺",name:"Network changes",source:"CMDB / change calendar",result:`Configuration and maintenance records checked. ${answers[3]||"No related approved change is visible."}`}
      ],
      "Hardware":[
        {id:"asset",icon:"▤",name:"Asset record",source:"CMDB / endpoint inventory",result:`Affected asset context reviewed. ${answers[0]} Last known condition: ${answers[3]||answers[1]}`},
        {id:"diagnostic",icon:"⌁",name:"Device diagnostics",source:"Endpoint tools",result:`Remote health and symptom check completed. ${answers[1]} Related physical or capacity observation: ${answers[2]||"No additional fault reported."}`}
      ],
      "Email & Collaboration":[
        {id:"mail",icon:"✉",name:"Mail trace",source:"Messaging console",result:`Message flow and authentication events reviewed. ${answers[1]||answers[0]} Comparison test: ${answers[3]||"No comparison available."}`},
        {id:"identity",icon:"◎",name:"Identity session check",source:"IAM console",result:`Account session and device context reviewed. ${answers[2]||"No unusual account event is visible in the supplied window."}`}
      ],
      "Software":[
        {id:"endpoint",icon:"▤",name:"Endpoint inventory",source:"Software center / EDR",result:`Application and device context reviewed. ${answers[0]} User-observed behavior: ${answers[1]||item.statement}`},
        {id:"catalog",icon:"✓",name:"Catalog & license check",source:"Service catalog",result:`Approval, entitlement, and compatibility checked. ${answers[2]||"Entitlement requires verification."} Business need: ${answers[3]||"Not recorded."}`}
      ],
      "Business Application":[
        {id:"app",icon:"⌁",name:"Application monitoring",source:"APM dashboard",result:`Service health reviewed. ${answers[0]} Error/timing evidence: ${answers[1]} ${answers[2]}`},
        {id:"change",icon:"↺",name:"Release & change log",source:"Change calendar",result:`Recent production activity correlated with the report. ${answers[2]} Workaround status: ${answers[3]}`}
      ]
    };
    return [...(profiles[item.suggestedCategory]||profiles.Software),...common];
  }

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const storeKey = "coolhack-service-desk-demo-v1";
  const cfg = window.CoolHackConfig;
  const db = cfg && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  let currentUser = null;
  let teamId = null;
  let teamName = "Your team";
  let cloudReady = false;
  let cloudSaveTimer = null;
  let workspaceChannel = null;
  let state = loadState();
  let activeCaseId = state.activeCaseId || 1;
  let activeTicketId = null;
  let callAnswered = false;

  function loadState(){
    try { return JSON.parse(localStorage.getItem(storeKey)) || {tickets:[],drafts:{},counter:1024,activeCaseId:1}; }
    catch { return {tickets:[],drafts:{},counter:1024,activeCaseId:1}; }
  }
  function saveState(){
    state.activeCaseId=activeCaseId;
    localStorage.setItem(storeKey,JSON.stringify(state));
    updateQueueCount();
    if(!cloudReady||!db||!teamId||!currentUser)return;
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer=setTimeout(async()=>{
      const workspace={tickets:state.tickets,drafts:state.drafts,counter:state.counter,activeCaseId};
      const {error}=await db.from("service_desk_workspaces").upsert({team_id:teamId,case_id:activeCaseId,workspace,last_editor:currentUser.id,updated_at:now()},{onConflict:"team_id,case_id"});
      if(error)$("#cloudMessage").textContent=`Shared save failed: ${error.message}`;
      else $("#sessionLabel").textContent=`${teamName} · Shared and saved`;
    },250);
  }
  function now(){ return new Date().toISOString(); }
  function displayTime(value){ return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)); }
  function priority(impact,urgency){
    if(!impact||!urgency) return "";
    const matrix={"1-1":1,"1-2":2,"1-3":3,"2-1":2,"2-2":3,"2-3":4,"3-1":3,"3-2":4,"3-3":5};
    return `P${matrix[`${impact}-${urgency}`]}`;
  }

  function renderCaseList(){
    const filter=$("#levelFilter").value;
    const visible=cases.filter(item=>filter==="all"||String(item.level)===filter);
    $("#caseList").innerHTML=visible.map(item=>`<button class="case-button ${item.id===activeCaseId?"active":""}" type="button" data-case="${item.id}"><span class="case-number">${String(item.id).padStart(2,"0")}</span><b>${esc(item.title)}</b><span class="level-dot">L${item.level}</span><small>${item.level===1?"Foundation":item.level===2?"Security awareness":"Complex workplace case"}</small></button>`).join("");
    $$("[data-case]").forEach(button=>button.addEventListener("click",()=>selectCase(Number(button.dataset.case))));
  }

  function selectCase(id){
    activeCaseId=id; saveState(); renderCaseList();
    const item=cases.find(entry=>entry.id===id);
    $("#releasedCaseLabel").textContent=`Case ${String(id).padStart(2,"0")} · ${item.title}`;
    $("#caseTitle").textContent=`Case ${String(id).padStart(2,"0")} · ${item.title}`;
    $("#caseLevel").textContent=`Level ${item.level}`;
    $("#callerStatement").textContent=`“${item.statement}”`;
    $("#caller").value=item.caller;
    $("#questionChips").innerHTML=item.questions.map((pair,index)=>`<button class="question-chip" type="button" data-question="${index}">${esc(pair[0])}</button>`).join("");
    $("#callerResponse").hidden=true;
    $$("[data-question]").forEach(button=>button.addEventListener("click",()=>{
      button.classList.add("asked");
      $("#callerResponse").innerHTML=`<b>Caller:</b> ${esc(item.questions[Number(button.dataset.question)][1])}`;
      $("#callerResponse").hidden=false;
    }));
    loadDraft(id);
    if(!$("#createView").hidden) resetCallStage();
  }

  function updateProgress(stage){
    const order=["call","interview","create","work","review"];
    $$('[data-progress]').forEach(item=>item.classList.toggle("active",item.dataset.progress===stage));
    $("#shiftProgress").setAttribute("data-stage",String(order.indexOf(stage)+1));
  }

  function resetCallStage(){
    callAnswered=false;
    $("#ringScreen").classList.remove("hidden");
    $("#callerStatement").hidden=true;
    $("#interviewInstruction").classList.add("hidden");
    $("#questionChips").hidden=true;
    $("#callerResponse").hidden=true;
    $("#beginTicket").classList.add("hidden");
    $("#ticketForm").classList.add("hidden");
    $("#callStatus").textContent="Incoming employee call…";
    updateProgress("call");
  }

  function startShift(){
    $("#sessionLabel").textContent=`${teamName} · Shared shift`;
    $("#welcomeCard").classList.add("hidden");
    $("#shiftProgress").classList.remove("hidden");
    $("#workspaceTabs").classList.remove("hidden");
    $("#createView").hidden=false;
    $("#createView").classList.add("active");
    resetCallStage();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function answerCall(){
    callAnswered=true;
    $("#ringScreen").classList.add("hidden");
    $("#callerStatement").hidden=false;
    $("#interviewInstruction").classList.remove("hidden");
    $("#questionChips").hidden=false;
    $("#beginTicket").classList.remove("hidden");
    $("#callStatus").textContent="Call connected · Discuss each question as a team";
    updateProgress("interview");
  }

  function beginTicket(){
    if(!callAnswered)return;
    $("#ticketForm").classList.remove("hidden");
    updateProgress("create");
    $("#ticketForm").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function getFormData(){
    return {caseId:activeCaseId,caller:$("#caller").value,contactMethod:$("#contactMethod").value,shortDescription:$("#shortDescription").value.trim(),description:$("#description").value.trim(),recordType:$("#recordType").value,category:$("#category").value,affectedItem:$("#affectedItem").value.trim(),assignmentGroup:$("#assignmentGroup").value,impact:$("#impact").value,urgency:$("#urgency").value,priority:priority($("#impact").value,$("#urgency").value)};
  }
  function fillForm(data={}){
    const item=cases.find(entry=>entry.id===activeCaseId);
    $("#caller").value=item.caller;
    ["contactMethod","shortDescription","description","recordType","category","affectedItem","assignmentGroup","impact","urgency"].forEach(id=>{ if(data[id]!=null) $(`#${id}`).value=data[id]; else if(id!=="contactMethod") $(`#${id}`).value=""; });
    updatePriority(); updateShortCount();
  }
  function loadDraft(caseId){ fillForm(state.drafts[caseId]||{}); }
  function updatePriority(){ $("#priority").value=priority($("#impact").value,$("#urgency").value)||"Select impact and urgency"; }
  function updateShortCount(){ $("#shortCount").textContent=$("#shortDescription").value.length; }

  function saveDraft(){ state.drafts[activeCaseId]=getFormData(); saveState(); $("#createMessage").textContent=cloudReady?"Draft saved to the shared team workspace.":"Preview draft saved on this device."; }

  function submitTicket(event){
    event.preventDefault();
    const data=getFormData();
    const ticket={...data,id:crypto.randomUUID(),number:`INC${String(state.counter++).padStart(7,"0")}`,state:"New",assignee:"",comments:"",notes:"",assessment:"",evidenceReviewed:[],resolutionCode:"",resolutionNotes:"",reviewStatus:"Working",createdAt:now(),updatedAt:now(),activity:[{at:now(),type:"Created",text:`Ticket created by service desk and routed to ${data.assignmentGroup}.`}],quality:{}};
    state.tickets.unshift(ticket); delete state.drafts[activeCaseId]; saveState();
    $("#createMessage").textContent=`${ticket.number} submitted to ${ticket.assignmentGroup}. It is now in the work queue.`;
    fillForm(); renderQueue();
    updateProgress("work");
    switchView("queue");
    activeTicketId=ticket.id;
    renderQueue(); openTicket(ticket.id);
  }

  function switchView(name){
    $$(".tab").forEach(tab=>{const active=tab.dataset.view===name;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));});
    $$('[data-view-panel]').forEach(panel=>{const active=panel.dataset.viewPanel===name;panel.classList.toggle("active",active);panel.hidden=!active;});
    if(name==="queue"){ renderQueue(); updateProgress("work"); }
  }

  function updateQueueCount(){ $("#queueCount").textContent=state.tickets.filter(ticket=>ticket.state!=="Resolved").length; }
  function renderQueue(){
    const filter=$("#queueFilter").value;
    const visible=state.tickets.filter(ticket=>filter==="all"||ticket.state===filter);
    $("#queueList").innerHTML=visible.length?visible.map(ticket=>`<button class="queue-button ${ticket.id===activeTicketId?"active":""}" type="button" data-ticket="${ticket.id}"><b>${esc(ticket.number)} · ${esc(ticket.shortDescription)}</b><span class="priority-badge">${esc(ticket.priority)}</span><small>${esc(ticket.assignmentGroup)} · ${esc(ticket.state)} · ${displayTime(ticket.updatedAt)}</small></button>`).join(""):`<p class="empty-list">No tickets match this queue.</p>`;
    $$('[data-ticket]').forEach(button=>button.addEventListener("click",()=>openTicket(button.dataset.ticket)));
  }

  function openTicket(id){
    activeTicketId=id; renderQueue();
    const ticket=state.tickets.find(item=>item.id===id); if(!ticket)return;
    const template=$("#workTicketTemplate").content.cloneNode(true);
    const host=$("#workTicket"); host.className="work-ticket"; host.replaceChildren(template);
    host.querySelector("[data-ticket-number]").textContent=ticket.number;
    host.querySelector("[data-ticket-summary]").textContent=ticket.shortDescription;
    host.querySelector("[data-priority]").textContent=ticket.priority;
    host.querySelector("[data-priority]").classList.add(`priority-${String(ticket.priority).toLowerCase()}`);
    host.querySelector("[data-record-facts]").innerHTML=[["Caller",ticket.caller],["Type",ticket.recordType],["Category",ticket.category],["Affected item",ticket.affectedItem],["Impact",ticket.impact],["Urgency",ticket.urgency],["Assignment group",ticket.assignmentGroup],["Created",displayTime(ticket.createdAt)]].map(([label,value])=>`<div><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join("")+`<div style="grid-column:1/-1"><small>Description</small><b>${esc(ticket.description)}</b></div>`;
    Object.entries(ticket.quality||{}).forEach(([key,value])=>{const input=host.querySelector(`[data-quality="${key}"]`);if(input)input.checked=value;});
    host.querySelector("[data-work-state]").value=ticket.state;
    host.querySelector("[data-assignee]").value=ticket.assignee||"";
    host.querySelector("[data-comments]").value="";
    host.querySelector("[data-notes]").value="";
    host.querySelector("[data-assessment]").value=ticket.assessment||"";
    host.querySelector("[data-resolution-code]").value=ticket.resolutionCode||"";
    host.querySelector("[data-resolution-notes]").value=ticket.resolutionNotes||"";
    renderEvidence(host,ticket);
    renderActivity(host,ticket);
    host.querySelector(".work-form").addEventListener("submit",event=>saveTicketUpdate(event,ticket.id));
    host.querySelector("[data-escalate]").addEventListener("click",()=>{host.querySelector("[data-work-state]").value="Pending";host.querySelector("[data-transfer-group]").focus();host.querySelector("[data-work-message]").textContent="Choose the destination and reason, then add a work note describing the evidence and requested action.";});
    host.querySelector("[data-submit-review]").addEventListener("click",()=>submitForReview(ticket.id));
    const locked=["Awaiting Review","Closed"].includes(ticket.state);
    if(locked){host.querySelectorAll("input,textarea,select,button").forEach(control=>control.disabled=true);host.querySelector("[data-work-message]").textContent=ticket.state==="Closed"?"Professor approved this record. It is closed and read-only.":"Submitted for professor review. The record is read-only unless it is returned.";}
  }

  function renderEvidence(host,ticket){
    const item=cases.find(entry=>entry.id===ticket.caseId)||cases[0];
    const reviewed=Array.isArray(ticket.evidenceReviewed)?ticket.evidenceReviewed:[];
    const tools=evidenceFor(item);
    host.querySelector("[data-evidence-progress]").textContent=`${reviewed.length} of ${tools.length} reviewed`;
    host.querySelector("[data-evidence-tools]").innerHTML=tools.map(tool=>`<button type="button" class="evidence-tool ${reviewed.includes(tool.id)?"reviewed":""}" data-evidence="${esc(tool.id)}"><span>${tool.icon}</span><b>${esc(tool.name)}</b><small>${esc(tool.source)}</small></button>`).join("");
    host.querySelectorAll("[data-evidence]").forEach(button=>button.addEventListener("click",()=>{
      const tool=tools.find(entry=>entry.id===button.dataset.evidence); if(!tool)return;
      host.querySelector("[data-evidence-result]").innerHTML=`<small>${esc(tool.source)}</small><b>${esc(tool.name)}</b><pre>${esc(tool.result)}</pre>`;
      ticket.evidenceReviewed=Array.isArray(ticket.evidenceReviewed)?ticket.evidenceReviewed:[];
      if(!ticket.evidenceReviewed.includes(tool.id)){
        ticket.evidenceReviewed.push(tool.id); ticket.activity.push({at:now(),type:"Evidence reviewed",text:`Opened ${tool.name} (${tool.source}).`}); ticket.updatedAt=now(); saveState(); renderEvidence(host,ticket); renderActivity(host,ticket);
      }
    }));
  }

  function renderActivity(host,ticket){ host.querySelector("[data-activity]").innerHTML=[...ticket.activity].reverse().map(item=>`<article class="activity-item"><time>${displayTime(item.at)} · ${esc(item.type)}</time><p>${esc(item.text)}</p></article>`).join(""); }

  function saveTicketUpdate(event,id){
    event.preventDefault(); const host=$("#workTicket"); const ticket=state.tickets.find(item=>item.id===id);
    const newState=host.querySelector("[data-work-state]").value; const newComment=host.querySelector("[data-comments]").value.trim(); const newNote=host.querySelector("[data-notes]").value.trim(); const resolutionCode=host.querySelector("[data-resolution-code]").value; const resolutionNotes=host.querySelector("[data-resolution-notes]").value.trim(); const assessment=host.querySelector("[data-assessment]").value.trim(); const transferGroup=host.querySelector("[data-transfer-group]").value; const transferReason=host.querySelector("[data-transfer-reason]").value; const editor=host.querySelector("[data-assignee]").value.trim()||"Team member";
    if(transferGroup&&(!transferReason||!newNote)){host.querySelector("[data-work-message]").textContent="A transfer needs a destination, reason, and work note describing the handoff.";return;}
    if(newState==="Resolved"&&(!resolutionCode||!resolutionNotes)){host.querySelector("[data-work-message]").textContent="A resolved ticket needs both a resolution code and meaningful resolution notes.";return;}
    if(newState!==ticket.state)ticket.activity.push({at:now(),type:"State change",text:`${editor} changed state from ${ticket.state} to ${newState}.`});
    if(newComment)ticket.activity.push({at:now(),type:"Caller-visible comment",text:`${editor}: ${newComment}`});
    if(newNote)ticket.activity.push({at:now(),type:"Internal work note",text:`${editor}: ${newNote}`});
    if(transferGroup){ticket.activity.push({at:now(),type:"Assignment transfer",text:`${editor} transferred the record from ${ticket.assignmentGroup} to ${transferGroup}. Reason: ${transferReason}.`});ticket.assignmentGroup=transferGroup;}
    ticket.state=newState; ticket.assignee=editor; ticket.comments=[ticket.comments,newComment].filter(Boolean).join("\n\n"); ticket.notes=[ticket.notes,newNote].filter(Boolean).join("\n\n"); ticket.assessment=assessment; ticket.resolutionCode=resolutionCode; ticket.resolutionNotes=resolutionNotes; ticket.updatedAt=now(); ticket.quality={}; host.querySelectorAll("[data-quality]").forEach(input=>ticket.quality[input.dataset.quality]=input.checked);
    saveState(); renderQueue(); openTicket(id); $("#workTicket [data-work-message]").textContent=`${ticket.number} updated successfully.`;
  }

  function submitForReview(id){
    const host=$("#workTicket"); const ticket=state.tickets.find(item=>item.id===id); if(!ticket)return;
    const missing=[];
    if(Object.values(ticket.quality||{}).filter(Boolean).length<4)missing.push("all four intake checks");
    if((ticket.evidenceReviewed||[]).length<2)missing.push("at least two evidence sources");
    if(!(host.querySelector("[data-assessment]").value.trim()||ticket.assessment))missing.push("a supported team assessment");
    if(host.querySelector("[data-work-state]").value!=="Resolved"&&ticket.state!=="Resolved")missing.push("state set to Resolved and saved");
    if(!ticket.resolutionCode||!ticket.resolutionNotes)missing.push("saved resolution code and verification notes");
    if(missing.length){host.querySelector("[data-work-message]").textContent=`Not ready for review: complete ${missing.join(", ")}.`;return;}
    ticket.state="Awaiting Review"; ticket.reviewStatus="Submitted"; ticket.updatedAt=now(); ticket.activity.push({at:now(),type:"Review submission",text:`${ticket.assignee||"Team"} submitted the resolved record for professor quality review.`}); saveState(); renderQueue(); openTicket(id); updateProgress("review");
  }

  function resetDemo(){
    if(cloudReady){ $("#cloudMessage").textContent="Shared team records cannot be erased from the student screen."; return; }
    if(!confirm("Reset all demo tickets and drafts stored in this browser?"))return;
    localStorage.removeItem(storeKey); state=loadState(); activeCaseId=1; activeTicketId=null; renderCaseList(); selectCase(1); renderQueue(); updateQueueCount(); switchView("create");
  }

  function applyCloudWorkspace(row){
    if(!row?.workspace)return;
    state={
      tickets:Array.isArray(row.workspace.tickets)?row.workspace.tickets:[],
      drafts:row.workspace.drafts||{},
      counter:Number(row.workspace.counter)||1024,
      activeCaseId:Number(row.case_id)||activeCaseId
    };
    activeCaseId=Number(row.case_id)||activeCaseId;
    selectCase(activeCaseId);
    renderQueue(); updateQueueCount();
  }

  async function initSharedWorkspace(){
    const cloudMessage=$("#cloudMessage");
    if(window.CoolHackStandaloneDemo){
      teamName="Preview Team";
      $("#teamIdentity").innerHTML="<b>Preview Team</b><small> This phone-safe preview runs in one browser. The published classroom version synchronizes the same workspace for every teammate.</small>";
      $("#startShift").disabled=false;
      cloudMessage.textContent="Interactive preview ready. Start the shift, answer the call, and complete the ticket.";
      $("#sessionLabel").textContent="Interactive preview · Saved on this device";
      return;
    }
    if(!db){
      cloudMessage.innerHTML='The team connection is unavailable. <a href="index.html#classroom">Return to CoolHack sign-in</a>.';
      return;
    }
    const session=await db.auth.getSession();
    currentUser=session.data.session?.user||null;
    if(!currentUser){
      cloudMessage.innerHTML='Sign in through your class link first, then open the Service Desk. <a href="index.html#classroom">Go to CoolHack sign-in</a>.';
      $("#sessionLabel").textContent="Sign-in required";
      return;
    }
    const membership=await db.from("team_members")
      .select("team_id,teams(id,name,section_id,sections(released_service_case))")
      .eq("user_id",currentUser.id).maybeSingle();
    if(membership.error||!membership.data?.teams){
      cloudMessage.textContent=membership.error?.message||"No team was found for this account. Join a team from your class link first.";
      return;
    }
    teamId=membership.data.team_id;
    teamName=membership.data.teams.name;
    const released=Number(membership.data.teams.sections?.released_service_case||0);
    $("#teamIdentity").innerHTML=`<b>${esc(teamName)}</b><small> All teammates share the same call, ticket, queue, and activity history.</small>`;
    $(".prototype-controls").hidden=true;
    $("#resetDemo").hidden=true;
    if(!released){
      cloudMessage.textContent="Your professor has not released a Service Desk case yet.";
      $("#sessionLabel").textContent=`${teamName} · Waiting for a case`;
      return;
    }
    activeCaseId=released;
    const existing=await db.from("service_desk_workspaces").select("*").eq("team_id",teamId).eq("case_id",released).maybeSingle();
    if(existing.error){ cloudMessage.textContent=existing.error.message; return; }
    if(existing.data&&Number(existing.data.case_id)===released){
      applyCloudWorkspace(existing.data);
    }else{
      state={tickets:[],drafts:{},counter:1024,activeCaseId:released};
      activeCaseId=released;
      const created=await db.from("service_desk_workspaces").upsert({team_id:teamId,case_id:released,workspace:state,last_editor:currentUser.id,updated_at:now()},{onConflict:"team_id,case_id"}).select().single();
      if(created.error){ cloudMessage.textContent=created.error.message; return; }
      applyCloudWorkspace(created.data);
    }
    cloudReady=true;
    selectCase(released);
    $("#startShift").disabled=false;
    cloudMessage.textContent=`Case ${String(released).padStart(2,"0")} is ready. Start when your team is together.`;
    $("#sessionLabel").textContent=`${teamName} · Shared workspace ready`;
    workspaceChannel=db.channel(`service-desk-${teamId}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"service_desk_workspaces",filter:`team_id=eq.${teamId}`},payload=>{
        if(Number(payload.new.case_id)!==activeCaseId)return;
        if(payload.new.last_editor===currentUser.id)return;
        applyCloudWorkspace(payload.new);
        $("#sessionLabel").textContent=`${teamName} · Updated by a teammate`;
      }).subscribe();
  }

  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>switchView(tab.dataset.view)));
  $("#levelFilter").addEventListener("change",renderCaseList);
  $("#queueFilter").addEventListener("change",renderQueue);
  $("#impact").addEventListener("change",updatePriority); $("#urgency").addEventListener("change",updatePriority);
  $("#shortDescription").addEventListener("input",updateShortCount);
  $("#saveDraft").addEventListener("click",saveDraft); $("#ticketForm").addEventListener("submit",submitTicket);
  $("#resetDemo").addEventListener("click",resetDemo);
  $("#startShift").addEventListener("click",startShift);
  $("#answerCall").addEventListener("click",answerCall);
  $("#beginTicket").addEventListener("click",beginTicket);
  renderCaseList(); selectCase(activeCaseId); renderQueue(); updateQueueCount();
  initSharedWorkspace();
})();
