(async()=>{'use strict';
const B=window.DeMovementBackend,$=s=>document.querySelector(s),root=$('#account-root');
const LOCAL_KEYS=['demovement.passport.v1','demovement.flow.v1','demovement.profile.v1','demovement.readiness.v1','demovement.history.v1','demovement.onboarding.v1','demovement.feedback.v1'];

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function message(text,kind=''){return '<p class="notice '+kind+'">'+esc(text)+'</p>'}
function download(name,data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function localSnapshot(){
 const data={};
 for(const k of LOCAL_KEYS){
   const raw=localStorage.getItem(k);if(raw===null)continue;
   try{data[k]=JSON.parse(raw)}catch{data[k]=raw}
 }
 return {product:'De-Movement',build:'0.9.0',exportedAt:new Date().toISOString(),scope:'local-device',data};
}
function localControls(){
 return `<section class="account-controls"><div><p class="eyebrow">LOCAL-FIRST DATA</p><h2>This device</h2><p>Your local movement data is separate from your cloud account.</p></div><div class="actions"><button class="btn" id="export-local">Export local data</button><button class="btn danger" id="clear-local">Clear this device</button></div></section>`;
}
function bindLocal(){
 const exp=$('#export-local');if(exp)exp.onclick=()=>download('de-movement-local-'+new Date().toISOString().slice(0,10)+'.json',localSnapshot());
 const clear=$('#clear-local');if(clear)clear.onclick=()=>{
   if(!confirm('Clear De-Movement local data from this browser? This does not delete a connected cloud account.'))return;
   for(const k of LOCAL_KEYS)localStorage.removeItem(k);
   alert('Local De-Movement data was cleared from this browser. Your cloud account, if any, was not deleted.');
 };
}

if(B.mode!=='supabase'){
 root.innerHTML=message('Cloud accounts are not configured. De-Movement continues to work locally on this device.')+'<div class="auth-actions"><a class="btn primary" href="index.html">Continue locally</a></div>'+localControls();
 bindLocal();return;
}
const next=new URLSearchParams(location.search).get('next');
const sess=await B.session();
if(!sess){
 root.innerHTML='<div class="grid"><label class="field">Email<input id="email" type="email" autocomplete="email" placeholder="you@example.com"></label><button class="btn primary" id="send">Send secure sign-in link</button><p class="notice" id="msg" hidden></p></div>'+localControls();
 bindLocal();
 $('#send').onclick=async()=>{const email=$('#email').value.trim();if(!email)return;const b=$('#send');b.disabled=true;try{await B.signIn(email,new URL(next||'account.html',location.href).href);$('#msg').hidden=false;$('#msg').textContent='Check your email for the secure sign-in link.'}catch(e){$('#msg').hidden=false;$('#msg').textContent=e.message;b.disabled=false}};
 return;
}
const me=await B.me();
if(!me){root.innerHTML=message('Your authenticated account exists, but the De-Movement profile is unavailable.','warn')+localControls();bindLocal();return}
const route=B.routeForRole(me.role),suspended=me.account_status==='suspended';
root.innerHTML=`
 <div class="mini-grid"><div class="mini"><span>ROLE</span><b>${esc(me.role)}</b></div><div class="mini"><span>STATUS</span><b>${esc(me.account_status)}</b></div><div class="mini"><span>EMAIL</span><b>${esc(me.email||sess.user.email)}</b></div></div>
 ${suspended?message('This connected account is suspended. Cloud training data and role tools are unavailable until an Administrator reactivates it.','bad'):''}
 <div style="margin-top:18px" class="grid"><label class="field">Display name<input id="display-name" maxlength="100" value="${esc(me.display_name)}" ${suspended?'disabled':''}></label><div class="actions"><button class="btn" id="save-name" ${suspended?'disabled':''}>Save name</button>${!suspended?'<a class="btn primary" href="'+route+'">Open '+(me.role==='mover'?'De-Movement':me.role==='coach'?'Coach Portal':'Administrator Console')+'</a>':''}<button class="btn" id="signout">Sign out</button></div><p class="notice" id="msg" hidden></p></div>
 ${localControls()}
 <section class="account-controls cloud-controls"><div><p class="eyebrow">CONNECTED DATA</p><h2>Cloud account</h2><p>Export your account data or delete the connected account. Cloud deletion does not silently erase this browser's local copy.</p></div><div class="actions"><button class="btn" id="export-cloud">Export cloud data</button><button class="btn danger" id="delete-cloud">Delete cloud account</button></div></section>
 <div class="notice"><a href="privacy.html">Privacy notice</a> · <a href="terms.html">Pilot terms</a></div>`;
 bindLocal();
 $('#save-name').onclick=async()=>{try{const x=await B.updateDisplayName($('#display-name').value);$('#msg').hidden=false;$('#msg').textContent='Saved as '+x.display_name}catch(e){$('#msg').hidden=false;$('#msg').textContent=e.message}};
 $('#signout').onclick=async()=>{await B.signOut();location.reload()};
 $('#export-cloud').onclick=async()=>{const b=$('#export-cloud');b.disabled=true;try{const data=await B.exportMyCloudData();download('de-movement-cloud-'+new Date().toISOString().slice(0,10)+'.json',data)}catch(e){alert(e.message)}finally{b.disabled=false}};
 $('#delete-cloud').onclick=async()=>{
   const typed=prompt('Type DELETE to permanently delete your connected De-Movement account. Local browser data will remain until you clear it separately.');
   if(typed!=='DELETE')return;
   const b=$('#delete-cloud');b.disabled=true;
   try{
     await B.deleteAccount();
     try{await B.signOut()}catch{}
     alert('Cloud account deleted. Local data on this browser remains available until you choose Clear this device.');
     location.replace('index.html');
   }catch(e){alert(e.message);b.disabled=false}
 };
})().catch(e=>{document.querySelector('#account-root').innerHTML='<p class="notice bad">'+String(e.message||e)+'</p>'});