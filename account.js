(async()=>{'use strict';
const B=window.DeMovementBackend,$=s=>document.querySelector(s),root=$('#account-root');
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function message(text,kind=''){return '<p class="notice '+kind+'">'+esc(text)+'</p>'}
if(B.mode!=='supabase'){
 root.innerHTML=message('Cloud accounts are not configured yet. De-Movement continues to work locally on this device. Add the public Supabase project URL and anon/publishable key to config.js when the backend is ready.')+'<div class="auth-actions"><a class="btn primary" href="index.html">Continue locally</a></div>';
 return;
}
const next=new URLSearchParams(location.search).get('next');
const sess=await B.session();
if(!sess){
 root.innerHTML='<div class="grid"><label class="field">Email<input id="email" type="email" autocomplete="email" placeholder="you@example.com"></label><button class="btn primary" id="send">Send secure sign-in link</button><p class="notice" id="msg" hidden></p></div>';
 $('#send').onclick=async()=>{const email=$('#email').value.trim();if(!email)return;const b=$('#send');b.disabled=true;try{await B.signIn(email,new URL(next||'account.html',location.href).href);$('#msg').hidden=false;$('#msg').textContent='Check your email for the secure sign-in link.'}catch(e){$('#msg').hidden=false;$('#msg').textContent=e.message;b.disabled=false}};
 return;
}
const me=await B.me();
if(!me){root.innerHTML=message('Your authenticated account exists, but the De-Movement profile has not been created yet. Apply the Phase 7 Supabase schema and try again.','warn');return}
const route=B.routeForRole(me.role);
const suspended=me.account_status==='suspended';
root.innerHTML=`
 <div class="mini-grid"><div class="mini"><span>ROLE</span><b>${esc(me.role)}</b></div><div class="mini"><span>STATUS</span><b>${esc(me.account_status)}</b></div><div class="mini"><span>EMAIL</span><b>${esc(me.email||sess.user.email)}</b></div></div>
 ${suspended?message('This connected account is suspended. Cloud training data and role tools are unavailable until an Administrator reactivates it.','bad'):''}
 <div style="margin-top:18px" class="grid"><label class="field">Display name<input id="display-name" maxlength="100" value="${esc(me.display_name)}" ${suspended?'disabled':''}></label><div class="actions"><button class="btn" id="save-name" ${suspended?'disabled':''}>Save name</button>${!suspended?'<a class="btn primary" href="'+route+'">Open '+(me.role==='mover'?'De-Movement':me.role==='coach'?'Coach Portal':'Administrator Console')+'</a>':''}<button class="btn" id="signout">Sign out</button></div><p class="notice" id="msg" hidden></p></div>`;
 $('#save-name').onclick=async()=>{try{const x=await B.updateDisplayName($('#display-name').value);$('#msg').hidden=false;$('#msg').textContent='Saved as '+x.display_name}catch(e){$('#msg').hidden=false;$('#msg').textContent=e.message}};
 $('#signout').onclick=async()=>{await B.signOut();location.reload()};
})().catch(e=>{document.querySelector('#account-root').innerHTML='<p class="notice bad">'+String(e.message||e)+'</p>'});