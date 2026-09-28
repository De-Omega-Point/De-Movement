(()=>{'use strict';
const E=window.DeMovementEngine;
if(!E)throw new Error('De-Movement engine failed to load.');

const state={primary:'control',blend:'none',duration:40,energy:'steady'};
const $=s=>document.querySelector(s);
const colors={lime:'#b8ff56',coral:'#ff7a66',violet:'#b39cff',aqua:'#70e6d2',gold:'#ffd26f',blue:'#77aefc'};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function renderPrimary(){
  $('#primary-grid').innerHTML=Object.entries(E.PRIMARY).map(([key,x])=>`
    <button type="button" class="choice-card ${state.primary===key?'selected':''}" data-primary="${key}" style="--choice:${colors[x.accent]}">
      <span class="glyph">${esc(x.icon)}</span>
      <b>${esc(x.label)}</b>
      <small>${esc(x.short)}</small>
    </button>`).join('');
}

function renderBlend(){
  $('#blend-grid').innerHTML=Object.entries(E.BLENDS).map(([key,x])=>{
    const disabled=key===state.primary;
    return `<button type="button" class="blend ${state.blend===key?'selected':''}" data-blend="${key}" ${disabled?'disabled':''}>
      <b>${esc(x.label)}</b><small>${esc(disabled?'Already primary':x.short)}</small>
    </button>`;
  }).join('');
}

function renderSession(){
  const s=E.compose(state);
  const accent=colors[s.accent]||colors.lime;
  document.documentElement.style.setProperty('--session-accent',accent);
  $('#session-icon').textContent=s.icon;
  $('#session-kicker').textContent=E.PRIMARY[s.primary].label.toUpperCase();
  $('#session-title').textContent=s.title;
  $('#session-promise').textContent=s.promise;
  $('#session-objective').textContent=s.objective;
  $('#session-goals').innerHTML=s.goals.map(g=>`<li>${esc(g)}</li>`).join('');
  return s;
}

function render(){
  renderPrimary();renderBlend();renderSession();
  document.querySelectorAll('[data-duration]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.duration)===state.duration));
  document.querySelectorAll('[data-energy]').forEach(b=>b.classList.toggle('selected',b.dataset.energy===state.energy));
  bind();
}

function bind(){
  document.querySelectorAll('[data-primary]').forEach(b=>b.addEventListener('click',()=>{
    state.primary=b.dataset.primary;
    if(state.blend===state.primary)state.blend='none';
    render();
  }));
  document.querySelectorAll('[data-blend]').forEach(b=>b.addEventListener('click',()=>{if(!b.disabled){state.blend=b.dataset.blend;render()}}));
}

$('#duration-control').addEventListener('click',e=>{const b=e.target.closest('[data-duration]');if(!b)return;state.duration=Number(b.dataset.duration);render()});
$('#energy-control').addEventListener('click',e=>{const b=e.target.closest('[data-energy]');if(!b)return;state.energy=b.dataset.energy;render()});

$('#build-session').addEventListener('click',()=>{
  const s=renderSession();
  $('#plan-title').textContent=s.title;
  $('#plan-objective').textContent=s.objective;
  $('#block-list').innerHTML=s.blocks.map((b,i)=>`
    <article class="block">
      <span class="block-num">0${i+1}</span>
      <h3>${esc(b.label)}</h3>
      <p>${esc(b.purpose)}</p>
      <span class="minutes">${b.minutes} MIN</span>
    </article>`).join('');
  $('#session-plan').hidden=false;
  $('#session-plan').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});

$('#edit-choices').addEventListener('click',()=>document.querySelector('.builder').scrollIntoView({behavior:'smooth'}));
render();
})();
