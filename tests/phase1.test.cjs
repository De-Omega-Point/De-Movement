const assert=require('assert');
const E=require('../engine.js');

const primaries=Object.keys(E.PRIMARY);
const blends=Object.keys(E.BLENDS);
const durations=[25,40,55];
const energies=Object.keys(E.ENERGY);

let count=0;
for(const primary of primaries){
  for(const blend of blends){
    for(const duration of durations){
      for(const energy of energies){
        const s=E.compose({primary,blend,duration,energy});
        assert(E.PRIMARY[s.primary]);
        assert(E.BLENDS[s.blend]);
        assert(E.ENERGY[s.energy]);
        assert.strictEqual(s.duration,duration);
        assert(s.objective.length>20);
        assert(s.success.length>20);
        assert(s.goals.length===3);
        assert(s.blocks.length>=5);
        assert.strictEqual(s.blocks.reduce((n,b)=>n+b.minutes,0),duration);
        if(primary===blend)assert.strictEqual(s.blend,'none');
        count++;
      }
    }
  }
}
assert.strictEqual(E.compose({primary:'bad',duration:999,energy:'bad'}).primary,'control');
assert.strictEqual(E.compose({primary:'bad',duration:999,energy:'bad'}).duration,40);
assert.strictEqual(E.compose({primary:'bad',duration:999,energy:'bad'}).energy,'steady');
console.log('Phase 1 tests passed:',count,'choice combinations');
