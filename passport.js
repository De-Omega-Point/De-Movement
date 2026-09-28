(function(root,factory){
  const api=factory(
    typeof require==='function'?(()=>{try{return require('./paths.js')}catch{return root.DeMovementPaths}})():root.DeMovementPaths
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DeMovementPassport=api;
})(typeof window!=='undefined'?window:globalThis,function(P){
'use strict';
if(!P)throw new Error('Passport requires movement paths.');

const KEY='demovement.passport.v1';
const STORED=['locked','practising','ready','mastered'];

function blank(){
  const state={version:1,statuses:{},criteria:{}};
  for(const path of P.PATHS){
    state.statuses[path.id]={};
    state.criteria[path.id]={};
    for(const n of path.nodes){state.statuses[path.id][n.id]='locked';state.criteria[path.id][n.id]=[]}
  }
  return state;
}
function normalise(input){
  const out=blank(),src=input&&typeof input==='object'?input:{};
  for(const path of P.PATHS){
    for(const n of path.nodes){
      const st=src.statuses?.[path.id]?.[n.id];
      if(STORED.includes(st))out.statuses[path.id][n.id]=st;
      const arr=src.criteria?.[path.id]?.[n.id];
      if(Array.isArray(arr))out.criteria[path.id][n.id]=[...new Set(arr.filter(x=>Number.isInteger(x)&&x>=0&&x<n.criteria.length))];
    }
  }
  return out;
}
function load(){
  if(typeof localStorage==='undefined')return blank();
  try{return normalise(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return blank()}
}
function save(state){
  const n=normalise(state);
  if(typeof localStorage!=='undefined')try{localStorage.setItem(KEY,JSON.stringify(n))}catch{}
  return n;
}
function pathAndIndex(pathId,nodeId){
  const path=P.get(pathId);if(!path)return null;
  const index=path.nodes.findIndex(n=>n.id===nodeId);if(index<0)return null;
  return {path,index,node:path.nodes[index]};
}
function storedStatus(state,pathId,nodeId){return normalise(state).statuses[pathId]?.[nodeId]||'locked'}
function previousMastered(state,pathId,index){
  const path=P.get(pathId);if(!path)return false;
  if(index===0)return true;
  return storedStatus(state,pathId,path.nodes[index-1].id)==='mastered';
}
function effectiveStatus(state,pathId,nodeId){
  const info=pathAndIndex(pathId,nodeId);if(!info)return 'locked';
  const stored=storedStatus(state,pathId,nodeId);
  if(stored!=='locked')return stored;
  return previousMastered(state,pathId,info.index)?'available':'locked';
}
function criteriaMet(state,pathId,nodeId){
  const info=pathAndIndex(pathId,nodeId);if(!info)return false;
  const checked=normalise(state).criteria[pathId]?.[nodeId]||[];
  return checked.length===info.node.criteria.length;
}
function setCriterion(state,pathId,nodeId,index,checked){
  const info=pathAndIndex(pathId,nodeId);if(!info)throw new Error('Unknown passport node');
  if(!Number.isInteger(index)||index<0||index>=info.node.criteria.length)throw new Error('Unknown criterion');
  const out=normalise(state),arr=new Set(out.criteria[pathId][nodeId]);
  checked?arr.add(index):arr.delete(index);
  out.criteria[pathId][nodeId]=[...arr].sort((a,b)=>a-b);
  return out;
}
function setStatus(state,pathId,nodeId,next){
  if(!STORED.includes(next))throw new Error('Invalid passport status');
  const info=pathAndIndex(pathId,nodeId);if(!info)throw new Error('Unknown passport node');
  const out=normalise(state);
  if(next!=='locked'&&!previousMastered(out,pathId,info.index))throw new Error('Master the prerequisite first');
  if(['ready','mastered'].includes(next)&&!criteriaMet(out,pathId,nodeId))throw new Error('Complete the readiness checklist first');
  out.statuses[pathId][nodeId]=next;
  if(next!=='mastered'){
    for(let i=info.index+1;i<info.path.nodes.length;i++){
      const id=info.path.nodes[i].id;
      out.statuses[pathId][id]='locked';
      out.criteria[pathId][id]=[];
    }
  }
  return out;
}
function resetPath(state,pathId){
  const path=P.get(pathId);if(!path)throw new Error('Unknown path');
  const out=normalise(state);
  for(const n of path.nodes){out.statuses[pathId][n.id]='locked';out.criteria[pathId][n.id]=[]}
  return out;
}
function progress(state,pathId){
  const path=P.get(pathId);if(!path)return {mastered:0,total:0,percent:0};
  const mastered=path.nodes.filter(n=>storedStatus(state,pathId,n.id)==='mastered').length;
  return {mastered,total:path.nodes.length,percent:Math.round(mastered/path.nodes.length*100)};
}
function summary(state){
  const counts={mastered:0,ready:0,practising:0,available:0,locked:0,total:0};
  for(const path of P.PATHS)for(const n of path.nodes){const s=effectiveStatus(state,path.id,n.id);counts[s]++;counts.total++}
  return counts;
}
function nextFocus(state,pathId){
  const path=P.get(pathId);if(!path)return null;
  return path.nodes.find(n=>['practising','ready','available'].includes(effectiveStatus(state,pathId,n.id)))||path.nodes[path.nodes.length-1];
}
return {KEY,blank,normalise,load,save,effectiveStatus,storedStatus,criteriaMet,setCriterion,setStatus,resetPath,progress,summary,nextFocus};
});