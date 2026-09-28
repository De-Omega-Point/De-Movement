const assert=require('assert');
const E=require('../engine.js');
const L=require('../movements.js');

const ids=new Set();
for(const m of L.MOVEMENTS){
  assert(m.id&&typeof m.id==='string');
  assert(!ids.has(m.id),'duplicate movement id: '+m.id);ids.add(m.id);
  assert(L.DOMAINS[m.domain],'unknown domain: '+m.domain);
  assert(E.PRIMARY[m.intent],'unknown intent: '+m.intent);
  assert(Array.isArray(m.visual)&&m.visual.length===3,'visual strip must have 3 stages: '+m.id);
  assert(Array.isArray(m.cues)&&m.cues.length>=3,'needs cues: '+m.id);
  assert(Array.isArray(m.mistakes)&&m.mistakes.length>=2,'needs mistakes: '+m.id);
  assert(m.regression&&m.next,'needs progression context: '+m.id);
  assert(m.objective.length>30,'objective too short: '+m.id);
  if(m.reference){
    assert(/^https:\/\//.test(m.reference.url),'reference must be https: '+m.id);
    assert(m.reference.label);
  }
}
assert(L.MOVEMENTS.length>=12);
for(const key of Object.keys(L.DOMAINS)){
  const list=L.filter(key);
  if(key==='all')assert.strictEqual(list.length,L.MOVEMENTS.length);
  else assert(list.every(x=>x.domain===key));
}
console.log('Phase 2 library tests passed:',L.MOVEMENTS.length,'movements');
