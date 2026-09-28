const assert=require('assert');
const E=require('../engine.js');
const L=require('../movements.js');
const C=require('../composer.js');
const R=require('../runner.js');

const primaries=Object.keys(E.PRIMARY);
const blends=Object.keys(E.BLENDS);
const durations=[25,40,55];
const energies=Object.keys(E.ENERGY);

let plans=0;
for(const primary of primaries){
  for(const blend of blends){
    for(const duration of durations){
      for(const energy of energies){
        const p=C.compose({primary,blend,duration,energy});
        assert.strictEqual(p.duration,duration);
        assert(p.movementCount>=4,'too few movements: '+JSON.stringify({primary,blend,duration,energy}));
        assert(p.totalSets>=8,'too few sets');
        assert.strictEqual(p.blocks.reduce((n,b)=>n+b.minutes,0),duration);
        for(const b of p.blocks){
          if(b.id!=='reflect')assert(b.movements.length>=1,'empty block '+b.id+' '+JSON.stringify({primary,blend,duration,energy}));
          for(const m of b.movements){
            assert(L.get(m.id),'unknown movement '+m.id);
            assert(m.protocol&&m.protocol.sets>=2,'missing protocol '+m.id);
            assert(m.dose.length>0,'missing dose '+m.id);
            if(energy==='gentle')assert.strictEqual(m.variation,L.get(m.id).regression);
            else assert.strictEqual(m.variation,L.get(m.id).name);
          }
        }
        const runner=new R.Runner(p);
        let safety=0;
        while(!runner.snapshot().finished&&safety<1000){
          const s=runner.snapshot();
          if(s.phase==='rest')runner.skipRest();
          else runner.completeSet();
          safety++;
        }
        assert(runner.snapshot().finished,'runner failed to finish');
        assert.strictEqual(runner.snapshot().completedSets,p.totalSets);
        plans++;
      }
    }
  }
}

const timed=C.compose({primary:'control',blend:'none',duration:25,energy:'steady'});
const rr=new R.Runner(timed);
const first=rr.current();
if(['hold','time'].includes(first.protocol.kind)){
  rr.start();
  const before=rr.snapshot().remaining;
  rr.tick();
  assert.strictEqual(rr.snapshot().remaining,before-1);
}

console.log('Phase 3 composer tests passed:',plans,'session combinations');
