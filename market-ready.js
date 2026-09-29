(()=>{'use strict';
const BUILD='0.9.0';
const ONBOARD_KEY='demovement.onboarding.v1';
let installPrompt=null;

function addStatus(){
  const top=document.querySelector('.topbar');if(!top)return;
  let status=document.querySelector('#connectivity-status');
  if(!status){
    status=document.createElement('span');
    status.id='connectivity-status';
    status.className='connectivity-chip';
    const account=document.querySelector('#cloud-account-link');
    account?.insertAdjacentElement('beforebegin',status);
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
  const status=document.querySelector('#connectivity-status');
  status?.insertAdjacentElement('beforebegin',b);
  b.onclick=async()=>{
    if(!installPrompt)return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt=null;b.remove();
  };
});

function onboarding(){
  if(localStorage.getItem(ONBOARD_KEY)==='done')return;
  const dlg=document.createElement('dialog');
  dlg.className='launch-dialog';
  dlg.innerHTML=`<div class="launch-shell">
    <p class="eyebrow">WELCOME TO DE-MOVEMENT</p>
    <h2>Choose how you move.</h2>
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
  dlg.querySelector('[data-start]').onclick=()=>{localStorage.setItem(ONBOARD_KEY,'done');dlg.close();dlg.remove()};
  dlg.addEventListener('cancel',e=>{e.preventDefault();localStorage.setItem(ONBOARD_KEY,'done');dlg.close();dlg.remove()});
  dlg.showModal();
}
window.addEventListener('load',onboarding);

const footer=document.querySelector('footer');
if(footer&&!document.querySelector('.market-links')){
  const links=document.createElement('span');links.className='market-links';
  links.innerHTML='<a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><button type="button" id="pilot-feedback">Pilot feedback</button>';
  footer.appendChild(links);
}
})();