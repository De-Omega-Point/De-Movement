const assert=require('assert');
const P=require('../paths.js');
const PP=require('../passport.js');
const F=require('../flow.js');
const L=require('../movements.js');

let passport=PP.blank();

// Fresh Passport should expose only eligible first-node movements that Flow Lab supports.
const fresh=F.eligible(passport);
const freshIds=fresh.map(x=>x.id);
assert(freshIds.includes('bear'));
assert(freshIds.includes('deep-squat-pry'));
assert(freshIds.includes('rock-to-squat'));
assert(!freshIds.includes('frogger'));
assert(!freshIds.includes('forward-roll'));

// Starter flow should be valid on a blank passport.
const starter=F.starter(passport);
assert(starter.length>=2);
assert(starter.every(id=>F.canUse(passport,id)));
let builder=F.normaliseBuilder({sequence:starter,rounds:3,rhythm:'smooth'},passport);
let plan=F.compose(builder,passport);
assert(plan.valid);
assert(plan.movements.length===starter.length);
assert(plan.transitions.length===starter.length-1);
assert(plan.totalSeconds>plan.roundSeconds);
assert(plan.analysis.score>=0&&plan.analysis.score<=100);

// Locked movement injection must be stripped.
const injected=F.normaliseSequence(['frogger','bear','forward-roll'],passport);
assert.deepStrictEqual(injected,['bear']);

// Add/remove/reorder controls.
let seq=[];
seq=F.add(seq,'bear',passport);
seq=F.add(seq,'deep-squat-pry',passport);
seq=F.add(seq,'rock-to-squat',passport);
assert.deepStrictEqual(seq,['bear','deep-squat-pry','rock-to-squat']);
seq=F.move(seq,2,-1,passport);
assert.deepStrictEqual(seq,['bear','rock-to-squat','deep-squat-pry']);
seq=F.remove(seq,1,passport);
assert.deepStrictEqual(seq,['bear','deep-squat-pry']);

// Transition intelligence.
const smooth=F.transition('deep-squat-pry','bear');
assert.strictEqual(smooth.quality,'smooth');
assert(smooth.hint.length>20);
const reset=F.transition('planche-lean','rock-to-squat');
assert(['connected','reset'].includes(reset.quality));

// Unlock second nodes manually through the same Passport governance path.
for(const pathId of ['locomotion','soft-acrobatics','mobility']){
  const path=P.get(pathId);
  const first=path.nodes[0];
  passport=PP.setStatus(passport,pathId,first.id,'practising');
  first.criteria.forEach((_,i)=>passport=PP.setCriterion(passport,pathId,first.id,i,true));
  passport=PP.setStatus(passport,pathId,first.id,'ready');
  passport=PP.setStatus(passport,pathId,first.id,'mastered');
}
assert(F.canUse(passport,'frogger'));
assert(F.canUse(passport,'forward-roll'));
assert(F.canUse(passport,'ninety-ninety-switch'));

// Maximum flow length and no consecutive duplicates.
let long=[];
const pool=F.eligible(passport).map(x=>x.id);
for(let i=0;i<20;i++) long=F.add(long,pool[i%pool.length],passport);
assert(long.length<=F.MAX_MOVES);
for(let i=1;i<long.length;i++) assert.notStrictEqual(long[i],long[i-1]);

// Rhythm should change time without changing eligibility.
const learn=F.compose({sequence:['deep-squat-pry','bear','frogger'],rounds:2,rhythm:'learn'},passport);
const express=F.compose({sequence:['deep-squat-pry','bear','frogger'],rounds:2,rhythm:'express'},passport);
assert(learn.valid&&express.valid);
assert(learn.roundSeconds>express.roundSeconds);

// Timeline and runner must complete exactly.
plan=F.compose({sequence:['deep-squat-pry','bear','frogger'],rounds:3,rhythm:'smooth'},passport);
const timeline=F.timeline(plan);
assert(timeline.length>plan.movements.length);
assert(timeline.some(x=>x.type==='transition'));
assert(timeline.some(x=>x.type==='round-rest'));

const runner=new F.FlowRunner(plan);
runner.start();
let guard=0;
while(!runner.snapshot().finished&&guard<10000){runner.tick();guard++}
assert(runner.snapshot().finished);
assert.strictEqual(runner.snapshot().progress,100);
assert(guard>0&&guard<=plan.totalSeconds+5);

// Every flow META movement must exist and reference a real Passport node.
for(const [id,meta] of Object.entries(F.META)){
  assert(L.get(id),'missing movement '+id);
  assert(P.node(meta.pathId,meta.nodeId),'missing passport node '+id);
}

console.log('Phase 5 Flow Lab tests passed:',Object.keys(F.META).length,'flow movements /',timeline.length,'timeline steps');
