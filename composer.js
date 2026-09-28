(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./engine.js'),require('./movements.js'));
  }else{
    root.DeMovementComposer=factory(root.DeMovementEngine,root.DeMovementLibrary);
  }
})(typeof window!=='undefined'?window:globalThis,function(E,L){
'use strict';
if(!E||!L)throw new Error('Composer requires engine and movement library.');

const PROTOCOLS={
 'wall-handstand':{kind:'hold',sets:4,seconds:25,rest:45},
 'pull-up':{kind:'reps',sets:4,reps:5,rest:90},
 'tuck-front-lever':{kind:'hold',sets:4,seconds:8,rest:75},
 'planche-lean':{kind:'hold',sets:4,seconds:15,rest:60},
 'tuck-lsit':{kind:'hold',sets:4,seconds:12,rest:45},
 'bear':{kind:'time',sets:3,seconds:30,rest:30},
 'monkey':{kind:'reps',sets:3,reps:5,perSide:true,rest:35},
 'frogger':{kind:'reps',sets:3,reps:6,rest:35},
 'crab':{kind:'time',sets:3,seconds:30,rest:30},
 'forward-roll':{kind:'reps',sets:3,reps:4,rest:30},
 'cartwheel-prep':{kind:'reps',sets:3,reps:4,perSide:true,rest:40},
 'cossack':{kind:'reps',sets:3,reps:6,perSide:true,rest:45},
 'wrist-rocks':{kind:'reps',sets:2,reps:8,rest:20},
 'scapular-push-up':{kind:'reps',sets:2,reps:10,rest:30},
 'active-hang':{kind:'hold',sets:2,seconds:20,rest:30},
 'hollow-body':{kind:'hold',sets:3,seconds:20,rest:35},
 'pike-compression-lift':{kind:'reps',sets:3,reps:8,rest:40},
 'ninety-ninety-switch':{kind:'reps',sets:2,reps:6,perSide:true,rest:25},
 'split-squat':{kind:'reps',sets:3,reps:8,perSide:true,rest:60},
 'deep-squat-pry':{kind:'hold',sets:2,seconds:35,rest:20}
};

const MAP={
 control:{
  prime:['wrist-rocks','scapular-push-up'],
  skill:['wall-handstand'],
  strength:['tuck-lsit','planche-lean','hollow-body'],
  range:['ninety-ninety-switch','cossack','deep-squat-pry']
 },
 strength:{
  prime:['active-hang','scapular-push-up'],
  skill:['pull-up','planche-lean','tuck-front-lever'],
  strength:['split-squat','hollow-body','tuck-lsit'],
  range:['deep-squat-pry','ninety-ninety-switch','cossack']
 },
 compression:{
  prime:['wrist-rocks','ninety-ninety-switch'],
  skill:['tuck-lsit','pike-compression-lift'],
  strength:['hollow-body','split-squat','planche-lean'],
  range:['cossack','deep-squat-pry','ninety-ninety-switch']
 },
 locomotion:{
  prime:['ninety-ninety-switch','wrist-rocks'],
  skill:['bear','monkey','frogger'],
  strength:['crab','split-squat','hollow-body'],
  range:['cossack','deep-squat-pry','ninety-ninety-switch']
 },
 acrobatics:{
  prime:['wrist-rocks','ninety-ninety-switch'],
  skill:['forward-roll','cartwheel-prep'],
  strength:['wall-handstand','hollow-body','split-squat'],
  range:['cossack','deep-squat-pry','ninety-ninety-switch']
 },
 mobility:{
  prime:['ninety-ninety-switch','deep-squat-pry'],
  skill:['cossack','ninety-ninety-switch','deep-squat-pry'],
  strength:['split-squat','pike-compression-lift','bear'],
  range:['deep-squat-pry','cossack','ninety-ninety-switch']
 }
};

const BLEND_MAP={
 locomotion:['bear','monkey','frogger','crab'],
 acrobatics:['forward-roll','cartwheel-prep'],
 mobility:['cossack','ninety-ninety-switch','deep-squat-pry'],
 strength:['pull-up','planche-lean','split-squat','hollow-body']
};

function protocol(id,energy='steady'){
 const base=PROTOCOLS[id]; if(!base)return null;
 const p={...base};
 if(energy==='gentle'){
   p.sets=Math.max(2,p.sets-1);
   if(p.seconds)p.seconds=Math.max(8,Math.round(p.seconds*.8));
   if(p.reps)p.reps=Math.max(3,Math.round(p.reps*.8));
   p.rest+=15;
 }
 p.energy=energy;
 return p;
}

function dose(p){
 if(!p)return '';
 const amount=p.kind==='reps'?p.reps+(p.perSide?' / side':''):`${p.seconds} sec`;
 return `${p.sets} × ${amount} · rest ${p.rest}s`;
}

function choose(list,count,used,allowRepeat=false){
 const out=[];
 for(const id of list||[]){
   if(out.length>=count)break;
   if(!L.get(id))continue;
   if(!allowRepeat&&used.has(id))continue;
   out.push(id);used.add(id);
 }
 return out;
}

function movementCount(blockId,duration){
 if(blockId==='prime')return duration===25?1:2;
 if(blockId==='skill')return duration===55?2:1;
 if(blockId==='strength')return duration===55?2:1;
 if(blockId==='blend')return duration===55?2:1;
 if(blockId==='range')return 1;
 return 0;
}

function compose(input={}){
 const base=E.compose(input);
 const cfg=MAP[base.primary]||MAP.control;
 const used=new Set();
 const blocks=base.blocks.map(b=>{
   let ids=[];
   const count=movementCount(b.id,base.duration);
   if(b.id==='prime')ids=choose(cfg.prime,count,used);
   else if(b.id==='skill')ids=choose(cfg.skill,count,used);
   else if(b.id==='strength')ids=choose(cfg.strength,count,used);
   else if(b.id==='blend')ids=choose(BLEND_MAP[base.blend]||[],count,used);
   else if(b.id==='range'){ids=choose(cfg.range,count,used);if(ids.length<count)ids=ids.concat(choose(cfg.range,count-ids.length,used,true));}
   const movements=ids.map(id=>{
     const m=L.get(id),p=protocol(id,base.energy);
     return {
       id:m.id,name:m.name,domain:m.domain,level:m.level,objective:m.objective,
       cues:[...m.cues],regression:m.regression,next:m.next,visual:[...m.visual],
       protocol:p,dose:dose(p),
       variation:base.energy==='gentle'?m.regression:m.name,
       success:base.energy==='gentle'
         ?`Use the easier variation and finish every set with control.`
         :`Keep ${m.cues[0].toLowerCase()} and stop before technique deteriorates.`
     };
   });
   return {...b,movements};
 });
 const selected=blocks.flatMap(b=>b.movements);
 return {
   ...base,
   blocks,
   movements:selected,
   movementCount:selected.length,
   totalSets:selected.reduce((n,m)=>n+(m.protocol?.sets||0),0),
   reflection:['Effort 1–10','Control 1–5','Confidence 1–5']
 };
}

return {PROTOCOLS,MAP,BLEND_MAP,compose,protocol,dose};
});