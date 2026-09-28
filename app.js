(()=>{'use strict';
const E=window.DeMovementEngine;
const L=window.DeMovementLibrary;
if(!E||!L)throw new Error('De-Movement modules failed to load.');

const state={primary:'control',blend:'none',duration:40,energy:'steady',view:'choose',domain:'all'};
const $=s=>document.querySelector(s);
const colors={lime:'#b8ff56',coral:'#ff7a66',violet:'#b39cff',aqua:'#70e6d2',gold:'#ffd26f',blue:'#77aefc'};
const domainColours={calisthenics:'#b8ff56',locomotion:'#70e6d2',acrobatics:'#ffd26f',mobility:'#77aefc'};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

const poses={
 pike:{h:[64,18],s:[[64,27,54,48],[54,48,33,72],[54,48,82,70],[48,43,28,62],[60,42,84,60]]},
 wallInvert:{h:[61,73],s:[[61,65,61,43],[61,43,61,19],[61,43,44,57],[61,43,79,57],[61,19,47,8],[61,19,75,8]],wall:92},
 wallInvertTall:{h:[60,75],s:[[60,67,60,41],[60,41,60,16],[60,41,42,54],[60,41,78,54],[60,16,53,5],[60,16,67,5]],wall:91},
 hang:{h:[60,34],s:[[60,42,60,63],[60,45,42,18],[60,45,78,18],[60,63,48,82],[60,63,72,82]],bar:17},
 halfPull:{h:[60,31],s:[[60,39,60,59],[60,42,45,25],[60,42,75,25],[60,59,49,81],[60,59,71,81]],bar:17},
 pullTop:{h:[60,23],s:[[60,31,60,54],[60,34,47,18],[60,34,73,18],[60,54,48,80],[60,54,72,80]],bar:17},
 tuckLever:{h:[29,36],s:[[36,40,57,46],[57,46,78,44],[58,46,72,62],[72,62,85,57],[36,40,22,18],[36,40,43,18]],bar:16},
 tuckLeverLong:{h:[27,34],s:[[35,39,59,43],[59,43,84,43],[58,43,73,57],[73,57,91,54],[35,39,23,17],[35,39,44,17]],bar:16},
 plank:{h:[86,38],s:[[79,43,59,49],[59,49,34,55],[76,45,74,75],[64,48,62,76],[34,55,18,67],[34,55,24,73]],ground:78},
 lean:{h:[82,34],s:[[75,39,55,48],[55,48,31,55],[69,44,77,75],[58,47,65,76],[31,55,18,68],[31,55,23,73]],ground:78},
 leanLong:{h:[78,31],s:[[71,37,50,47],[50,47,27,54],[64,42,78,74],[54,46,68,75],[27,54,13,65],[27,54,17,72]],ground:78},
 support:{h:[51,25],s:[[51,33,51,55],[51,39,34,58],[51,39,68,58],[51,55,46,76],[51,55,57,76]],ground:78},
 tuckSit:{h:[48,24],s:[[48,32,48,52],[48,38,31,67],[48,38,66,67],[48,52,64,58],[64,58,72,49]],ground:70},
 lSit:{h:[44,22],s:[[44,30,44,51],[44,37,28,68],[44,37,62,68],[44,51,68,51],[68,51,91,51]],ground:70},
 quadruped:{h:[82,42],s:[[75,45,56,49],[56,49,37,54],[69,47,74,73],[58,49,55,75],[37,54,26,75],[37,54,43,75]],ground:78},
 bearHigh:{h:[86,47],s:[[78,49,59,46],[59,46,39,39],[72,49,76,74],[62,47,58,74],[39,39,25,70],[39,39,48,70]],ground:77},
 bearTravel:{h:[86,46],s:[[78,48,58,45],[58,45,38,40],[70,48,83,71],[61,46,52,74],[38,40,17,69],[38,40,48,72]],ground:76},
 squat:{h:[61,28],s:[[61,36,61,53],[61,41,45,49],[61,41,77,49],[61,53,46,68],[46,68,32,72],[61,53,76,68],[76,68,91,72]],ground:74},
 monkeyShift:{h:[52,32],s:[[52,40,55,55],[55,47,32,66],[55,47,75,64],[55,55,38,69],[55,55,79,70]],ground:73},
 monkeyTravel:{h:[43,30],s:[[43,38,49,52],[49,44,27,64],[49,44,68,62],[49,52,32,68],[49,52,78,69]],ground:72},
 frogHands:{h:[56,29],s:[[56,37,58,51],[58,43,37,68],[58,43,76,68],[58,51,43,61],[43,61,33,69],[58,51,72,61],[72,61,84,69]],ground:71},
 frogLift:{h:[56,37],s:[[56,45,60,55],[60,49,38,71],[60,49,78,71],[60,55,45,54],[45,54,34,46],[60,55,75,53],[75,53,87,45]],ground:73},
 crabSit:{h:[50,35],s:[[50,43,55,57],[55,50,34,68],[55,50,73,68],[55,57,40,72],[55,57,78,72]],ground:75},
 crabLift:{h:[46,28],s:[[46,36,56,48],[56,48,70,58],[52,42,31,70],[60,51,81,71],[70,58,45,70]],ground:74},
 crabTravel:{h:[41,29],s:[[41,37,54,47],[54,47,71,55],[50,42,24,70],[60,50,86,69],[71,55,45,72]],ground:74},
 rock:{h:[55,44],s:[[55,51,49,61],[49,61,39,67],[49,61,61,68],[50,55,36,48],[50,55,64,48]],arc:true},
 tuckRoll:{h:[63,52],s:[[58,54,47,61],[47,61,40,54],[47,61,55,70],[55,70,67,65]],arc:true},
 stand:{h:[60,19],s:[[60,27,60,51],[60,35,43,46],[60,35,78,46],[60,51,48,77],[60,51,73,77]],ground:79},
 lunge:{h:[48,20],s:[[48,28,51,51],[51,36,32,47],[51,36,70,52],[51,51,34,69],[34,69,18,73],[51,51,75,67],[75,67,91,70]],ground:75},
 sideHands:{h:[55,31],s:[[55,39,54,51],[54,43,34,69],[54,43,75,68],[54,51,39,60],[54,51,76,58]],ground:72},
 splitInvert:{h:[60,66],s:[[60,58,60,40],[60,47,40,69],[60,47,80,69],[60,40,40,20],[60,40,82,18]],ground:71},
 wideStand:{h:[60,18],s:[[60,26,60,49],[60,35,43,43],[60,35,77,43],[60,49,31,73],[60,49,91,73]],ground:75},
 cossackMid:{h:[55,24],s:[[55,32,56,50],[56,38,38,49],[56,38,73,48],[56,50,39,67],[39,67,27,72],[56,50,80,61],[80,61,94,62]],ground:74},
 cossackDeep:{h:[49,31],s:[[49,39,52,54],[52,44,35,56],[52,44,71,54],[52,54,35,66],[35,66,24,72],[52,54,82,61],[82,61,98,61]],ground:73}
};

function poseSvg(key,label=''){
 const p=poses[key]||poses.stand;
 const lines=(p.s||[]).map(x=>`<line x1="${x[0]}" y1="${x[1]}" x2="${x[2]}" y2="${x[3]}"/>`).join('');
 const ground=p.ground?`<line class="ground" x1="10" y1="${p.ground}" x2="108" y2="${p.ground}"/>`:'';
 const bar=p.bar?`<line class="bar" x1="20" y1="${p.bar}" x2="100" y2="${p.bar}"/>`:'';
 const wall=p.wall?`<line class="ground" x1="${p.wall}" y1="6" x2="${p.wall}" y2="82"/>`:'';
 const arc=p.arc?'<path d="M30 56 C42 26 78 27 88 56" class="guide"/>':'';
 return `<figure class="pose"><svg viewBox="0 0 120 88" role="img" aria-label="${esc(label||key)}"><circle cx="${p.h[0]}" cy="${p.h[1]}" r="6"/>${lines}${ground}${bar}${wall}${arc}</svg>${label?`<figcaption>${esc(label)}</figcaption>`:''}</figure>`;
}

function visualStrip(m){
 const labels=['SET','LOAD','OWN'];
 return `<div class="visual-strip">${m.visual.map((p,i)=>poseSvg(p,labels[i])).join('')}</div>`;
}

function setView(view){
 state.view=view==='library'?'library':'choose';
 $('#choose-view').hidden=state.view!=='choose';
 $('#library-view').hidden=state.view!=='library';
 document.querySelectorAll('[data-view-target]').forEach(b=>b.classList.toggle('active',b.dataset.viewTarget===state.view));
 if(state.view==='library')renderLibrary();
 window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}

function renderPrimary(){
 $('#primary-grid').innerHTML=Object.entries(E.PRIMARY).map(([key,x])=>`
 <button type="button" class="choice-card ${state.primary===key?'selected':''}" data-primary="${key}" style="--choice:${colors[x.accent]}">
  <span class="glyph">${esc(x.icon)}</span><b>${esc(x.label)}</b><small>${esc(x.short)}</small>
 </button>`).join('');
}
function renderBlend(){
 $('#blend-grid').innerHTML=Object.entries(E.BLENDS).map(([key,x])=>{
  const disabled=key===state.primary;
  return `<button type="button" class="blend ${state.blend===key?'selected':''}" data-blend="${key}" ${disabled?'disabled':''}><b>${esc(x.label)}</b><small>${esc(disabled?'Already primary':x.short)}</small></button>`;
 }).join('');
}
function renderSession(){
 const s=E.compose(state),accent=colors[s.accent]||colors.lime;
 document.documentElement.style.setProperty('--session-accent',accent);
 $('#session-icon').textContent=s.icon;$('#session-kicker').textContent=E.PRIMARY[s.primary].label.toUpperCase();
 $('#session-title').textContent=s.title;$('#session-promise').textContent=s.promise;$('#session-objective').textContent=s.objective;
 $('#session-goals').innerHTML=s.goals.map(g=>`<li>${esc(g)}</li>`).join('');
 return s;
}
function renderChooser(){
 renderPrimary();renderBlend();renderSession();
 document.querySelectorAll('[data-duration]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.duration)===state.duration));
 document.querySelectorAll('[data-energy]').forEach(b=>b.classList.toggle('selected',b.dataset.energy===state.energy));
 document.querySelectorAll('[data-primary]').forEach(b=>b.onclick=()=>{state.primary=b.dataset.primary;if(state.blend===state.primary)state.blend='none';renderChooser()});
 document.querySelectorAll('[data-blend]').forEach(b=>b.onclick=()=>{if(!b.disabled){state.blend=b.dataset.blend;renderChooser()}});
}

function renderLibrary(){
 $('#domain-filters').innerHTML=Object.entries(L.DOMAINS).map(([key,d])=>`<button type="button" data-domain="${key}" class="${state.domain===key?'selected':''}">${esc(d.label)}</button>`).join('');
 const list=L.filter(state.domain);
 $('#movement-grid').innerHTML=list.map(m=>`<button type="button" class="movement-card" data-movement="${m.id}" style="--domain:${domainColours[m.domain]||'#b8ff56'}">
   <div class="movement-meta"><span>${esc(L.DOMAINS[m.domain].label)}</span><em>${esc(m.level)}</em></div>
   ${visualStrip(m)}
   <h2>${esc(m.name)}</h2>
   <p>${esc(m.objective)}</p>
   <div class="mini-path"><span>${esc(m.regression)}</span><b>→</b><strong>${esc(m.name)}</strong><b>→</b><span>${esc(m.next)}</span></div>
   <div class="card-foot"><span>${esc(m.dose)}</span><span>Open movement →</span></div>
 </button>`).join('');
 document.querySelectorAll('[data-domain]').forEach(b=>b.onclick=()=>{state.domain=b.dataset.domain;renderLibrary()});
 document.querySelectorAll('[data-movement]').forEach(b=>b.onclick=()=>openMovement(b.dataset.movement));
}

function openMovement(id){
 const m=L.get(id);if(!m)return;
 const dlg=$('#movement-dialog'),root=$('#movement-dialog-content');
 root.innerHTML=`<div class="movement-detail" style="--domain:${domainColours[m.domain]||'#b8ff56'}">
   <div class="dialog-top"><div><p class="eyebrow">${esc(L.DOMAINS[m.domain].label)} · ${esc(m.level)}</p><h2>${esc(m.name)}</h2></div><button type="button" class="dialog-close" aria-label="Close movement">×</button></div>
   ${visualStrip(m)}
   <div class="detail-grid">
    <section><span class="detail-label">OBJECTIVE</span><p>${esc(m.objective)}</p></section>
    <section><span class="detail-label">DOSE</span><p><b>${esc(m.dose)}</b></p></section>
   </div>
   <div class="progression-line"><article><small>REGRESSION</small><b>${esc(m.regression)}</b></article><i>→</i><article class="current"><small>CURRENT</small><b>${esc(m.name)}</b></article><i>→</i><article><small>NEXT</small><b>${esc(m.next)}</b></article></div>
   <div class="detail-grid">
    <section><span class="detail-label">TECHNIQUE CUES</span><ul>${m.cues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
    <section><span class="detail-label">WATCH FOR</span><ul>${m.mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
   </div>
   <div class="dialog-actions">
     ${m.reference?`<a href="${esc(m.reference.url)}" target="_blank" rel="noopener noreferrer">Open reference ↗</a><small>${esc(m.reference.label)}</small>`:'<span class="reference-missing">Internal tutorial planned</span>'}
   </div>
 </div>`;
 root.querySelector('.dialog-close').onclick=()=>dlg.close();
 if(!dlg.open)dlg.showModal();
}

$('#duration-control').onclick=e=>{const b=e.target.closest('[data-duration]');if(!b)return;state.duration=Number(b.dataset.duration);renderChooser()};
$('#energy-control').onclick=e=>{const b=e.target.closest('[data-energy]');if(!b)return;state.energy=b.dataset.energy;renderChooser()};
$('#build-session').onclick=()=>{const s=renderSession();$('#plan-title').textContent=s.title;$('#plan-objective').textContent=s.objective;$('#block-list').innerHTML=s.blocks.map((b,i)=>`<article class="block"><span class="block-num">0${i+1}</span><h3>${esc(b.label)}</h3><p>${esc(b.purpose)}</p><span class="minutes">${b.minutes} MIN</span></article>`).join('');$('#session-plan').hidden=false;$('#session-plan').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})};
$('#edit-choices').onclick=()=>document.querySelector('.builder').scrollIntoView({behavior:'smooth'});
document.querySelectorAll('[data-view-target]').forEach(b=>b.onclick=e=>{e.preventDefault();setView(b.dataset.viewTarget)});
$('#movement-dialog').addEventListener('click',e=>{if(e.target===$('#movement-dialog'))$('#movement-dialog').close()});
renderChooser();renderLibrary();
})();