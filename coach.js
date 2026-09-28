(async()=>{'use strict';
const B=window.DeMovementBackend;
const PP=window.DeMovementPassport;
const I=window.DeMovementIntelligence;
const A=window.DeMovementAssistant;
const $=s=>document.querySelector(s);
const root=$('#coach-root');
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

let relationships=[],selected=null,detail=null,rosterEvidence=[],queue=[],assistantResult=null;

function localLog(x){
 return {kind:x.kind,completedAt:x.completed_at,title:x.title,primary:x.primary_intent||'',blend:x.blend||'none',energy:x.energy||'steady',durationMinutes:x.duration_minutes||0,effort:x.effort,control:x.control,confidence:x.confidence,movements:x.movements||[],domains:x.domains||[]};
}
function prettyGoal(x){return String(x||'').replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase())}
function priorityLabel(p){return {review:'Review first',followup:'Follow-up',watch:'Watch',steady:'Steady'}[p]||'Steady'}
function queueFor(id){return queue.find(x=>x.moverId===id)||null}

if(B.mode!=='supabase'){
 root.innerHTML='<section class="card"><h2>Cloud backend not connected</h2><p class="notice">The Coach Portal requires the Phase 7 cloud backend.</p></section>';
 return;
}
const sess=await B.session();if(!sess){location.replace('account.html?next=coach.html');return}
const me=await B.me();if(me?.account_status==='suspended'){location.replace('account.html');return}
if(me?.role==='administrator'){location.replace('administrator.html');return}
if(me?.role!=='coach'){location.replace('account.html');return}

async function refresh(preferQueue=false){
 relationships=await B.coachRelationships();
 rosterEvidence=await B.coachRosterEvidence();
 queue=A.coachQueue(rosterEvidence);
 if(selected&&!relationships.some(x=>x.mover_id===selected))selected=null;
 if(!selected){
  if(preferQueue&&queue.length)selected=queue[0].moverId;
  else if(relationships.length)selected=relationships[0].mover_id;
 }
 detail=selected?await B.coachMoverData(selected):null;
 assistantResult=null;
 render();
}
function moverList(){
 return relationships.map(r=>{
   const q=queueFor(r.mover_id);
   return `<button class="list-item ${r.mover_id===selected?'active':''}" data-mover="${r.mover_id}">
     <div><b>${esc(r.mover?.display_name||'Mover')}</b><small>${esc(r.mover?.email||'')} · ${esc(r.status)}</small></div>
     ${q?`<span class="attention-pill priority-${q.priority}">${esc(priorityLabel(q.priority))}</span>`:'<span>→</span>'}
   </button>`;
 }).join('')||'<div class="empty">No assigned Movers yet.</div>';
}
function attentionQueue(){
 if(!queue.length)return '<section class="card intelligence-card"><p class="eyebrow">COACH ASSISTANT</p><h2>No active Movers to analyse yet.</h2><p class="notice">Invite a Mover or reactivate an existing coaching relationship.</p></section>';
 return `<section class="card intelligence-card">
   <div class="intelligence-head"><div><p class="eyebrow">ATTENTION QUEUE</p><h2>Who may need your eyes first?</h2><p>Priority is generated from synced evidence. It is not a diagnosis or an automatic coaching action.</p></div><span class="role-chip">Human decides</span></div>
   <div class="attention-grid">${queue.slice(0,6).map(q=>`<button type="button" class="attention-item priority-${q.priority}" data-attention-mover="${q.moverId}">
      <span>${esc(priorityLabel(q.priority))}</span><b>${esc(q.name)}</b><small>${esc(q.headline)}</small>
      <em>${q.signals.length} signal${q.signals.length===1?'':'s'} →</em>
   </button>`).join('')}</div>
 </section>`;
}
function assignmentRows(items){
 return (items||[]).slice(0,8).map(a=>`<article><b>${esc(a.title)} · ${esc(a.status)}</b><small>${esc(a.kind)}${a.due_at?' · due '+new Date(a.due_at).toLocaleDateString('en-AU'):''}</small></article>`).join('')||'<p class="notice">No assignments yet.</p>';
}
function noteRows(items){
 return (items||[]).slice(0,8).map(n=>`<article><b>Private Coach note</b><small>${new Date(n.created_at).toLocaleString('en-AU')}</small><p style="margin:6px 0 0">${esc(n.note)}</p></article>`).join('')||'<p class="notice">No private notes yet.</p>';
}
function assistantHtml(){
 if(!detail)return '';
 const q=queueFor(selected);
 const defaultResult=q?{
   title:q.headline,
   answer:q.signals[0]?.evidence||'No strong signal.',
   evidence:q.signals.slice(0,4).map(x=>x.evidence),
   action:q.signals[0]?.action||'Continue normal coaching review.',
   proposal:null
 }:A.coachAnswer('Why does this Mover need attention?',detail);
 const r=assistantResult||defaultResult;
 return `<section class="card coach-assistant">
   <div class="intelligence-head"><div><p class="eyebrow">COACH ASSISTANT</p><h3>Evidence → explanation → proposal</h3></div><span class="attention-pill priority-${q?.priority||'steady'}">${esc(priorityLabel(q?.priority||'steady'))}</span></div>
   <div class="assistant-quick">
     <button type="button" data-coach-question="Why does this Mover need attention?">Why attention?</button>
     <button type="button" data-coach-question="What changed?">What changed?</button>
     <button type="button" data-coach-question="What could I assign?">What could I assign?</button>
     <button type="button" data-coach-question="Show Passport progress.">Passport</button>
   </div>
   <form id="coach-assistant-form" class="assistant-inline"><input id="coach-assistant-question" maxlength="220" placeholder="Ask about this Mover’s evidence"><button type="submit">Ask →</button></form>
   <article class="assistant-output">
     <span>ASSISTANT RESPONSE</span><h3>${esc(r.title)}</h3><p>${esc(r.answer)}</p>
     ${r.evidence?.length?`<ul>${r.evidence.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
     <div class="assistant-decision"><b>COACH DECISION</b><p>${esc(r.action||'Use your judgement before acting.')}</p>${r.proposal?.mode==='proposal'?'<button type="button" class="btn aqua" id="load-proposal">Load proposal into assignment form</button>':''}</div>
   </article>
 </section>`;
}
function renderDetail(){
 if(!detail)return '<div class="empty"><div><h2>No Mover selected</h2><p>Invite a Mover to begin a coaching relationship.</p></div></div>';
 const s=detail.state||{},tp=s.trainingProfile||{},ready=s.readiness,logs=(s.logs||[]).map(localLog),week=I.weekly(logs),pass=PP.summary(s.passportState||PP.blank());
 return `<div class="grid">
  ${assistantHtml()}
  <section class="card"><div class="top" style="margin:0"><div><p class="eyebrow">MOVER EVIDENCE</p><h2 style="font-size:2rem;margin-bottom:5px">${esc(detail.profile?.display_name||'Mover')}</h2><p style="color:var(--muted)">${esc(detail.profile?.email||'')}</p></div><span class="status ${esc(detail.profile?.account_status||'active')}">${esc(detail.profile?.account_status||'active')}</span></div>
   <div class="metrics"><div class="metric"><span>7-DAY SESSIONS</span><strong>${week.sessions}</strong></div><div class="metric"><span>MINUTES</span><strong>${week.minutes}</strong></div><div class="metric"><span>PASSPORT MASTERED</span><strong>${pass.mastered}</strong></div><div class="metric"><span>PRACTISING</span><strong>${pass.practising}</strong></div></div>
   <div class="mini-grid"><div class="mini"><span>GOALS</span><b>${esc((tp.goal_paths||[]).map(prettyGoal).join(' · ')||'Not synced')}</b></div><div class="mini"><span>LATEST READINESS</span><b>${ready?('Energy '+ready.energy+' · Soreness '+ready.soreness+' · Focus '+ready.focus):'No check-in'}</b></div><div class="mini"><span>WEEKLY QUALITY</span><b>${week.control?('Control '+week.control+' · Confidence '+week.confidence):'No history'}</b></div></div>
   ${ready?.review?'<p class="notice warn" style="margin-top:10px"><b>Mover marked something for review.</b> '+esc(ready.note||'No note supplied.')+'</p>':''}
  </section>
  <div class="grid two">
   <section class="card"><p class="eyebrow">ASSIGN SESSION</p><h3>Coach-directed session</h3><div class="formgrid"><label class="field wide">Title<input id="assign-title" value="Coach session"></label><label class="field">Primary<select id="assign-primary"><option value="control">Control</option><option value="strength">Strength</option><option value="compression">Compression</option><option value="locomotion">Move</option><option value="acrobatics">Acrobatics</option><option value="mobility">Range</option></select></label><label class="field">Blend<select id="assign-blend"><option value="none">No blend</option><option value="locomotion">Ground movement</option><option value="acrobatics">Soft acrobatics</option><option value="mobility">Mobility</option><option value="strength">Strength support</option></select></label><label class="field">Duration<select id="assign-duration"><option value="25">25 min</option><option value="40" selected>40 min</option><option value="55">55 min</option></select></label><label class="field">Energy<select id="assign-energy"><option value="gentle">Gentle</option><option value="steady" selected>Steady</option><option value="charged">Charged</option></select></label><label class="field wide">Due date (optional)<input id="assign-due" type="date"></label></div><button class="btn aqua" id="assign-save" style="margin-top:12px">Assign session</button><div class="activity" style="margin-top:12px">${assignmentRows(detail.assignments)}</div></section>
   <section class="card"><p class="eyebrow">PRIVATE COACH NOTES</p><h3>Human judgement layer</h3><label class="field"><textarea id="coach-note" maxlength="4000" placeholder="What matters for your next coaching decision?"></textarea></label><button class="btn" id="note-save" style="margin-top:12px">Save private note</button><div class="activity" style="margin-top:12px">${noteRows(detail.notes)}</div></section>
  </div>
  <section class="card"><p class="eyebrow">RECENT TRAINING</p><h3>Synced movement evidence</h3><div class="activity">${logs.slice(0,10).map(x=>`<article><b>${esc(x.title)} · ${x.durationMinutes} min</b><small>${new Date(x.completedAt).toLocaleString('en-AU')} · effort ${x.effort} · control ${x.control} · confidence ${x.confidence}</small></article>`).join('')||'<p class="notice">No synced training logs yet.</p>'}</div></section>
 </div>`;
}
function askCoach(question){
 if(!detail)return;
 assistantResult=A.coachAnswer(question,detail);
 render();
}
function loadProposal(){
 const p=assistantResult?.proposal;if(!p||p.mode!=='proposal')return;
 $('#assign-title').value=p.title||'Coach proposal';
 $('#assign-primary').value=p.primary;
 $('#assign-blend').value=p.blend;
 $('#assign-duration').value=String(p.duration);
 $('#assign-energy').value=p.energy;
 $('#assign-title').scrollIntoView({behavior:'smooth',block:'center'});
}
function bind(){
 document.querySelectorAll('[data-mover]').forEach(b=>b.onclick=async()=>{selected=b.dataset.mover;detail=await B.coachMoverData(selected);assistantResult=null;render()});
 document.querySelectorAll('[data-attention-mover]').forEach(b=>b.onclick=async()=>{selected=b.dataset.attentionMover;detail=await B.coachMoverData(selected);assistantResult=null;render()});
 document.querySelectorAll('[data-coach-question]').forEach(b=>b.onclick=()=>askCoach(b.dataset.coachQuestion));
 const form=$('#coach-assistant-form');if(form)form.onsubmit=e=>{e.preventDefault();askCoach($('#coach-assistant-question').value)};
 const load=$('#load-proposal');if(load)load.onclick=loadProposal;
 const assign=$('#assign-save');if(assign)assign.onclick=async()=>{
   assign.disabled=true;
   try{
     await B.createAssignment({relationshipId:detail.relationship.id,moverId:selected,title:$('#assign-title').value,kind:'session',payload:{primary:$('#assign-primary').value,blend:$('#assign-blend').value,duration:Number($('#assign-duration').value),energy:$('#assign-energy').value},dueAt:$('#assign-due').value?new Date($('#assign-due').value+'T12:00:00').toISOString():null});
     detail=await B.coachMoverData(selected);rosterEvidence=await B.coachRosterEvidence();queue=A.coachQueue(rosterEvidence);assistantResult=null;render();
   }catch(e){alert(e.message);assign.disabled=false}
 };
 const note=$('#note-save');if(note)note.onclick=async()=>{note.disabled=true;try{await B.saveCoachNote(detail.relationship.id,$('#coach-note').value);detail=await B.coachMoverData(selected);render()}catch(e){alert(e.message);note.disabled=false}};
}
function render(){
 root.innerHTML=attentionQueue()+`<div class="split" style="margin-top:12px"><aside class="card"><p class="eyebrow">ASSIGNED MOVERS</p><div class="list">${moverList()}</div></aside><section>${renderDetail()}</section></div>`;
 bind();
}
$('#invite-toggle').onclick=()=>{$('#invite-card').hidden=false};
$('#invite-close').onclick=()=>{$('#invite-card').hidden=true};
$('#create-invite').onclick=async()=>{
 const b=$('#create-invite');b.disabled=true;
 try{
   const token=await B.createCoachInvite($('#invite-email').value,$('#invite-name').value);
   const url=new URL('invite.html',location.href);url.searchParams.set('token',token);
   $('#invite-result').innerHTML='<p class="notice">Secure invite created. It expires in 7 days.</p><div class="tokenbox">'+esc(url.href)+'</div><div class="auth-actions"><button class="btn" id="copy-invite">Copy invite link</button></div>';
   $('#copy-invite').onclick=async()=>{try{await navigator.clipboard.writeText(url.href);$('#copy-invite').textContent='Copied'}catch{prompt('Copy this invite link',url.href)}};
 }catch(e){$('#invite-result').innerHTML='<p class="notice bad">'+esc(e.message)+'</p>'}
 finally{b.disabled=false}
};
await refresh(true);
})().catch(e=>{document.querySelector('#coach-root').innerHTML='<section class="card"><p class="notice bad">'+String(e.message||e)+'</p></section>'});