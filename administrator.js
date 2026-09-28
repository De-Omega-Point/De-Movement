(async()=>{'use strict';
const B=window.DeMovementBackend,$=s=>document.querySelector(s),root=$('#admin-root');
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let profiles=[],rels=[],view='people';
if(B.mode!=='supabase'){root.innerHTML='<section class="card"><p class="notice">Administrator tools require the Phase 7 cloud backend.</p></section>';return}
const sess=await B.session();if(!sess){location.replace('account.html?next=administrator.html');return}
const me=await B.me();if(me?.role!=='administrator'||me.account_status!=='active'){location.replace('account.html');return}
async function refresh(){[profiles,rels]=await Promise.all([B.administratorProfiles(),B.administratorRelationships()]);render()}
function metrics(){return `<div class="metrics"><div class="metric"><span>MOVERS</span><strong>${profiles.filter(x=>x.role==='mover').length}</strong></div><div class="metric"><span>COACHES</span><strong>${profiles.filter(x=>x.role==='coach').length}</strong></div><div class="metric"><span>ADMINISTRATORS</span><strong>${profiles.filter(x=>x.role==='administrator').length}</strong></div><div class="metric"><span>ACTIVE RELATIONSHIPS</span><strong>${rels.filter(x=>x.status==='active').length}</strong></div></div>`}
function people(){
 return `<section class="card"><div class="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Controls</th></tr></thead><tbody>${profiles.map(p=>`<tr><td><b>${esc(p.display_name)}</b></td><td>${esc(p.email||'')}</td><td><span class="status">${esc(p.role)}</span></td><td><span class="status ${esc(p.account_status)}">${esc(p.account_status)}</span></td><td><div class="actions">${p.id===me.id?'<span class="status">Current Admin</span>':`<select class="field role-change" data-id="${p.id}"><option value="mover" ${p.role==='mover'?'selected':''}>Mover</option><option value="coach" ${p.role==='coach'?'selected':''}>Coach</option><option value="administrator" ${p.role==='administrator'?'selected':''}>Administrator</option></select><button class="btn status-toggle" data-id="${p.id}" data-next="${p.account_status==='suspended'?'active':'suspended'}">${p.account_status==='suspended'?'Reactivate':'Suspend'}</button>`}</div></td></tr>`).join('')}</tbody></table></div></section>`;
}
function relationships(){
 const coaches=profiles.filter(x=>x.role==='coach'&&x.account_status==='active');
 return `<section class="card"><div class="tablewrap"><table><thead><tr><th>Mover</th><th>Coach</th><th>Status</th><th>Created</th><th>Transfer</th></tr></thead><tbody>${rels.map(r=>`<tr><td><b>${esc(r.mover?.display_name||r.mover_id)}</b></td><td>${esc(r.coach?.display_name||r.coach_id)}</td><td><span class="status ${esc(r.status)}">${esc(r.status)}</span></td><td>${new Date(r.created_at).toLocaleDateString('en-AU')}</td><td><select class="field transfer" data-id="${r.id}"><option value="">Choose Coach…</option>${coaches.map(c=>`<option value="${c.id}">${esc(c.display_name)}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="5">No relationships yet.</td></tr>'}</tbody></table></div></section>`;
}
function bind(){
 document.querySelectorAll('.role-change').forEach(s=>s.onchange=async()=>{if(!confirm('Change this account role to '+s.value+'?'))return refresh();try{await B.administratorSetRole(s.dataset.id,s.value);await refresh()}catch(e){alert(e.message);await refresh()}});
 document.querySelectorAll('.status-toggle').forEach(b=>b.onclick=async()=>{if(!confirm((b.dataset.next==='suspended'?'Suspend':'Reactivate')+' this account?'))return;try{await B.administratorSetAccountStatus(b.dataset.id,b.dataset.next);await refresh()}catch(e){alert(e.message)}});
 document.querySelectorAll('.transfer').forEach(s=>s.onchange=async()=>{if(!s.value)return;if(!confirm('Transfer this Mover to the selected Coach?'))return render();try{await B.administratorTransferMover(s.dataset.id,s.value);await refresh()}catch(e){alert(e.message)}});
}
function render(){root.innerHTML=metrics()+`<div class="tabs"><button class="${view==='people'?'active':''}" data-tab="people">People</button><button class="${view==='relationships'?'active':''}" data-tab="relationships">Coach ↔ Mover</button></div>`+(view==='people'?people():relationships());document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{view=b.dataset.tab;render()});bind()}
await refresh();
})().catch(e=>{document.querySelector('#admin-root').innerHTML='<section class="card"><p class="notice bad">'+String(e.message||e)+'</p></section>'});