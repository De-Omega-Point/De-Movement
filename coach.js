(async()=>{'use strict';
const B=window.DeMovementBackend,PP=window.DeMovementPassport,I=window.DeMovementIntelligence,$=s=>document.querySelector(s),root=$('#coach-root');
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let relationships=[],selected=null,detail=null;
function localLog(x){return {kind:x.kind,completedAt:x.completed_at,title:x.title,primary:x.primary_intent||'',blend:x.blend||'none',energy:x.energy||'steady',durationMinutes:x.duration_minutes||0,effort:x.effort,control:x.control,confidence:x.confidence,movements:x.movements||[],domains:x.domains||[]}}
function prettyGoal(x){return String(x||'').replaceAll('-',' ').replace(/w/g,m=>m.toUpperCase())}
if(B.mode!=='supabase'){root.innerHTML='<section class="card"><h2>Cloud backend not connected</h2><p class="notice">The Coach Portal becomes live after the Supabase schema is applied and config.js contains the public project URL and anon/publishable key.</p></section>';return}
const sess=await B.session();if(!sess){location.replace('account.html?next=coach.html');return}
const me=await B.me();if(me?.account_status==='suspended'){location.replace('account.html');return}
if(me?.role==='administrator'){location.replace('administrator.html');return}
if(me?.role!=='coach'){location.replace('account.html');return}

async function refresh(){
 relationships=await B.coachRelationships();
 if(selected&&!relationships.some(x=>x.mover_id===selected))selected=null;
 if(!selected&&relationships.length)selected=relationships[0].mover_id;
 detail=selected?await B.coachMoverData(selected):null;
 render();
}
function moverList(){
 return relationships.map(r=>`<button class="list-item ${r.mover_id===selected?'active':''}" data-mover="${r.mover_id}"><div><b>${esc(r.mover?.display_name||'Mover')}</b><small>${esc(r.mover?.email||'')} · ${esc(r.status)}</small></div><span>→</span></button>`).join('')||'<div class="empty">No assigned Movers yet.</div>';
}
function assignmentRows(items){
 return (items||[]).slice(0,8).map(a=>`<article><b>${esc(a.title)} · ${esc(a.status)}</b><small>${esc(a.kind)}${a.due_at?' · due '+new Date(a.due_at).toLocaleDateString('en-AU'):''}</small></article>`).join('')||'<p class="notice">No assignments yet.</p>';
}
function noteRows(items){return (items||[]).slice(0,8).map(n=>`<article><b>Private Coach note</b><small>${new Date(n.created_at).toLocaleString('en-AU')}</small><p style="margin:6px 0 0">${esc(n.note)}</p></article>`).join('')||'<p class="notice">No private notes yet.</p>'}
function renderDetail(){
 if(!detail)return '<div class="empty"><div><h2>No Mover selected</h2><p>Invite a Mover to begin a coaching relationship.</p></div></div>';
 const s=detail.state||{},tp=s.trainingProfile||{},ready=s.readiness,logs=(s.logs||[]).map(localLog),week=I.weekly(logs),pass=PP.summary(s.passportState||PP.blank());
 return `<div class="grid">
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
function bind(){
 document.querySelectorAll('[data-mover]').forEach(b=>b.onclick=async()=>{selected=b.dataset.mover;detail=await B.coachMoverData(selected);render()});
 const assign=$('#assign-save');if(assign)assign.onclick=async()=>{assign.disabled=true;try{await B.createAssignment({relationshipId:detail.relationship.id,moverId:selected,title:$('#assign-title').value,kind:'session',payload:{primary:$('#assign-primary').value,blend:$('#assign-blend').value,duration:Number($('#assign-duration').value),energy:$('#assign-energy').value},dueAt:$('#assign-due').value?new Date($('#assign-due').value+'T12:00:00').toISOString():null});detail=await B.coachMoverData(selected);render()}catch(e){alert(e.message);assign.disabled=false}};
 const note=$('#note-save');if(note)note.onclick=async()=>{note.disabled=true;try{await B.saveCoachNote(detail.relationship.id,$('#coach-note').value);detail=await B.coachMoverData(selected);render()}catch(e){alert(e.message);note.disabled=false}};
}
function render(){root.innerHTML=`<div class="split"><aside class="card"><p class="eyebrow">ASSIGNED MOVERS</p><div class="list">${moverList()}</div></aside><section>${renderDetail()}</section></div>`;bind()}
$('#invite-toggle').onclick=()=>{$('#invite-card').hidden=false};
$('#invite-close').onclick=()=>{$('#invite-card').hidden=true};
$('#create-invite').onclick=async()=>{const b=$('#create-invite');b.disabled=true;try{const token=await B.createCoachInvite($('#invite-email').value,$('#invite-name').value);const url=new URL('invite.html',location.href);url.searchParams.set('token',token);$('#invite-result').innerHTML='<p class="notice">Secure invite created. It expires in 7 days.</p><div class="tokenbox">'+esc(url.href)+'</div><div class="auth-actions"><button class="btn" id="copy-invite">Copy invite link</button></div>';$('#copy-invite').onclick=async()=>{try{await navigator.clipboard.writeText(url.href);$('#copy-invite').textContent='Copied'}catch{prompt('Copy this invite link',url.href)}}}catch(e){$('#invite-result').innerHTML='<p class="notice bad">'+esc(e.message)+'</p>'}finally{b.disabled=false}};
await refresh();
})().catch(e=>{document.querySelector('#coach-root').innerHTML='<section class="card"><p class="notice bad">'+String(e.message||e)+'</p></section>'});