(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DeMovementTrainingData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

const PROFILE_KEY='demovement.profile.v1';
const READINESS_KEY='demovement.readiness.v1';
const HISTORY_KEY='demovement.history.v1';
const GOALS=['handstand','planche','front-lever','compression','locomotion','soft-acrobatics','mobility'];
const STYLES=['calisthenics','locomotion','acrobatics','mobility'];
const DURATIONS=[25,40,55];

function clamp(n,min,max,fallback){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function profileBlank(){return {goalPaths:['handstand','locomotion'],daysPerWeek:4,sessionMinutes:40,preferredStyles:['calisthenics','locomotion']}}
function normaliseProfile(x){
 const src=x&&typeof x==='object'?x:{};
 const goals=[...new Set(Array.isArray(src.goalPaths)?src.goalPaths.filter(x=>GOALS.includes(x)):[])].slice(0,3);
 const styles=[...new Set(Array.isArray(src.preferredStyles)?src.preferredStyles.filter(x=>STYLES.includes(x)):[])].slice(0,3);
 const days=Math.round(clamp(src.daysPerWeek,1,7,4));
 const minutes=DURATIONS.includes(Number(src.sessionMinutes))?Number(src.sessionMinutes):40;
 return {goalPaths:goals.length?goals:profileBlank().goalPaths,daysPerWeek:days,sessionMinutes:minutes,preferredStyles:styles.length?styles:profileBlank().preferredStyles};
}
function readinessBlank(){return {energy:3,soreness:2,focus:3,review:false,note:'',checkedAt:null}}
function normaliseReadiness(x){
 const src=x&&typeof x==='object'?x:{};
 return {
  energy:Math.round(clamp(src.energy,1,5,3)),
  soreness:Math.round(clamp(src.soreness,1,5,2)),
  focus:Math.round(clamp(src.focus,1,5,3)),
  review:src.review===true,
  note:String(src.note||'').slice(0,500),
  checkedAt:typeof src.checkedAt==='string'?src.checkedAt:null
 };
}
function cleanLog(x){
 if(!x||typeof x!=='object')return null;
 const kind=['session','flow'].includes(x.kind)?x.kind:'session';
 const completedAt=typeof x.completedAt==='string'&&!Number.isNaN(Date.parse(x.completedAt))?x.completedAt:new Date().toISOString();
 return {
  id:String(x.id||('dm-'+completedAt)),
  kind,completedAt,
  title:String(x.title||'Movement session').slice(0,120),
  primary:String(x.primary||'').slice(0,40),
  blend:String(x.blend||'none').slice(0,40),
  energy:String(x.energy||'steady').slice(0,20),
  durationMinutes:Math.round(clamp(x.durationMinutes,0,240,0)),
  effort:Math.round(clamp(x.effort,1,10,5)),
  control:Math.round(clamp(x.control,1,5,3)),
  confidence:Math.round(clamp(x.confidence,1,5,3)),
  movements:[...new Set(Array.isArray(x.movements)?x.movements.map(String):[])].slice(0,30),
  domains:[...new Set(Array.isArray(x.domains)?x.domains.map(String):[])].slice(0,10),
  notes:String(x.notes||'').slice(0,500)
 };
}
function normaliseHistory(x){
 const list=Array.isArray(x)?x.map(cleanLog).filter(Boolean):[];
 return list.sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt)).slice(0,120);
}
function read(key,fallback){
 if(typeof localStorage==='undefined')return fallback;
 try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}
}
function write(key,value){if(typeof localStorage!=='undefined')try{localStorage.setItem(key,JSON.stringify(value))}catch{}return value}
function loadProfile(){return normaliseProfile(read(PROFILE_KEY,null))}
function saveProfile(x){return write(PROFILE_KEY,normaliseProfile(x))}
function loadReadiness(){return normaliseReadiness(read(READINESS_KEY,null))}
function saveReadiness(x,touch=true){const out=normaliseReadiness({...x,checkedAt:touch?new Date().toISOString():(x?.checkedAt||null)});return write(READINESS_KEY,out)}
function loadHistory(){return normaliseHistory(read(HISTORY_KEY,[]))}
function saveHistory(x){return write(HISTORY_KEY,normaliseHistory(x))}
function addLog(history,entry){
 const item=cleanLog({...entry,id:entry?.id||('dm-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),completedAt:entry?.completedAt||new Date().toISOString()});
 return {history:normaliseHistory([item,...normaliseHistory(history)]),item};
}
function persistLog(entry){
 const {history,item}=addLog(loadHistory(),entry);saveHistory(history);return item;
}
function clearHistory(){return write(HISTORY_KEY,[])}
return {PROFILE_KEY,READINESS_KEY,HISTORY_KEY,GOALS,STYLES,DURATIONS,profileBlank,normaliseProfile,readinessBlank,normaliseReadiness,normaliseHistory,loadProfile,saveProfile,loadReadiness,saveReadiness,loadHistory,saveHistory,addLog,persistLog,clearHistory};
});