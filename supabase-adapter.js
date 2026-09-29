(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DeMovementBackend=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';

const cfg=root?.DEMOVEMENT_CONFIG||{};
const hasConfig=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&root?.supabase?.createClient);
const client=hasConfig?root.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const mode=client?'supabase':'local';

function fail(error){if(error)throw new Error(error.message||String(error))}
async function user(){
 if(!client)return null;
 const {data,error}=await client.auth.getUser();fail(error);return data.user||null;
}
async function session(){
 if(!client)return null;
 const {data,error}=await client.auth.getSession();fail(error);return data.session||null;
}
async function signIn(email,redirectTo){
 if(!client)throw new Error('Cloud accounts are not configured yet.');
 const {data,error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});fail(error);return data;
}
async function signOut(){if(!client)return;const {error}=await client.auth.signOut();fail(error)}
async function me(){
 const u=await user();if(!u)return null;
 const {data,error}=await client.from('profiles').select('id,email,display_name,role,account_status,created_at').eq('id',u.id).maybeSingle();fail(error);
 return data||null;
}
function routeForRole(role){return role==='administrator'?'administrator.html':role==='coach'?'coach.html':'index.html'}
async function updateDisplayName(display_name){
 const u=await user();if(!u)throw new Error('Sign in first.');
 const name=String(display_name||'').trim().slice(0,100);if(!name)throw new Error('Enter a display name.');
 const {data,error}=await client.from('profiles').update({display_name:name}).eq('id',u.id).select('id,display_name').single();fail(error);return data;
}

async function loadMoverState(targetId){
 const u=await user();if(!u)return null;
 const moverId=targetId||u.id;
 const [profileRes,passportRes,readinessRes,logsRes,flowsRes,assignmentsRes]=await Promise.all([
  client.from('training_profiles').select('*').eq('mover_id',moverId).maybeSingle(),
  client.from('passport_states').select('state,updated_at').eq('mover_id',moverId).maybeSingle(),
  client.from('readiness_checkins').select('*').eq('mover_id',moverId).order('checked_at',{ascending:false}).limit(1).maybeSingle(),
  client.from('training_logs').select('*').eq('mover_id',moverId).order('completed_at',{ascending:false}).limit(120),
  client.from('saved_flows').select('*').eq('mover_id',moverId).order('updated_at',{ascending:false}),
  client.from('coach_assignments').select('*').eq('mover_id',moverId).in('status',['assigned','started']).order('created_at',{ascending:false})
 ]);
 for(const r of [profileRes,passportRes,readinessRes,logsRes,flowsRes,assignmentsRes])fail(r.error);
 return {
  trainingProfile:profileRes.data||null,
  passportState:passportRes.data?.state||null,
  readiness:readinessRes.data||null,
  logs:logsRes.data||[],
  flows:flowsRes.data||[],
  assignments:assignmentsRes.data||[]
 };
}
async function saveTrainingProfile(p){
 const u=await user();if(!u)return null;
 const row={mover_id:u.id,goal_paths:p.goalPaths||[],days_per_week:p.daysPerWeek,session_minutes:p.sessionMinutes,preferred_styles:p.preferredStyles||[]};
 const {data,error}=await client.from('training_profiles').upsert(row,{onConflict:'mover_id'}).select().single();fail(error);return data;
}
async function savePassport(state){
 const u=await user();if(!u)return null;
 const {data,error}=await client.from('passport_states').upsert({mover_id:u.id,state},{onConflict:'mover_id'}).select().single();fail(error);return data;
}
async function saveReadiness(r){
 const u=await user();if(!u)return null;
 const row={mover_id:u.id,energy:r.energy,soreness:r.soreness,focus:r.focus,review:!!r.review,note:r.note||null,checked_at:r.checkedAt||new Date().toISOString()};
 const {data,error}=await client.from('readiness_checkins').insert(row).select().single();fail(error);return data;
}
async function saveTrainingLog(x){
 const u=await user();if(!u)return null;
 const row={mover_id:u.id,kind:x.kind,title:x.title,primary_intent:x.primary||null,blend:x.blend||null,energy:x.energy||null,duration_minutes:x.durationMinutes||0,effort:x.effort,control:x.control,confidence:x.confidence,movements:x.movements||[],domains:x.domains||[],notes:x.notes||null,completed_at:x.completedAt||new Date().toISOString()};
 const {data,error}=await client.from('training_logs').insert(row).select().single();fail(error);return data;
}
async function saveFlow(name,builder){
 const u=await user();if(!u)return null;
 const row={mover_id:u.id,name:String(name||'Current Flow').slice(0,100),builder};
 const {data,error}=await client.from('saved_flows').upsert(row,{onConflict:'mover_id,name'}).select().single();fail(error);return data;
}
async function myAssignments(){
 const u=await user();if(!u)return [];
 const {data,error}=await client.from('coach_assignments').select('*').eq('mover_id',u.id).in('status',['assigned','started']).order('created_at',{ascending:false});fail(error);return data||[];
}
async function updateAssignment(id,status){
 if(!['started','completed','cancelled'].includes(status))throw new Error('Invalid assignment status.');
 const patch={status};if(status==='completed')patch.completed_at=new Date().toISOString();
 const {data,error}=await client.from('coach_assignments').update(patch).eq('id',id).select().single();fail(error);return data;
}

