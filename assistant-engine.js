(function(root,factory){
 const api=factory(
  typeof require==='function'?(()=>{try{return require('./engine.js')}catch{return root.DeMovementEngine}})():root.DeMovementEngine,
  typeof require==='function'?(()=>{try{return require('./movements.js')}catch{return root.DeMovementLibrary}})():root.DeMovementLibrary,
  typeof require==='function'?(()=>{try{return require('./paths.js')}catch{return root.DeMovementPaths}})():root.DeMovementPaths,
  typeof require==='function'?(()=>{try{return require('./passport.js')}catch{return root.DeMovementPassport}})():root.DeMovementPassport,
  typeof require==='function'?(()=>{try{return require('./training-data.js')}catch{return root.DeMovementTrainingData}})():root.DeMovementTrainingData,
  typeof require==='function'?(()=>{try{return require('./training-intelligence.js')}catch{return root.DeMovementIntelligence}})():root.DeMovementIntelligence
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DeMovementAssistant=api;
})(typeof window!=='undefined'?window:globalThis,function(E,L,P,PP,D,I){
'use strict';
if(!E||!L||!P||!PP||!D||!I)throw new Error('Assistant requires De-Movement core modules.');

const PRIMARY_LABELS={control:'Control',strength:'Strength',compression:'Compression',locomotion:'Move',acrobatics:'Acrobatics',mobility:'Range'};
const PRIORITY={review:4,followup:3,watch:2,steady:1};
const PATH_ALIASES={
 handstand:['handstand','inversion','balance'],
 planche:['planche','straight arm push'],
 'front-lever':['front lever','lever','pull'],
 compression:['compression','l-sit','lsit','pike'],
 locomotion:['locomotion','bear','monkey','frogger','crab','ground movement'],
 'soft-acrobatics':['acrobatics','acro','roll','cartwheel'],
 mobility:['mobility','range','cossack','90/90','squat']
};

function round(n,d=1){const p=10**d;return Math.round((Number(n)||0)*p)/p}
function daysAgo(iso,now=Date.now()){const t=Date.parse(iso);return Number.isFinite(t)?(now-t)/86400000:Infinity}
function logsFromCloud(rows){
 return D.normaliseHistory((rows||[]).map(x=>({
  id:x.id,kind:x.kind,completedAt:x.completed_at||x.completedAt,title:x.title,
  primary:x.primary_intent||x.primary||'',blend:x.blend||'none',energy:x.energy||'steady',
  durationMinutes:x.duration_minutes??x.durationMinutes??0,effort:x.effort,control:x.control,confidence:x.confidence,
  movements:x.movements||[],domains:x.domains||[],notes:x.notes||''
 })));
}
function profileFromCloud(x){
 if(!x)return D.profileBlank();
 return D.normaliseProfile({
  goalPaths:x.goal_paths||x.goalPaths,
  daysPerWeek:x.days_per_week??x.daysPerWeek,
  sessionMinutes:x.session_minutes??x.sessionMinutes,
  preferredStyles:x.preferred_styles||x.preferredStyles
 });
}
function readinessFromCloud(x){
 if(!x)return D.readinessBlank();
 return D.normaliseReadiness({
  energy:x.energy,soreness:x.soreness,focus:x.focus,review:x.review,note:x.note,
  checkedAt:x.checked_at||x.checkedAt
 });
}
function normaliseEvidence(input={}){
 const state=input.state||input;
 return {
  profile:profileFromCloud(state.trainingProfile||input.profile),
  readiness:readinessFromCloud(state.readiness||input.readiness),
  history:Array.isArray(state.logs)?logsFromCloud(state.logs):D.normaliseHistory(input.history||[]),
  passport:state.passportState||input.passport||PP.blank(),
  assignments:state.assignments||input.assignments||[],
  flows:state.flows||input.flows||[]
 };
}
function period(history,minDays,maxDays,now){
 return D.normaliseHistory(history).filter(x=>{
  const d=daysAgo(x.completedAt,now);return d>=minDays&&d<maxDays;
 });
}
function periodStats(history,minDays,maxDays,now){
 const list=period(history,minDays,maxDays,now);
 const avg=k=>list.length?round(list.reduce((n,x)=>n+(Number(x[k])||0),0)/list.length):0;
 return {
  count:list.length,
  minutes:list.reduce((n,x)=>n+x.durationMinutes,0),
  effort:avg('effort'),control:avg('control'),confidence:avg('confidence')
 };
}
function changes(history,now=Date.now()){
 const current=periodStats(history,0,7,now),previous=periodStats(history,7,14,now);
 const delta=(a,b)=>round(a-b);
 return {
  current,previous,
  sessions:delta(current.count,previous.count),
  minutes:delta(current.minutes,previous.minutes),
  effort:delta(current.effort,previous.effort),
  control:delta(current.control,previous.control),
  confidence:delta(current.confidence,previous.confidence)
 };
}
function passportSummary(passport){return PP.summary(passport||PP.blank())}
function availableNext(passport,limit=4){
 const out=[];
 for(const path of P.PATHS){
  const n=PP.nextFocus(passport||PP.blank(),path.id);
  if(n)out.push({pathId:path.id,pathName:path.name,nodeId:n.id,name:n.name,status:PP.effectiveStatus(passport||PP.blank(),path.id,n.id)});
 }
 return out.slice(0,limit);
}
function goalPaths(profile){
 return (profile.goalPaths||[]).map(id=>P.get(id)).filter(Boolean);
}
function goalFocus(passport,profile){
 const goals=goalPaths(profile),out=[];
 for(const path of goals){
  const n=PP.nextFocus(passport,path.id);
  if(n)out.push({pathId:path.id,pathName:path.name,nodeId:n.id,name:n.name,status:PP.effectiveStatus(passport,path.id,n.id)});
 }
 return out;
}
function attentionSignals(input={},now=Date.now()){
 const e=normaliseEvidence(input),signals=[];
 const recent7=I.recent(e.history,7,now),recent14=I.recent(e.history,14,now),latest=e.history[0]||null;
 const week=I.weekly(e.history,now),passport=passportSummary(e.passport);
 const checkAge=e.readiness.checkedAt?daysAgo(e.readiness.checkedAt,now):Infinity;

 if(e.readiness.review){
  signals.push({id:'readiness-review',priority:'review',title:'Mover marked something for review',evidence:e.readiness.note||'The latest readiness check-in was explicitly marked for review.',action:'Check in before increasing training demand.'});
 }
 if(e.readiness.checkedAt&&checkAge<=2&&e.readiness.soreness>=4){
  signals.push({id:'high-soreness',priority:'followup',title:'High soreness reported',evidence:'Latest soreness rating is '+e.readiness.soreness+'/5.',action:'Consider lower-demand work and ask how the Mover is responding.'});
 }
 if(e.readiness.checkedAt&&checkAge<=2&&e.readiness.energy<=2){
  signals.push({id:'low-energy',priority:'watch',title:'Low energy reported',evidence:'Latest energy rating is '+e.readiness.energy+'/5.',action:'Keep today flexible and avoid treating a planned hard session as mandatory.'});
 }
 if(recent7.filter(x=>x.effort>=9).length>=2){
  signals.push({id:'repeated-high-effort',priority:'followup',title:'Repeated very high effort',evidence:recent7.filter(x=>x.effort>=9).length+' sessions were rated 9–10/10 effort this week.',action:'Review recovery and whether session density is intentional.'});
 }
 if(recent7.filter(x=>x.control<=2).length>=2){
  signals.push({id:'low-control',priority:'followup',title:'Control ratings are repeatedly low',evidence:recent7.filter(x=>x.control<=2).length+' sessions were rated 1–2/5 for control.',action:'Consider simplifying movement demands before adding progression.'});
 }
 if(recent7.filter(x=>x.confidence<=2).length>=2){
  signals.push({id:'low-confidence',priority:'watch',title:'Confidence is trending low',evidence:recent7.filter(x=>x.confidence<=2).length+' sessions were rated 1–2/5 for confidence.',action:'Use familiar, repeatable movement and ask what feels uncertain.'});
 }
 if(e.profile.daysPerWeek>=3&&recent7.length===0&&recent14.length>0){
  signals.push({id:'training-gap',priority:'followup',title:'Training gap against stated routine',evidence:'No session is logged in the last 7 days, while the profile targets '+e.profile.daysPerWeek+' days per week.',action:'Check whether the plan, schedule or logging habit needs adjustment.'});
 }else if(e.profile.daysPerWeek>=4&&recent7.length<=1&&recent14.length>0){
  signals.push({id:'low-frequency',priority:'watch',title:'Training frequency is below the stated pattern',evidence:recent7.length+' session'+(recent7.length===1?'':'s')+' logged this week against a '+e.profile.daysPerWeek+' day preference.',action:'Ask whether this reflects recovery, schedule or a deliberate change.'});
 }
 if(latest&&daysAgo(latest.completedAt,now)<=2&&latest.effort>=8&&latest.control<=2){
  signals.push({id:'effort-control-mismatch',priority:'followup',title:'High effort with low control',evidence:'Latest session was effort '+latest.effort+'/10 with control '+latest.control+'/5.',action:'Prioritise technical quality before adding load or complexity.'});
 }
 if(passport.ready>0){
  signals.push({id:'passport-ready',priority:'steady',title:'Passport has a human decision waiting',evidence:passport.ready+' capability node'+(passport.ready===1?' is':'s are')+' marked Ready.',action:'Review the criteria and decide whether mastery is warranted. Do not auto-promote.'});
 }
 const assigned=(e.assignments||[]).filter(x=>['assigned','started'].includes(x.status));
 if(assigned.some(x=>x.due_at&&Date.parse(x.due_at)<now)){
  signals.push({id:'overdue-assignment',priority:'followup',title:'Coach assignment is overdue',evidence:'At least one active assignment is past its due date.',action:'Check whether the assignment is still appropriate before simply reissuing it.'});
 }
 if(!signals.length){
  signals.push({id:'steady',priority:'steady',title:'No strong attention signal',evidence:'Recent readiness and training history do not trigger the current follow-up rules.',action:'Continue normal coaching review rather than manufacturing a problem.'});
 }
 return signals.sort((a,b)=>PRIORITY[b.priority]-PRIORITY[a.priority]||a.title.localeCompare(b.title));
}
function queueItem(input,now=Date.now()){
 const e=normaliseEvidence(input),signals=attentionSignals(e,now),top=signals[0];
 return {priority:top.priority,priorityRank:PRIORITY[top.priority],headline:top.title,signals,evidence:e,changes:changes(e.history,now),passport:passportSummary(e.passport)};
}
function coachQueue(items,now=Date.now()){
 return (items||[]).map(x=>({
  moverId:x.moverId||x.profile?.id||x.mover_id,
  name:x.name||x.profile?.display_name||'Mover',
  profile:x.profile||null,
  ...queueItem(x,now)
 })).sort((a,b)=>b.priorityRank-a.priorityRank||a.name.localeCompare(b.name));
}
function recommendationFor(input,now=Date.now()){
 const e=normaliseEvidence(input);
 return I.recommendation({profile:e.profile,readiness:e.readiness,history:e.history,now});
}
function assignmentProposal(input,now=Date.now()){
 const e=normaliseEvidence(input),rec=recommendationFor(e,now);
 if(rec.mode==='review'){
  return {mode:'review',title:'Review before assigning a hard session',primary:null,blend:'none',duration:25,energy:'gentle',reasons:rec.reasons};
 }
 return {
  mode:'proposal',
  title:(PRIMARY_LABELS[rec.primary]||rec.primary)+' · Coach proposal',
  primary:rec.primary,blend:rec.blend,duration:rec.duration,energy:rec.energy,
  reasons:rec.reasons
 };
}
function findPathFromQuestion(q){
 const s=String(q||'').toLowerCase();
 for(const [id,aliases] of Object.entries(PATH_ALIASES))if(aliases.some(a=>s.includes(a)))return P.get(id);
 return null;
}
function explainPath(path,passport){
 if(!path)return null;
 const focus=PP.nextFocus(passport,path.id),status=focus?PP.effectiveStatus(passport,path.id,focus.id):'mastered';
 const prog=PP.progress(passport,path.id);
 return {
  title:path.name+' pathway',
  answer:prog.mastered+' of '+prog.total+' stages are marked Mastered. '+(focus?'Your current human-controlled focus is '+focus.name+' ('+status+').':'This pathway is complete in the current map.'),
  evidence:[path.promise],
  action:focus?'Open Movement Passport and review the criteria for '+focus.name+'.':'Use the pathway as maintenance or expression rather than forcing another progression.'
 };
}
function easierSuggestion(input={}){
 const plan=input.plan,primary=input.primary||plan?.primary;
 const move=plan?.movements?.find(x=>x.regression)||null;
 if(move)return {title:'Use the regression already attached to this session',answer:move.regression+' is the easier option for '+move.name+'.',evidence:[move.objective],action:'Use the easier variation and keep the same control standard.'};
 const candidates=L.MOVEMENTS.filter(x=>x.intent===primary&&x.regression);
 const m=candidates[0]||L.MOVEMENTS.find(x=>x.regression);
 return m?{title:'A simpler movement option',answer:m.regression+' is the listed regression for '+m.name+'.',evidence:[m.objective],action:'Choose it manually if it better matches today.'}:{title:'No regression found',answer:'The current library does not have a suitable easier option for this context.',evidence:[],action:'Choose a gentler session or ask a qualified Coach.'};
}
function moverAnswer(question,input={},now=Date.now()){
 const q=String(question||'').trim(),low=q.toLowerCase(),e=normaliseEvidence(input),rec=recommendationFor(e,now);
 const path=findPathFromQuestion(q);
 if(path&&(low.includes('path')||low.includes('next')||low.includes('progress')))return explainPath(path,e.passport);
 if(/easier|regression|simpler|too hard|scale down/.test(low))return easierSuggestion(input);
 if(/what.*next|work on next|next skill|next movement/.test(low)){
  const focuses=goalFocus(e.passport,e.profile);
  const picks=focuses.length?focuses:availableNext(e.passport);
  return {title:'Your next capability focus',answer:picks.length?picks.map(x=>x.pathName+': '+x.name+' ('+x.status+')').join(' · '):'No next capability is available in the current Passport map.',evidence:['This comes from your declared goals and current Passport state.'],action:'Choose which path matters today. De-Movement will not mark anything Mastered for you.'};
 }
 if(/why|recommend|today|session/.test(low)){
  return {title:rec.mode==='review'?'Why De-Movement is holding back':'Why this session is being suggested',answer:rec.headline,evidence:rec.reasons,action:rec.mode==='review'?'Choose manually only if appropriate.':'Use it, edit it, or ignore it. The recommendation is not a command.'};
 }
 if(/passport|progress/.test(low)){
  const ps=passportSummary(e.passport);
  return {title:'Movement Passport snapshot',answer:ps.mastered+' Mastered · '+ps.practising+' Practising · '+ps.ready+' Ready · '+ps.available+' Available.',evidence:['Passport status changes are human-controlled.'],action:'Open the Passport to inspect criteria before changing a status.'};
 }
 return {title:'What I can explain',answer:'Ask about today’s recommendation, what to work on next, an easier variation, your Passport, or a specific pathway such as Handstand or Front Lever.',evidence:['De-Movement Assistant is currently evidence-bound and deterministic.'],action:'Choose one of the suggested questions rather than expecting open-ended medical or coaching judgement.'};
}
function changeNarrative(c){
 const parts=[];
 if(c.sessions!==0)parts.push('sessions '+(c.sessions>0?'increased by ':'decreased by ')+Math.abs(c.sessions));
 if(c.minutes!==0)parts.push('training minutes '+(c.minutes>0?'increased by ':'decreased by ')+Math.abs(c.minutes));
 if(c.control!==0)parts.push('average control '+(c.control>0?'rose by ':'fell by ')+Math.abs(c.control));
 if(c.confidence!==0)parts.push('average confidence '+(c.confidence>0?'rose by ':'fell by ')+Math.abs(c.confidence));
 if(c.effort!==0)parts.push('average effort '+(c.effort>0?'rose by ':'fell by ')+Math.abs(c.effort));
 return parts.length?parts.join('; ')+'.':'There is no material week-over-week change in the current logged metrics.';
}
function coachAnswer(question,input={},now=Date.now()){
 const low=String(question||'').toLowerCase(),e=normaliseEvidence(input),signals=attentionSignals(e,now),c=changes(e.history,now),proposal=assignmentProposal(e,now);
 const path=findPathFromQuestion(question);
 if(/why|attention|concern|check/.test(low)){
  return {title:'Why this Mover is on your radar',answer:signals[0].title,evidence:signals.slice(0,4).map(x=>x.evidence),action:signals[0].action,proposal:null};
 }
 if(/what changed|change|trend/.test(low)){
  return {title:'What changed',answer:changeNarrative(c),evidence:['Current 7 days: '+c.current.count+' sessions, '+c.current.minutes+' minutes.','Previous 7 days: '+c.previous.count+' sessions, '+c.previous.minutes+' minutes.'],action:'Use the trend as a conversation starter, not a diagnosis.',proposal:null};
 }
 if(/assign|session|program|recommend/.test(low)){
  return {title:proposal.mode==='review'?'Assignment held for review':'Possible assignment',answer:proposal.title,evidence:proposal.reasons,action:proposal.mode==='review'?'Review with the Mover before assigning a hard session.':'Load this into the assignment form only if it fits your coaching judgement.',proposal};
 }
 if(path)return {...explainPath(path,e.passport),proposal:null};
 if(/passport|progress/.test(low)){
  const ps=passportSummary(e.passport),focus=goalFocus(e.passport,e.profile);
  return {title:'Passport coaching snapshot',answer:ps.mastered+' Mastered · '+ps.practising+' Practising · '+ps.ready+' Ready.',evidence:focus.map(x=>x.pathName+': '+x.name+' ('+x.status+')'),action:'Review criteria with the Mover. Do not auto-promote.',proposal:null};
 }
 return {title:'Coach Assistant scope',answer:'Ask why this Mover needs attention, what changed, what you could assign, or about a Passport pathway.',evidence:['The assistant uses synced De-Movement evidence only.'],action:'Keep the final coaching decision human.',proposal:null};
}
return {PRIORITY,normaliseEvidence,changes,attentionSignals,coachQueue,recommendationFor,assignmentProposal,moverAnswer,coachAnswer,passportSummary,goalFocus,availableNext};
});