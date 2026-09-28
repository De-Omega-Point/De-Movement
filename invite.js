(async()=>{'use strict';
const B=window.DeMovementBackend,$=s=>document.querySelector(s),root=$('#invite-root'),token=new URLSearchParams(location.search).get('token');
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const msg=(t,k='')=>'<p class="notice '+k+'">'+esc(t)+'</p>';
if(!token){root.innerHTML=msg('This invitation link is incomplete. Ask your Coach for a new invite.','bad');return}
if(B.mode!=='supabase'){root.innerHTML=msg('Coach invitations require the Phase 7 cloud backend to be configured.','warn');return}
const sess=await B.session();
if(!sess){
 root.innerHTML='<label class="field">Invited email<input id="email" type="email" autocomplete="email"></label><div class="auth-actions"><button class="btn primary" id="send">Send secure sign-in link</button></div><p id="msg" class="notice" hidden></p>';
 $('#send').onclick=async()=>{try{await B.signIn($('#email').value.trim(),location.href);$('#msg').hidden=false;$('#msg').textContent='Check your email, then return through the secure link.'}catch(e){$('#msg').hidden=false;$('#msg').textContent=e.message}};
 return;
}
const me=await B.me();
if(me?.role!=='mover'){root.innerHTML=msg('This invitation is for a Mover account. Your current role is '+(me?.role||'unknown')+'.','bad')+'<div class="auth-actions"><a class="btn" href="account.html">Account</a></div>';return}
root.innerHTML='<p class="notice">Signed in as <b>'+esc(sess.user.email)+'</b>.</p><div class="auth-actions"><button class="btn primary" id="claim">Connect my Coach</button><a class="btn" href="account.html">Account</a></div><p id="msg" class="notice" hidden></p>';
$('#claim').onclick=async()=>{const b=$('#claim');b.disabled=true;try{await B.claimCoachInvite(token);$('#msg').hidden=false;$('#msg').textContent='Connected. Opening De-Movement…';setTimeout(()=>location.href='index.html',450)}catch(e){$('#msg').hidden=false;$('#msg').textContent=e.message;b.disabled=false}};
})().catch(e=>{document.querySelector('#invite-root').innerHTML='<p class="notice bad">'+String(e.message||e)+'</p>'});