async function coachRelationships(){
 const u=await user();if(!u)return [];
 const {data,error}=await client.from('coach_movers').select('*').eq('coach_id',u.id).neq('status','archived').order('created_at',{ascending:false});fail(error);
 const rels=data||[];
 return Promise.all(rels.map(async rel=>({...rel,mover:await profileById(rel.mover_id)})));
}
async function coachRosterEvidence(){
 const rels=await coachRelationships();
 const active=rels.filter(x=>x.status==='active'&&x.mover?.account_status==='active');
 return Promise.all(active.map(async rel=>{
  const detail=await coachMoverData(rel.mover_id);
  return {moverId:rel.mover_id,name:rel.mover?.display_name||'Mover',profile:detail.profile,state:detail.state,relationship:rel};
 }));
}

async function profileById(id){
 const {data,error}=await client.from('profiles').select('id,email,display_name,role,account_status').eq('id',id).maybeSingle();fail(error);return data||null;
}
async function coachMoverData(moverId){
 const u=await user();if(!u)throw new Error('Sign in first.');
 const {data:rel,error:relErr}=await client.from('coach_movers').select('*').eq('coach_id',u.id).eq('mover_id',moverId).neq('status','archived').maybeSingle();fail(relErr);
 if(!rel)throw new Error('Mover is not assigned to this Coach.');
 const [state,notesRes,assignRes,profile]=await Promise.all([
  loadMoverState(moverId),
  client.from('coach_notes').select('*').eq('relationship_id',rel.id).order('created_at',{ascending:false}).limit(30),
  client.from('coach_assignments').select('*').eq('relationship_id',rel.id).order('created_at',{ascending:false}).limit(30),
  profileById(moverId)
 ]);
 fail(notesRes.error);fail(assignRes.error);
 return {relationship:rel,profile,state,notes:notesRes.data||[],assignments:assignRes.data||[]};
}
async function createCoachInvite(email,displayName){
 const {data,error}=await client.rpc('dm_create_coach_invite',{invite_email:String(email||'').trim().toLowerCase(),invite_name:String(displayName||'').trim()||null});fail(error);return data;
}
async function claimCoachInvite(token){
 const {data,error}=await client.rpc('dm_claim_coach_invite',{raw_token:String(token||'')});fail(error);return data;
}
async function saveCoachNote(relationshipId,note){
 const u=await user();if(!u)throw new Error('Sign in first.');
 const text=String(note||'').trim();if(!text)throw new Error('Add a note first.');
 const {data,error}=await client.from('coach_notes').insert({relationship_id:relationshipId,coach_id:u.id,note:text}).select().single();fail(error);return data;
}
async function createAssignment(input){
 const u=await user();if(!u)throw new Error('Sign in first.');
 const row={relationship_id:input.relationshipId,coach_id:u.id,mover_id:input.moverId,title:String(input.title||'Coach session').slice(0,120),kind:input.kind==='flow'?'flow':'session',payload:input.payload||{},status:'assigned',due_at:input.dueAt||null};
 const {data,error}=await client.from('coach_assignments').insert(row).select().single();fail(error);return data;
}

