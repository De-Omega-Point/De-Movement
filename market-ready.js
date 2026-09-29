(()=>{'use strict';
const BUILD='0.9.0';
const ONBOARD_KEY='demovement.onboarding.v1';
const FEEDBACK_KEY='demovement.feedback.v1';
const B=window.DeMovementBackend||null;
let installPrompt=null;

function addStatus(){
  const top=document.querySelector('.topbar');if(!top)return;
  let status=document.querySelector('#connectivity-status');
  if(!status){
    status=document.createElement('span');
    status.id='connectivity-status';status.className='connectivity-chip';
    document.querySelector('#cloud-account-link')?.insertAdjacentElement('beforebegin',status);
  }
  const online=navigator.onLine;
  status.textContent=online?'Online · local core active':'Offline · local core active';
  status.classList.toggle('offline',!online);
}
window.addEventListener('online',addStatus);
window.addEventListener('offline',addStatus);
addStatus();

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
      if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
    }catch(e){console.warn('De-Movement offline shell:',e.message||e)}
  });
}

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();installPrompt=e;
  const top=document.querySelector('.topbar');if(!top||document.querySelector('#install-app'))return;
  const b=document.createElement('button');
  b.id='install-app';b.className='install-chip';b.type='button';b.textContent='Install';
  document.querySelector('#connectivity-status')?.insertAdjacentElement('beforebegin',b);
  b.onclick=async()=>{
    if(!installPrompt)return;
    installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;b.remove();
  };
});

function onboarding(){
  if(localStorage.getItem(ONBOARD_KEY)==='done')return;
  const dlg=document.createElement('dialog');dlg.className='launch-dialog';
  dlg.innerHTML=`<div class="launch-shell">
    <p class="eyebrow">WELCOME TO DE-MOVEMENT</p><h2>Choose how you move.</h2>
    <p class="launch-lead">De-Movement is local-first. Your core training tools, Passport, Flow Lab and evidence assistant are designed to work on this device without requiring a cloud account.</p>
    <div class="launch-grid">
      <article><span>01</span><b>Start local</b><p>Choose a movement intention and train immediately.</p></article>
      <article><span>02</span><b>Build capability</b><p>Passport tracks what you choose to Practise, Ready and Master.</p></article>
      <article><span>03</span><b>Connect only when useful</b><p>An account adds sync and coaching. It is not the ignition key.</p></article>
    </div>
    <div class="launch-actions"><button type="button" class="launch-primary" data-start>Start locally</button><a href="account.html">Connect an account</a></div>
    <small>Build ${BUILD} · Human-controlled progression · Not a substitute for medical care.</small>
  </div>`;
  document.body.appendChild(dlg);
  const done=()=>{localStorage.setItem(ONBOARD_KEY,'done');dlg.close();dlg.remove()};
  dlg.querySelector('[data-start]').onclick=done;
  dlg.addEventListener('cancel',e=>{e.preventDefault();done()});
  dlg.showModal();
}

function feedbackList(){
  try{return JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'[]')}catch{return []}
}
function saveFeedback(item){
  const list=[item,...feedbackList()].slice(0,50);
  localStorage.setItem(FEEDBACK_KEY,JSON.stringify(list));return list;
}
function markFeedback(id,patch){
  const list=feedbackList().map(x=>x.id===id?{...x,...patch}:x);
  localStorage.setItem(FEEDBACK_KEY,JSON.stringify(list));
}
async function openFeedback(){
  document.querySelector('#pilot-dialog')?.remove();
  let signed=false;
  try{signed=!!(B&&B.mode==='supabase'&&await B.session())}catch{}
  const dlg=document.createElement('dialog');dlg.id='pilot-dialog';dlg.className='pilot-dialog';
  dlg.innerHTML=`<form method="dialog" class="pilot-shell">
    <div class="dialog-top"><div><p class="eyebrow">PILOT FEEDBACK</p><h2>Tell us what happened.</h2></div><button value="cancel" aria-label="Close">×</button></div>
    <p class="pilot-copy">Feedback is never collected in the background. Save it locally, or ${signed?'send it to the pilot team from your connected account':'connect an account if you want to send it to the pilot team'}.</p>
    <label>Area<select id="pilot-area"><option value="onboarding">Onboarding</option><option value="session">Session</option><option value="passport">Passport</option><option value="flow">Flow Lab</option><option value="assistant">Assistant</option><option value="coaching">Coaching</option><option value="account">Account</option><option value="other">Other</option></select></label>
    <label>Rating<select id="pilot-rating"><option value="5">5 · Excellent</option><option value="4">4 · Good</option><option value="3">3 · Mixed</option><option value="2">2 · Difficult</option><option value="1">1 · Poor</option></select></label>
    <label>What should we know?<textarea id="pilot-comment" maxlength="2000" required placeholder="What worked, what got in the way, or what should change?"></textarea></label>
    <div class="pilot-actions"><button type="button" id="save-feedback-local">Save locally</button>${signed?'<button type="button" id="send-feedback" class="pilot-primary">Send to pilot team</button>':'<a href="account.html">Connect account</a>'}</div>
    <p id="pilot-message" class="pilot-message" aria-live="polite"></p>
    <small>Build ${BUILD} · A local copy is kept on this device when you save or send.</small>
  </form>`;
  document.body.appendChild(dlg);dlg.showModal();

  const item=()=>({id:'pf-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),area:dlg.querySelector('#pilot-area').value,rating:Number(dlg.querySelector('#pilot-rating').value),comment:dlg.querySelector('#pilot-comment').value.trim(),build:BUILD,createdAt:new Date().toISOString(),status:'local'});
  const msg=t=>{dlg.querySelector('#pilot-message').textContent=t};

  dlg.querySelector('#save-feedback-local').onclick=()=>{
    const x=item();if(!x.comment)return msg('Add a short comment first.');
    saveFeedback(x);msg('Saved locally on this device.');
  };
  const send=dlg.querySelector('#send-feedback');
  if(send)send.onclick=async()=>{
    const x=item();if(!x.comment)return msg('Add a short comment first.');
    saveFeedback({...x,status:'pending'});send.disabled=true;
    try{
      if(!navigator.onLine)throw new Error('You are offline. The feedback is saved locally.');
      const cloud=await B.submitPilotFeedback(x);
      markFeedback(x.id,{status:'sent',cloudId:cloud.id,sentAt:new Date().toISOString()});
      msg('Sent to the pilot team. Thank you.');
    }catch(e){markFeedback(x.id,{status:'local'});msg(e.message||'Saved locally; sending failed.')}finally{send.disabled=false}
  };
}

const footer=document.querySelector('footer');
if(footer&&!document.querySelector('.market-links')){
  const links=document.createElement('span');links.className='market-links';
  links.innerHTML='<a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><button type="button" id="pilot-feedback">Pilot feedback</button>';
  footer.appendChild(links);
}
document.querySelector('#pilot-feedback')?.addEventListener('click',openFeedback);
window.addEventListener('load',onboarding);
})();