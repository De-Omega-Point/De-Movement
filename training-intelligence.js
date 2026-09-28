(function(root,factory){
 const api=factory(
  typeof require==='function'?(()=>{try{return require('./engine.js')}catch{return root.DeMovementEngine}})():root.DeMovementEngine,
  typeof require==='function'?(()=>{try{return require('./training-data.js')}catch{return root.DeMovementTrainingData}})():root.DeMovementTrainingData
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DeMovementIntelligence=api;
})(typeof window!=='undefined'?window:globalThis,function(E,D){
'use strict';
if(!E||!D)throw new Error('Training Intelligence requires engine and training data.');

const GOAL_PRIMARY={
 handstand:'control',planche:'strength','front-lever':'strength',compression:'compression',
 locomotion:'locomotion','soft-acrobatics':'acrobatics',mobility:'mobility'
};
const STYLE_PRIMARY={calisthenics:'strength',locomotion:'locomotion',acrobatics:'acrobatics',mobility:'mobility'};
const BLEND_FOR={control:'mobility',strength:'locomotion',compression:'mobility',locomotion:'mobility',acrobatics:'mobility',mobility:'locomotion'};

function daysAgo(iso,now=Date.now()){return (now-Date.parse(iso))/86400000}
function recent(history,days,now=Date.now()){return D.normaliseHistory(history).filter(x=>daysAgo(x.completedAt,now)>=0&&daysAgo(x.completedAt,now)<=days)}
function exposure(history,days=7,now=Date.now()){
 const counts={control:0,strength:0,compression:0,locomotion:0,acrobatics:0,mobility:0};
 for(const x of recent(history,days,now)){
  if(counts[x.primary]!==undefined)counts[x.primary]+=1;
  if(counts[x.blend]!==undefined)counts[x.blend]+=.5;
  for(const d of x.domains||[]){
    if(d==='locomotion')counts.locomotion+=.25;
    if(d==='acrobatics')counts.acrobatics+=.25;
    if(d==='mobility')counts.mobility+=.25;
    if(d==='calisthenics')counts.strength+=.15;
  }
 }
 return counts;
}
function averages(history,days=14,now=Date.now()){
 const list=recent(history,days,now);
 const avg=key=>list.length?list.reduce((n,x)=>n+(Number(x[key])||0),0)/list.length:0;
 return {count:list.length,effort:avg('effort'),control:avg('control'),confidence:avg('confidence')};
}
function recommendation(input={}){
 const profile=D.normaliseProfile(input.profile),ready=D.normaliseReadiness(input.readiness),history=D.normaliseHistory(input.history);
 const now=Number(input.now)||Date.now(),exp=exposure(history,7,now),scores={control:0,strength:0,compression:0,locomotion:0,acrobatics:0,mobility:0};
 const reasons=[];
 for(const goal of profile.goalPaths){const p=GOAL_PRIMARY[goal];if(p)scores[p]+=3}
 for(const style of profile.preferredStyles){const p=STYLE_PRIMARY[style];if(p)scores[p]+=1}
 for(const key of Object.keys(scores))scores[key]-=exp[key]*1.35;

 const last24=recent(history,1,now),last48=recent(history,2,now);
 const high24=last24.some(x=>x.effort>=9);
 const lowControl=recent(history,7,now).filter(x=>x.control<=2).length;
 const lowConfidence=recent(history,7,now).filter(x=>x.confidence<=2).length;

 if(ready.review){
  return {mode:'review',primary:null,blend:'none',duration:25,energy:'gentle',headline:'Review before training hard today',reasons:['You marked something as needing review. De-Movement will not auto-prescribe a hard session from that signal.','Use your judgement, choose a gentle option only if appropriate, and seek qualified help for concerning symptoms or injury.'],exposure:exp,averages:averages(history,14,now)};
 }
 if(ready.energy<=2){scores.mobility+=2;scores.locomotion+=1;reasons.push('Energy is low, so lower-cost movement gets priority.')}
 if(ready.soreness>=4){scores.mobility+=2;scores.control+=.5;scores.strength-=2;reasons.push('Soreness is high, so heavy strength exposure is de-emphasised.')}
 if(ready.focus<=2){scores.locomotion+=1;scores.mobility+=1;scores.control-=1;reasons.push('Focus is low, so the recommendation avoids a precision-heavy session.')}
 if(high24){scores.strength-=2;scores.control-=1;reasons.push('A very high-effort session was logged in the last 24 hours.')}
 if(last48.length>=2){scores.mobility+=1;scores.locomotion+=.75;reasons.push('You have trained multiple times in the last 48 hours, so today tilts toward lower-density work.')}
 if(lowControl>=2){scores.control+=1;scores.mobility+=.5;reasons.push('Recent control ratings were low, so quality-oriented work gets a small boost.')}
 if(lowConfidence>=2){scores.control+=.5;scores.locomotion+=.5;reasons.push('Recent confidence ratings were low, so today favours repeatable movement rather than aggressive progression.')}

 const primary=Object.entries(scores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
 let blend=BLEND_FOR[primary]||'mobility';
 const candidates=['mobility','locomotion','acrobatics','strength'].filter(x=>x!==primary);
 candidates.sort((a,b)=>(exp[a]||0)-(exp[b]||0));
 if(candidates[0])blend=candidates[0];

 let energy='steady';
 if(ready.energy<=2||ready.soreness>=4||high24||last48.length>=3)energy='gentle';
 else if(ready.energy>=4&&ready.soreness<=2&&ready.focus>=4&&!high24&&last24.length===0)energy='charged';

 let duration=profile.sessionMinutes;
 if(energy==='gentle'&&duration===55)duration=40;
 if(ready.energy===1||ready.focus===1)duration=25;

 const goalMatches=profile.goalPaths.filter(g=>GOAL_PRIMARY[g]===primary);
 if(goalMatches.length)reasons.unshift('This aligns with your '+goalMatches.map(x=>x.replaceAll('-',' ')).join(' / ')+' goal.');
 const mostExposed=Object.entries(exp).sort((a,b)=>b[1]-a[1])[0];
 if(mostExposed&&mostExposed[1]>=2)reasons.push(mostExposed[0]+' has had relatively high exposure this week, so the score was reduced.');
 if(!history.length)reasons.push('There is no training history yet, so goals and today’s readiness carry most of the decision.');

 return {mode:'train',primary,blend,duration,energy,headline:E.PRIMARY[primary].label+' + '+(E.BLENDS[blend]?.label||'No blend'),reasons:[...new Set(reasons)].slice(0,5),exposure:exp,averages:averages(history,14,now),scores};
}
function weekly(history,now=Date.now()){
 const list=recent(history,7,now),exp=exposure(history,7,now);
 return {
  sessions:list.length,
  minutes:list.reduce((n,x)=>n+x.durationMinutes,0),
  effort:list.length?Math.round(list.reduce((n,x)=>n+x.effort,0)/list.length*10)/10:0,
  control:list.length?Math.round(list.reduce((n,x)=>n+x.control,0)/list.length*10)/10:0,
  confidence:list.length?Math.round(list.reduce((n,x)=>n+x.confidence,0)/list.length*10)/10:0,
  exposure:exp
 };
}
return {GOAL_PRIMARY,STYLE_PRIMARY,exposure,averages,recommendation,weekly,recent};
});