async function submitPilotFeedback(input={}){
 const u=await user();if(!u)throw new Error('Sign in to send pilot feedback.');
 const areas=['onboarding','session','passport','flow','assistant','coaching','account','other'];
 const area=areas.includes(input.area)?input.area:'other';
 const rating=Math.max(1,Math.min(5,Math.round(Number(input.rating)||0)));
 const comment=String(input.comment||'').trim().slice(0,2000);
 if(!comment)throw new Error('Add a short comment first.');
 const {data,error}=await client.from('pilot_feedback').insert({author_id:u.id,area,rating,comment,build:String(input.build||'0.9.0').slice(0,30)}).select().single();
 fail(error);return data;
}
async function exportMyCloudData(){
 const profile=await me();if(!profile)throw new Error('Sign in first.');
 const out={exportedAt:new Date().toISOString(),profile};
 if(profile.role==='mover'){
   out.mover=await loadMoverState(profile.id);
 }else if(profile.role==='coach'){
   const [relationships,notes,assignments,invites]=await Promise.all([
     coachRelationships(),
     client.from('coach_notes').select('*').eq('coach_id',profile.id).order('created_at',{ascending:false}),
     client.from('coach_assignments').select('*').eq('coach_id',profile.id).order('created_at',{ascending:false}),
     client.from('coach_invites').select('id,email,display_name,expires_at,claimed_at,created_at').eq('coach_id',profile.id).order('created_at',{ascending:false})
   ]);
   for(const r of [notes,assignments,invites])fail(r.error);
   out.coach={relationships,notes:notes.data||[],assignments:assignments.data||[],invites:invites.data||[]};
 }else if(profile.role==='administrator'){
   const {data,error}=await client.from('admin_audit_log').select('*').eq('actor_id',profile.id).order('created_at',{ascending:false});fail(error);
   out.administrator={auditActions:data||[]};
 }
 const {data:feedback,error:feedbackError}=await client.from('pilot_feedback').select('*').eq('author_id',profile.id).order('created_at',{ascending:false});fail(feedbackError);
 out.pilotFeedback=feedback||[];
 return out;
}
async function deleteAccount(){
 if(!client)throw new Error('Cloud account is not connected.');
 const {data,error}=await client.functions.invoke('delete-account',{body:{confirm:'DELETE'}});
 fail(error);
 if(data?.error){
   if(data.error==='last_administrator')throw new Error('Create another active Administrator before deleting the last Administrator account.');
   throw new Error(data.error);
 }
 return data;
}
async function administratorPilotMetrics(){
 const now=Date.now(),d7=new Date(now-7*86400000).toISOString(),d30=new Date(now-30*86400000).toISOString();
 const [movers,coaches,logs30,readiness30,passports,flows,feedback]=await Promise.all([
  client.from('profiles').select('id',{count:'exact',head:true}).eq('role','mover').eq('account_status','active'),
  client.from('profiles').select('id',{count:'exact',head:true}).eq('role','coach').eq('account_status','active'),
  client.from('training_logs').select('mover_id,kind,completed_at,effort,control,confidence').gte('completed_at',d30),
  client.from('readiness_checkins').select('mover_id,checked_at').gte('checked_at',d30),
  client.from('passport_states').select('mover_id',{count:'exact'}),
  client.from('saved_flows').select('mover_id',{count:'exact'}),
  client.from('pilot_feedback').select('id,author_id,area,rating,comment,build,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(50)
 ]);
 for(const r of [movers,coaches,logs30,readiness30,passports,flows,feedback])fail(r.error);
 const logs=logs30.data||[],rds=readiness30.data||[],fb=feedback.data||[];
 const last7=logs.filter(x=>x.completed_at>=d7);
 const unique=a=>new Set(a).size;
 const avg=(arr,key)=>arr.length?Math.round(arr.reduce((n,x)=>n+(Number(x[key])||0),0)/arr.length*10)/10:0;
 return {
  activeMovers:movers.count||0,
  activeCoaches:coaches.count||0,
  sessions7:last7.length,
  activeMovers7:unique(last7.map(x=>x.mover_id)),
  sessions30:logs.length,
  flowLogs30:logs.filter(x=>x.kind==='flow').length,
  readiness30:rds.length,
  passportUsers:passports.count||0,
  savedFlows:flows.count||0,
  averageEffort30:avg(logs,'effort'),
  averageControl30:avg(logs,'control'),
  averageConfidence30:avg(logs,'confidence'),
  feedbackCount:feedback.count||fb.length,
  feedbackAverage:avg(fb,'rating'),
  feedback:fb
 };
}

async function administratorProfiles(){
 const {data,error}=await client.from('profiles').select('id,email,display_name,role,account_status,created_at').order('created_at',{ascending:false});fail(error);return data||[];
}
async function administratorRelationships(){
 const {data,error}=await client.from('coach_movers').select('*').order('created_at',{ascending:false});fail(error);
 const rels=data||[],ids=[...new Set(rels.flatMap(x=>[x.coach_id,x.mover_id]))];
 const pairs=await Promise.all(ids.map(async id=>[id,await profileById(id)]));const map=Object.fromEntries(pairs);
 return rels.map(x=>({...x,coach:map[x.coach_id]||null,mover:map[x.mover_id]||null}));
}
async function administratorSetRole(id,role){
 const {data,error}=await client.rpc('dm_admin_set_role',{target:id,new_role:role});fail(error);return data;
}
async function administratorSetAccountStatus(id,status){
 const {data,error}=await client.rpc('dm_admin_set_account_status',{target:id,new_status:status});fail(error);return data;
}
async function administratorTransferMover(relationshipId,coachId){
 const {data,error}=await client.rpc('dm_admin_transfer_mover',{relationship:relationshipId,new_coach:coachId});fail(error);return data;
}

return {mode,client,session,user,me,signIn,signOut,routeForRole,updateDisplayName,loadMoverState,saveTrainingProfile,savePassport,saveReadiness,saveTrainingLog,saveFlow,myAssignments,updateAssignment,profileById,coachRelationships,coachMoverData,coachRosterEvidence,createCoachInvite,claimCoachInvite,saveCoachNote,createAssignment,submitPilotFeedback,exportMyCloudData,deleteAccount,administratorPilotMetrics,administratorProfiles,administratorRelationships,administratorSetRole,administratorSetAccountStatus,administratorTransferMover};
});