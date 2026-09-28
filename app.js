(()=>{'use strict';
const E=window.DeMovementEngine;
const L=window.DeMovementLibrary;
const C=window.DeMovementComposer;
const R=window.DeMovementRunner;
const P=window.DeMovementPaths;
const PP=window.DeMovementPassport;
const F=window.DeMovementFlow;
if(!E||!L||!C||!R||!P||!PP||!F)throw new Error('De-Movement modules failed to load.');

const initialPassport=PP.load();
const state={primary:'control',blend:'none',duration:40,energy:'steady',view:'choose',domain:'all',plan:null,runner:null,tick:null,passport:initialPassport,flow:F.load(initialPassport),flowFamily:'all',flowPlan:null,flowRunner:null,flowTick:null};
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
 rockBack:{h:[68,53],s:[[62,55,50,60],[50,60,39,55],[50,60,58,70],[50,56,37,47],[50,56,64,48]],arc:true},
 tuckRoll:{h:[63,52],s:[[58,54,47,61],[47,61,40,54],[47,61,55,70],[55,70,67,65]],arc:true},
 stand:{h:[60,19],s:[[60,27,60,51],[60,35,43,46],[60,35,78,46],[60,51,48,77],[60,51,73,77]],ground:79},
 lunge:{h:[48,20],s:[[48,28,51,51],[51,36,32,47],[51,36,70,52],[51,51,34,69],[34,69,18,73],[51,51,75,67],[75,67,91,70]],ground:75},
 sideHands:{h:[55,31],s:[[55,39,54,51],[54,43,34,69],[54,43,75,68],[54,51,39,60],[54,51,76,58]],ground:72},
 splitInvert:{h:[60,66],s:[[60,58,60,40],[60,47,40,69],[60,47,80,69],[60,40,40,20],[60,40,82,18]],ground:71},
 wideStand:{h:[60,18],s:[[60,26,60,49],[60,35,43,43],[60,35,77,43],[60,49,31,73],[60,49,91,73]],ground:75},
 cossackMid:{h:[55,24],s:[[55,32,56,50],[56,38,38,49],[56,38,73,48],[56,50,39,67],[39,67,27,72],[56,50,80,61],[80,61,94,62]],ground:74},
 cossackDeep:{h:[49,31],s:[[49,39,52,54],[52,44,35,56],[52,44,71,54],[52,54,35,66],[35,66,24,72],[52,54,82,61],[82,61,98,61]],ground:73},
 wristRock:{h:[78,40],s:[[71,44,55,50],[55,50,38,56],[68,46,73,73],[58,49,55,74],[38,56,29,74],[38,56,48,74]],ground:77},
 wristRockDeep:{h:[74,42],s:[[67,46,51,52],[51,52,34,58],[63,48,70,74],[55,51,53,75],[34,58,24,75],[34,58,44,75]],ground:77},
 scapSoft:{h:[85,39],s:[[78,44,58,50],[58,50,35,56],[73,46,74,74],[62,49,61,75],[35,56,20,68],[35,56,25,73]],ground:78},
 scapPush:{h:[82,35],s:[[75,40,55,47],[55,47,32,54],[69,43,75,74],[59,46,64,75],[32,54,17,67],[32,54,22,73]],ground:78},
 activeHang:{h:[60,33],s:[[60,41,60,62],[60,44,43,18],[60,44,77,18],[60,62,49,81],[60,62,71,81]],bar:17},
 activeHangTall:{h:[60,31],s:[[60,39,60,60],[60,42,44,18],[60,42,76,18],[60,60,49,80],[60,60,71,80]],bar:17},
 hollowPrep:{h:[43,56],s:[[49,57,61,57],[49,57,39,66],[61,57,74,65],[49,57,37,45],[61,57,75,45]],ground:72},
 hollow:{h:[34,58],s:[[41,58,58,56],[41,58,24,50],[58,56,78,50],[41,58,25,68],[58,56,78,66]],ground:72},
 hollowLong:{h:[29,60],s:[[36,59,57,55],[36,59,14,48],[57,55,88,47],[36,59,13,69],[57,55,91,68]],ground:72},
 pikeSit:{h:[42,25],s:[[42,33,45,54],[45,54,28,68],[45,54,71,63],[71,63,93,63],[45,54,65,63]],ground:70},
 pikeLift:{h:[42,24],s:[[42,32,45,53],[45,53,29,68],[45,53,70,57],[70,57,91,55],[45,53,65,58]],ground:70},
 pikeLiftHigh:{h:[42,23],s:[[42,31,45,52],[45,52,29,68],[45,52,67,49],[67,49,89,46],[45,52,62,52]],ground:70},
 ninetySit:{h:[55,22],s:[[55,30,55,49],[55,37,40,46],[55,37,71,46],[55,49,39,63],[39,63,25,63],[55,49,68,61],[68,61,79,73]],ground:74},
 ninetySwitch:{h:[56,24],s:[[56,32,56,50],[56,39,41,47],[56,39,72,47],[56,50,42,66],[42,66,29,72],[56,50,73,63],[73,63,88,66]],ground:74},
 ninetyOpen:{h:[58,23],s:[[58,31,58,49],[58,38,43,47],[58,38,74,46],[58,49,43,61],[43,61,31,70],[58,49,77,60],[77,60,92,69]],ground:74},
 splitMid:{h:[50,22],s:[[50,30,52,50],[52,37,35,46],[52,37,70,47],[52,50,36,65],[36,65,21,72],[52,50,75,64],[75,64,91,70]],ground:74},
 splitDeep:{h:[50,29],s:[[50,37,52,54],[52,44,34,49],[52,44,70,50],[52,54,34,68],[34,68,20,72],[52,54,78,65],[78,65,95,70]],ground:74},
 squatReach:{h:[55,25],s:[[55,33,57,53],[57,40,35,31],[57,40,78,32],[57,53,39,68],[39,68,26,72],[57,53,76,68],[76,68,91,72]],ground:74}
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
 const next=['library','passport','flow'].includes(view)?view:'choose';
 if(state.view==='flow'&&next!=='flow'&&state.flowRunner){state.flowRunner.pause();stopFlowTicker()}
 state.view=next;
 $('#choose-view').hidden=state.view!=='choose';
 $('#library-view').hidden=state.view!=='library';
 $('#passport-view').hidden=state.view!=='passport';
 $('#flow-view').hidden=state.view!=='flow';
 document.querySelectorAll('[data-view-target]').forEach(b=>b.classList.toggle('active',b.dataset.viewTarget===state.view));
 if(state.view==='library')renderLibrary();
 if(state.view==='passport')renderPassport();
 if(state.view==='flow')renderFlow();
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


const statusLabels={available:'Available',practising:'Practising',ready:'Ready',mastered:'Mastered',locked:'Locked'};
function passportAccent(path){return P.ACCENTS[path.accent]||'#b8ff56'}
function passportStatus(pathId,nodeId){return PP.effectiveStatus(state.passport,pathId,nodeId)}
function passportIcon(status){return {available:'○',practising:'◐',ready:'◇',mastered:'✓',locked:'·'}[status]||'·'}

function renderPassport(){
  const sum=PP.summary(state.passport);
  $('#passport-summary').innerHTML=`
    <article><span>MASTERED</span><strong>${sum.mastered}</strong><small>owned capabilities</small></article>
    <article><span>PRACTISING</span><strong>${sum.practising}</strong><small>active skills</small></article>
    <article><span>READY</span><strong>${sum.ready}</strong><small>awaiting human decision</small></article>
    <article><span>AVAILABLE</span><strong>${sum.available}</strong><small>open next steps</small></article>`;
  $('#passport-paths').innerHTML=P.PATHS.map(path=>{
    const prog=PP.progress(state.passport,path.id),focus=PP.nextFocus(state.passport,path.id);
    return `<article class="passport-path" style="--path:${passportAccent(path)}">
      <header><div><span class="path-icon">${esc(path.icon)}</span><p class="eyebrow">${esc(path.category)}</p><h2>${esc(path.name)}</h2></div><div class="path-progress"><b>${prog.mastered}/${prog.total}</b><small>mastered</small></div></header>
      <p>${esc(path.promise)}</p>
      <div class="path-bar"><span style="width:${prog.percent}%"></span></div>
      <div class="path-nodes">${path.nodes.map((node,i)=>{
        const s=passportStatus(path.id,node.id);
        return `<button type="button" class="path-node status-${s}" data-path="${path.id}" data-node="${node.id}" aria-label="${esc(node.name)}: ${statusLabels[s]}">
          <span class="node-index">${String(i+1).padStart(2,'0')}</span>
          <span class="node-mark">${passportIcon(s)}</span>
          <b>${esc(node.name)}</b>
          <small>${statusLabels[s]}</small>
        </button>`;
      }).join('')}</div>
      <footer><span>Next focus</span><b>${esc(focus?.name||'Path complete')}</b></footer>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-path][data-node]').forEach(b=>b.onclick=()=>openPassportNode(b.dataset.path,b.dataset.node));
}

function openPassportNode(pathId,nodeId){
  const path=P.get(pathId),node=P.node(pathId,nodeId);if(!path||!node)return;
  const dlg=$('#passport-dialog'),root=$('#passport-dialog-content');
  const status=passportStatus(pathId,nodeId),checked=state.passport.criteria?.[pathId]?.[nodeId]||[];
  const all=PP.criteriaMet(state.passport,pathId,nodeId);
  const linked=node.movementId?L.get(node.movementId):null;
  const actions=[];
  if(status==='available')actions.push('<button type="button" class="passport-primary" data-passport-action="practising">Start practising</button>');
  if(status==='practising')actions.push(`<button type="button" class="passport-primary" data-passport-action="ready" ${all?'':'disabled'}>${all?'Mark ready':'Complete checklist first'}</button>`);
  if(status==='ready')actions.push('<button type="button" class="passport-primary" data-passport-action="mastered">Mark mastered</button>');
  if(status==='mastered')actions.push('<button type="button" class="passport-secondary" data-passport-action="practising">Reassess this skill</button>');
  root.innerHTML=`<div class="passport-detail" style="--path:${passportAccent(path)}">
    <div class="dialog-top"><div><p class="eyebrow">${esc(path.name)} · ${esc(node.level)}</p><h2>${esc(node.name)}</h2></div><button type="button" class="dialog-close" aria-label="Close Passport node">×</button></div>
    <div class="passport-status-line"><span class="status-${status}">${passportIcon(status)} ${statusLabels[status]}</span><small>Progress changes only when you choose an action.</small></div>
    ${linked?visualStrip(linked):'<div class="path-placeholder"><span>'+esc(path.icon)+'</span><b>Path movement</b><small>Dedicated visual will be added as the library expands.</small></div>'}
    <section class="passport-criteria">
      <span class="detail-label">READINESS CHECKLIST</span>
      <p>Use these as coaching gates. Tick only what you can demonstrate consistently today.</p>
      <div>${node.criteria.map((item,i)=>`<label><input type="checkbox" data-passport-criterion="${i}" ${checked.includes(i)?'checked':''} ${status==='locked'?'disabled':''}><span>${esc(item)}</span></label>`).join('')}</div>
    </section>
    <div class="passport-actions">
      ${actions.join('')}
      ${linked?'<button type="button" class="passport-secondary" data-linked-movement="'+esc(linked.id)+'">Open movement details</button>':''}
      ${status!=='locked'?'<button type="button" class="passport-text" data-passport-reset>Reset this node</button>':''}
    </div>
    ${status==='locked'?'<p class="passport-gate">Master the previous node before starting this progression.</p>':''}
  </div>`;
  root.querySelector('.dialog-close').onclick=()=>dlg.close();
  root.querySelectorAll('[data-passport-criterion]').forEach(cb=>cb.onchange=()=>{
    state.passport=PP.save(PP.setCriterion(state.passport,pathId,nodeId,Number(cb.dataset.passportCriterion),cb.checked));
    openPassportNode(pathId,nodeId);renderPassport();
  });
  root.querySelectorAll('[data-passport-action]').forEach(b=>b.onclick=()=>{
    if(b.disabled)return;
    if(status==='mastered'&&b.dataset.passportAction==='practising'&&!confirm('Reassessing this skill will lock later nodes in this path. Continue?'))return;
    try{
      state.passport=PP.save(PP.setStatus(state.passport,pathId,nodeId,b.dataset.passportAction));
      openPassportNode(pathId,nodeId);renderPassport();
    }catch(e){alert(e.message)}
  });
  const reset=root.querySelector('[data-passport-reset]');
  if(reset)reset.onclick=()=>{
    if(!confirm('Reset this node? Later nodes in this path will also be locked.'))return;
    try{state.passport=PP.save(PP.setStatus(state.passport,pathId,nodeId,'locked'));openPassportNode(pathId,nodeId);renderPassport()}catch(e){alert(e.message)}
  };
  const linkedBtn=root.querySelector('[data-linked-movement]');
  if(linkedBtn)linkedBtn.onclick=()=>{dlg.close();openMovement(linkedBtn.dataset.linkedMovement)};
  if(!dlg.open)dlg.showModal();
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
function planMovementCard(m){
 const colour=domainColours[m.domain]||'#b8ff56';
 return `<button type="button" class="plan-movement" data-movement="${m.id}" style="--domain:${colour}">
   <div class="plan-movement-visual">${poseSvg(m.visual[1],m.variation===m.name?'CURRENT':'EASIER')}</div>
   <div class="plan-movement-copy">
     <span>${esc(m.level)} · ${esc(m.domain)}</span>
     <b>${esc(m.variation)}</b>
     <small>${esc(m.dose)}</small>
     <em>${esc(m.success)}</em>
   </div>
 </button>`;
}
function renderPlan(plan){
 $('#plan-title').textContent=plan.title;
 $('#plan-objective').textContent=plan.objective;
 $('#plan-summary').textContent=`${plan.movementCount} movements · ${plan.totalSets} planned sets · ${plan.duration} minutes · ${E.ENERGY[plan.energy].label.toLowerCase()} energy`;
 $('#block-list').innerHTML=plan.blocks.map((b,i)=>{
   const moves=b.movements.length?b.movements.map(planMovementCard).join(''):`<div class="reflection-card"><b>Reflect</b><span>${plan.reflection.map(esc).join(' · ')}</span></div>`;
   return `<article class="block session-block"><div class="block-heading"><div><span class="block-num">0${i+1}</span><h3>${esc(b.label)}</h3></div><span class="minutes">${b.minutes} MIN</span></div><p>${esc(b.purpose)}</p><div class="block-movements">${moves}</div></article>`;
 }).join('');
 $('#block-list').querySelectorAll('[data-movement]').forEach(b=>b.onclick=()=>openMovement(b.dataset.movement));
}
$('#build-session').onclick=()=>{
 state.plan=C.compose(state);
 renderPlan(state.plan);
 $('#session-plan').hidden=false;
 $('#guided-session').hidden=true;
 $('#session-plan').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
};
function mmss(n){n=Math.max(0,Number(n)||0);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function stopTicker(){if(state.tick){clearInterval(state.tick);state.tick=null}}
function ensureTicker(){
 stopTicker();
 if(!state.runner)return;
 const snap=state.runner.snapshot();
 if(['work','rest'].includes(snap.phase)&&snap.remaining>0){
   state.tick=setInterval(()=>{state.runner.tick();renderRunner()},1000);
 }
}
function renderRunner(){
 const root=$('#runner-card');
 if(!state.runner||!state.plan){root.innerHTML='';return}
 const snap=state.runner.snapshot();
 if(snap.finished){
   stopTicker();
   root.innerHTML=`<div class="runner-finished"><span class="runner-check">✓</span><p class="eyebrow">SESSION COMPLETE</p><h2>${esc(state.plan.title)}</h2><p>You completed ${snap.completedSets} planned sets. Before you leave, note your effort, control and confidence.</p><div class="reflection-row">${state.plan.reflection.map(x=>`<span>${esc(x)}</span>`).join('')}</div><button type="button" class="ghost" id="close-runner">Return to session map</button></div>`;
   $('#close-runner').onclick=()=>{$('#guided-session').hidden=true;$('#session-plan').scrollIntoView({behavior:'smooth'})};
   return;
 }
 const cur=snap.current,m=L.get(cur.id),timed=['hold','time'].includes(cur.protocol.kind);
 const isRest=snap.phase==='rest';
 const working=snap.phase==='work';
 let control='';
 if(isRest){
   control=`<div class="runner-timer rest"><small>REST</small><strong>${mmss(snap.remaining)}</strong></div><button type="button" class="runner-primary" id="skip-rest">Skip rest →</button>`;
 }else if(timed&&working){
   control=`<div class="runner-timer"><small>WORK</small><strong>${mmss(snap.remaining)}</strong></div><button type="button" class="runner-secondary" id="finish-timed">Finish set now</button>`;
 }else if(timed){
   control=`<div class="runner-ready"><small>TIMED SET</small><strong>${cur.protocol.seconds} sec</strong></div><button type="button" class="runner-primary" id="start-timed">Start timed set →</button>`;
 }else{
   control=`<div class="runner-ready"><small>DOSE</small><strong>${esc(cur.dose)}</strong></div><button type="button" class="runner-primary" id="complete-reps">Set complete →</button>`;
 }
 root.innerHTML=`<div class="runner-shell" style="--domain:${domainColours[m.domain]||'#b8ff56'}">
   <div class="runner-top"><span>${esc(cur.blockLabel)}</span><span>Set ${cur.currentSet} / ${cur.totalSets}</span></div>
   <div class="runner-grid">
     <div class="runner-visual">${visualStrip(m)}</div>
     <div class="runner-copy"><p class="eyebrow">${esc(L.DOMAINS[m.domain].label)} · ${esc(m.level)}</p><h2>${esc(cur.variation)}</h2><p>${esc(cur.objective)}</p><div class="runner-cues"><b>Remember</b>${cur.cues.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
   </div>
   <div class="runner-controls">${control}</div>
   <div class="runner-progress"><span style="width:${Math.round((snap.completedSets/Math.max(1,state.plan.totalSets))*100)}%"></span></div>
   <div class="runner-foot"><span>${snap.completedSets} / ${state.plan.totalSets} sets complete</span><button type="button" id="movement-info">Movement details</button></div>
 </div>`;
 const info=$('#movement-info');if(info)info.onclick=()=>openMovement(cur.id);
 const skip=$('#skip-rest');if(skip)skip.onclick=()=>{state.runner.skipRest();renderRunner()};
 const start=$('#start-timed');if(start)start.onclick=()=>{state.runner.start();renderRunner()};
 const done=$('#finish-timed');if(done)done.onclick=()=>{state.runner.completeSet();renderRunner()};
 const reps=$('#complete-reps');if(reps)reps.onclick=()=>{state.runner.completeSet();renderRunner()};
 ensureTicker();
}
$('#start-guided').onclick=()=>{
 if(!state.plan){state.plan=C.compose(state);renderPlan(state.plan)}
 stopTicker();state.runner=new R.Runner(state.plan);
 $('#guided-session').hidden=false;renderRunner();
 $('#guided-session').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
};
$('#edit-choices').onclick=()=>document.querySelector('.builder').scrollIntoView({behavior:'smooth'});
document.querySelectorAll('[data-view-target]').forEach(b=>b.onclick=e=>{e.preventDefault();setView(b.dataset.viewTarget)});
$('#movement-dialog').addEventListener('click',e=>{if(e.target===$('#movement-dialog'))$('#movement-dialog').close()});
$('#passport-dialog').addEventListener('click',e=>{if(e.target===$('#passport-dialog'))$('#passport-dialog').close()});
renderChooser();renderLibrary();renderPassport();
})();