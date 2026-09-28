(function(root,factory){
  const api=factory(
    typeof require==='function'?(()=>{try{return require('./movements.js')}catch{return root.DeMovementLibrary}})():root.DeMovementLibrary,
    typeof require==='function'?(()=>{try{return require('./paths.js')}catch{return root.DeMovementPaths}})():root.DeMovementPaths,
    typeof require==='function'?(()=>{try{return require('./passport.js')}catch{return root.DeMovementPassport}})():root.DeMovementPassport
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DeMovementFlow=api;
})(typeof window!=='undefined'?window:globalThis,function(L,P,PP){
'use strict';
if(!L||!P||!PP)throw new Error('Flow Lab requires movement library, paths and Passport.');

const KEY='demovement.flow.v1';
const MAX_MOVES=8;
const RHYTHMS={
  learn:{label:'Learn',moveFactor:1.28,transitionFactor:1.18,roundRest:25,copy:'More time in each shape. Pause whenever the connection needs thinking.'},
  smooth:{label:'Smooth',moveFactor:1,transitionFactor:1,roundRest:20,copy:'Enough time to connect movements without turning the flow into a race.'},
  express:{label:'Express',moveFactor:.86,transitionFactor:.9,roundRest:15,copy:'A little more continuous, but control still outranks speed.'}
};

const META={
  'bear':{pathId:'locomotion',nodeId:'bear',family:'ground',start:'quadruped',end:'quadruped',seconds:16,minSeconds:12},
  'frogger':{pathId:'locomotion',nodeId:'frogger',family:'ground',start:'squat',end:'squat',seconds:16,minSeconds:12},
  'monkey':{pathId:'locomotion',nodeId:'monkey',family:'ground',start:'squat',end:'squat',seconds:16,minSeconds:12},
  'crab':{pathId:'locomotion',nodeId:'crab',family:'ground',start:'seated',end:'seated',seconds:16,minSeconds:12},
  'rock-to-squat':{pathId:'soft-acrobatics',nodeId:'rock-to-squat',family:'acro',start:'squat',end:'squat',seconds:20,minSeconds:16},
  'forward-roll':{pathId:'soft-acrobatics',nodeId:'forward-roll',family:'acro',start:'stand',end:'stand',seconds:20,minSeconds:16},
  'cartwheel-prep':{pathId:'soft-acrobatics',nodeId:'cartwheel-prep',family:'acro',start:'stand',end:'stand',seconds:22,minSeconds:18},
  'deep-squat-pry':{pathId:'mobility',nodeId:'deep-squat',family:'range',start:'squat',end:'squat',seconds:18,minSeconds:14},
  'ninety-ninety-switch':{pathId:'mobility',nodeId:'ninety-ninety',family:'range',start:'seated',end:'seated',seconds:18,minSeconds:14},
  'cossack':{pathId:'mobility',nodeId:'cossack',family:'range',start:'squat',end:'squat',seconds:18,minSeconds:14},
  'tuck-lsit':{pathId:'compression',nodeId:'tuck-lsit',family:'anchor',start:'seated',end:'seated',seconds:16,minSeconds:12},
  'planche-lean':{pathId:'planche',nodeId:'planche-lean',family:'anchor',start:'plank',end:'plank',seconds:16,minSeconds:12}
};

const SPECIFIC={
  'deep-squat-pry>bear':['smooth','From the squat, plant both hands and step the feet back into a quiet Bear.',4],
  'bear>deep-squat-pry':['smooth','Shorten the last Bear step, bring the feet towards the hands and settle into the squat.',4],
  'bear>frogger':['smooth','Bring the feet towards the hands, find the squat, then let the hands lead the Frogger.',4],
  'frogger>monkey':['smooth','Land in the squat, turn the chest towards the travel direction and move laterally.',4],
  'monkey>cossack':['smooth','Finish in the squat, keep one foot planted and shift laterally into the Cossack.',4],
  'cossack>deep-squat-pry':['smooth','Return through centre and settle both feet into the deep squat.',4],
  'deep-squat-pry>rock-to-squat':['smooth','Lower into a seated tuck, rock back softly, then return through the squat.',5],
  'rock-to-squat>bear':['smooth','Finish balanced in the squat, place the hands down and step back into Bear.',4],
  'rock-to-squat>forward-roll':['connected','Finish in the squat, rise only enough to reset the feet, then initiate the roll deliberately.',6],
  'forward-roll>cartwheel-prep':['connected','Finish standing, breathe, turn side-on and step into the cartwheel-prep lunge.',7],
  'cartwheel-prep>deep-squat-pry':['connected','Finish the lateral transfer, square the feet and lower deliberately into the squat.',6],
  'crab>bear':['connected','Lower the hips, rotate through seated hand support and return to quadruped before travelling.',7],
  'bear>crab':['connected','Pause the Bear, sit one hip through under control and rotate into Crab support.',7],
  'ninety-ninety-switch>deep-squat-pry':['connected','Plant the feet, use the hands if needed and rise into the squat without rushing.',7],
  'deep-squat-pry>ninety-ninety-switch':['connected','Sit to one hip with hand support as needed, then organise the legs into 90/90.',7],
  'tuck-lsit>ninety-ninety-switch':['connected','Lower from support to seated, breathe, then rotate the hips into 90/90.',6],
  'planche-lean>bear':['smooth','Ease the lean back towards quadruped, soften the knees and lift into Bear.',5],
  'bear>planche-lean':['connected','Settle from Bear into a stable high plank, protract, then add the lean gradually.',6]
};

function status(passport,id){
  const m=META[id];if(!m)return 'locked';
  return PP.effectiveStatus(passport,m.pathId,m.nodeId);
}
function eligible(passport){
  return Object.entries(META).map(([id,meta])=>{
    const movement=L.get(id),s=status(passport,id);
    return movement&&s!=='locked'?{...movement,flow:meta,passportStatus:s}:null;
  }).filter(Boolean);
}
function canUse(passport,id){return META[id]&&L.get(id)&&status(passport,id)!=='locked'}

function normaliseSequence(sequence,passport){
  const out=[];
  for(const id of Array.isArray(sequence)?sequence:[]){
    if(out.length>=MAX_MOVES)break;
    if(!canUse(passport,id))continue;
    if(out[out.length-1]===id)continue;
    out.push(id);
  }
  return out;
}
function add(sequence,id,passport){
  const out=normaliseSequence(sequence,passport);
  if(out.length>=MAX_MOVES||!canUse(passport,id)||out[out.length-1]===id)return out;
  return [...out,id];
}
function remove(sequence,index,passport){
  const out=normaliseSequence(sequence,passport);
  if(!Number.isInteger(index)||index<0||index>=out.length)return out;
  return out.filter((_,i)=>i!==index);
}
function move(sequence,index,delta,passport){
  const out=normaliseSequence(sequence,passport);
  const to=index+delta;
  if(!Number.isInteger(index)||!Number.isInteger(delta)||index<0||index>=out.length||to<0||to>=out.length)return out;
  const copy=[...out];[copy[index],copy[to]]=[copy[to],copy[index]];
  return copy;
}

function transition(fromId,toId){
  const a=META[fromId],b=META[toId];
  if(!a||!b)return {quality:'reset',hint:'Pause, reset your position and prepare the next movement deliberately.',seconds:8};
  const exact=SPECIFIC[fromId+'>'+toId];
  if(exact)return {quality:exact[0],hint:exact[1],seconds:exact[2]};
  if(a.end===b.start)return {quality:'smooth',hint:'Keep the same base position and let the next movement grow out of it without rushing.',seconds:4};
  if(a.family===b.family)return {quality:'connected',hint:'Finish the first pattern completely, organise your base and continue into the next movement.',seconds:6};
  const pair=new Set([a.end,b.start]);
  if(pair.has('squat')&&pair.has('stand'))return {quality:'connected',hint:'Pass through a balanced squat or stand before beginning the next pattern.',seconds:6};
  if(pair.has('quadruped')&&pair.has('plank'))return {quality:'connected',hint:'Set the hands, organise the shoulders and shift between quadruped and plank under control.',seconds:6};
  if(pair.has('seated')&&pair.has('squat'))return {quality:'connected',hint:'Use the hands as needed to pass through a stable seated-to-squat transition.',seconds:7};
  return {quality:'reset',hint:'Pause in a neutral position, breathe once and set the next movement deliberately.',seconds:8};
}
function analyse(sequence){
  const seq=Array.isArray(sequence)?sequence:[];
  const transitions=[];
  let points=0;
  for(let i=0;i<seq.length-1;i++){
    const t=transition(seq[i],seq[i+1]);
    transitions.push({from:seq[i],to:seq[i+1],...t});
    points+=t.quality==='smooth'?2:t.quality==='connected'?1:0;
  }
  const max=Math.max(1,(seq.length-1)*2);
  const score=seq.length<2?0:Math.round(points/max*100);
  const label=score>=75?'Continuous':score>=40?'Connected':'Reset-rich';
  return {transitions,score,label};
}
function starter(passport){
  const preferred=['deep-squat-pry','bear','rock-to-squat'];
  const seq=preferred.filter(id=>canUse(passport,id));
  if(seq.length>=2)return seq;
  return eligible(passport).slice(0,3).map(x=>x.id);
}
function rhythm(key){return RHYTHMS[key]||RHYTHMS.smooth}
function clampRounds(n){n=Number(n);return Number.isInteger(n)&&n>=1&&n<=5?n:3}
function normaliseBuilder(input,passport){
  const src=input&&typeof input==='object'?input:{};
  return {sequence:normaliseSequence(src.sequence,passport),rounds:clampRounds(src.rounds),rhythm:RHYTHMS[src.rhythm]?src.rhythm:'smooth'};
}
function load(passport){
  if(typeof localStorage==='undefined')return normaliseBuilder({},passport);
  try{return normaliseBuilder(JSON.parse(localStorage.getItem(KEY)||'null'),passport)}catch{return normaliseBuilder({},passport)}
}
function save(builder,passport){
  const out=normaliseBuilder(builder,passport);
  if(typeof localStorage!=='undefined')try{localStorage.setItem(KEY,JSON.stringify(out))}catch{}
  return out;
}

function compose(input,passport){
  const b=normaliseBuilder(input,passport);
  if(b.sequence.length<2)return {...b,valid:false,movements:[],transitions:[],analysis:analyse(b.sequence),roundSeconds:0,totalSeconds:0};
  const r=rhythm(b.rhythm);
  const movements=b.sequence.map(id=>{
    const movement=L.get(id),meta=META[id];
    const seconds=Math.max(meta.minSeconds,Math.round(meta.seconds*r.moveFactor));
    return {...movement,flow:meta,passportStatus:status(passport,id),seconds};
  });
  const analysis=analyse(b.sequence);
  const transitions=analysis.transitions.map(t=>({...t,seconds:Math.max(3,Math.round(t.seconds*r.transitionFactor))}));
  const roundSeconds=movements.reduce((n,x)=>n+x.seconds,0)+transitions.reduce((n,x)=>n+x.seconds,0);
  const totalSeconds=roundSeconds*b.rounds+r.roundRest*Math.max(0,b.rounds-1);
  return {...b,valid:true,movements,transitions,analysis,roundSeconds,totalSeconds,roundRest:r.roundRest,rhythmInfo:r};
}
function timeline(flow){
  if(!flow?.valid)return [];
  const out=[];
  for(let round=1;round<=flow.rounds;round++){
    flow.movements.forEach((m,i)=>{
      out.push({type:'move',round,movementId:m.id,seconds:m.seconds});
      if(i<flow.movements.length-1){
        const t=flow.transitions[i];
        out.push({type:'transition',round,from:t.from,to:t.to,quality:t.quality,hint:t.hint,seconds:t.seconds});
      }
    });
    if(round<flow.rounds)out.push({type:'round-rest',round,seconds:flow.roundRest});
  }
  return out;
}

class FlowRunner{
  constructor(flow){
    this.flow=flow;
    this.steps=timeline(flow);
    this.index=0;
    this.remaining=this.steps[0]?.seconds||0;
    this.running=false;
    this.finished=this.steps.length===0;
  }
  current(){return this.finished?null:this.steps[this.index]}
  start(){if(!this.finished)this.running=true;return this.snapshot()}
  pause(){this.running=false;return this.snapshot()}
  next(){
    if(this.finished)return this.snapshot();
    this.index++;
    if(this.index>=this.steps.length){this.finished=true;this.running=false;this.remaining=0}
    else{this.remaining=this.steps[this.index].seconds;this.running=true}
    return this.snapshot();
  }
  tick(){
    if(!this.running||this.finished)return this.snapshot();
    this.remaining=Math.max(0,this.remaining-1);
    if(this.remaining===0)this.next();
    return this.snapshot();
  }
  progress(){return this.steps.length?Math.round(this.index/this.steps.length*100):0}
  snapshot(){return {index:this.index,remaining:this.remaining,running:this.running,finished:this.finished,current:this.current(),progress:this.finished?100:this.progress()}}
}

return {KEY,MAX_MOVES,RHYTHMS,META,SPECIFIC,status,eligible,canUse,normaliseSequence,add,remove,move,transition,analyse,starter,normaliseBuilder,load,save,compose,timeline,FlowRunner};
});