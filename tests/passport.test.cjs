const assert=require('assert');
const P=require('../paths.js');
const L=require('../movements.js');
const PP=require('../passport.js');

const pathIds=new Set();
let nodeCount=0;
for(const path of P.PATHS){
  assert(path.id&&path.name&&path.category);
  assert(!pathIds.has(path.id),'duplicate path: '+path.id);pathIds.add(path.id);
  assert(path.nodes.length>=5,'path too short: '+path.id);
  const nodeIds=new Set();
  path.nodes.forEach((node,i)=>{
    nodeCount++;
    assert(node.id&&node.name&&node.level);
    assert(!nodeIds.has(node.id),'duplicate node '+node.id+' in '+path.id);nodeIds.add(node.id);
    assert(Array.isArray(node.criteria)&&node.criteria.length>=3,'missing criteria '+path.id+'/'+node.id);
    assert(node.criteria.every(x=>typeof x==='string'&&x.length>15),'weak criterion '+path.id+'/'+node.id);
    if(node.movementId)assert(L.get(node.movementId),'broken movement ref '+node.movementId);
  });
}

let state=PP.blank();
const summary0=PP.summary(state);
assert.strictEqual(summary0.available,P.PATHS.length,'first node of every path should be available');
assert.strictEqual(summary0.mastered,0);

for(const path of P.PATHS){
  const first=path.nodes[0],second=path.nodes[1];
  assert.strictEqual(PP.effectiveStatus(state,path.id,first.id),'available');
  assert.strictEqual(PP.effectiveStatus(state,path.id,second.id),'locked');
  assert.throws(()=>PP.setStatus(state,path.id,second.id,'practising'),/prerequisite/i);

  state=PP.setStatus(state,path.id,first.id,'practising');
  assert.strictEqual(PP.effectiveStatus(state,path.id,first.id),'practising');
  assert.throws(()=>PP.setStatus(state,path.id,first.id,'ready'),/checklist/i);

  first.criteria.forEach((_,i)=>{state=PP.setCriterion(state,path.id,first.id,i,true)});
  assert(PP.criteriaMet(state,path.id,first.id));
  state=PP.setStatus(state,path.id,first.id,'ready');
  assert.strictEqual(PP.effectiveStatus(state,path.id,first.id),'ready');
  state=PP.setStatus(state,path.id,first.id,'mastered');
  assert.strictEqual(PP.effectiveStatus(state,path.id,first.id),'mastered');
  assert.strictEqual(PP.effectiveStatus(state,path.id,second.id),'available');

  state=PP.setStatus(state,path.id,second.id,'practising');
  state=PP.setStatus(state,path.id,first.id,'practising');
  assert.strictEqual(PP.effectiveStatus(state,path.id,second.id),'locked','reassessment must lock later nodes');

  state=PP.resetPath(state,path.id);
  assert.strictEqual(PP.effectiveStatus(state,path.id,first.id),'available');
  assert.strictEqual(PP.progress(state,path.id).mastered,0);
}

const clean=PP.normalise({statuses:{nonsense:{x:'mastered'}},criteria:{bad:{y:[999]}}});
assert.strictEqual(PP.summary(clean).total,nodeCount);

console.log('Phase 4 passport tests passed:',P.PATHS.length,'paths /',nodeCount,'nodes');
