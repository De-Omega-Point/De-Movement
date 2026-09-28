const assert=require('assert');
const D=require('../training-data.js');
const I=require('../training-intelligence.js');

const profile=D.normaliseProfile({goalPaths:['handstand','planche','front-lever','mobility'],daysPerWeek:99,sessionMinutes:55,preferredStyles:['calisthenics','locomotion','bad']});
assert.deepStrictEqual(profile.goalPaths,['handstand','planche','front-lever']);
assert.strictEqual(profile.daysPerWeek,7);
assert.strictEqual(profile.sessionMinutes,55);
assert.deepStrictEqual(profile.preferredStyles,['calisthenics','locomotion']);

const readiness=D.normaliseReadiness({energy:0,soreness:9,focus:3,review:false,note:'x'});
assert.strictEqual(readiness.energy,1);
assert.strictEqual(readiness.soreness,5);
assert.strictEqual(readiness.focus,3);

const now=Date.parse('2026-09-29T00:00:00Z');
const history=[
 {id:'a',kind:'session',completedAt:'2026-09-28T12:00:00Z',title:'Strength',primary:'strength',blend:'mobility',energy:'charged',durationMinutes:55,effort:9,control:3,confidence:3,movements:['pull-up'],domains:['calisthenics']},
 {id:'b',kind:'session',completedAt:'2026-09-27T12:00:00Z',title:'Strength',primary:'strength',blend:'locomotion',energy:'steady',durationMinutes:40,effort:7,control:2,confidence:2,movements:['planche-lean'],domains:['calisthenics']},
 {id:'c',kind:'flow',completedAt:'2026-09-25T12:00:00Z',title:'Flow',primary:'locomotion',blend:'mobility',energy:'steady',durationMinutes:12,effort:5,control:4,confidence:4,movements:['bear'],domains:['locomotion','mobility']},
 {id:'old',kind:'session',completedAt:'2026-09-10T12:00:00Z',title:'Old',primary:'control',blend:'none',energy:'steady',durationMinutes:40,effort:6,control:4,confidence:4,movements:['wall-handstand'],domains:['calisthenics']}
];

const exp=I.exposure(history,7,now);
assert(exp.strength>2);
assert(exp.locomotion>1);
assert(exp.mobility>1);
assert(exp.control<1);

const rec=I.recommendation({
 profile:{goalPaths:['planche','front-lever','mobility'],daysPerWeek:4,sessionMinutes:55,preferredStyles:['calisthenics','mobility']},
 readiness:{energy:2,soreness:4,focus:3,review:false},
 history,now
});
assert.strictEqual(rec.mode,'train');
assert.strictEqual(rec.energy,'gentle');
assert(rec.duration<=55);
assert(rec.reasons.length>=2);
assert(rec.exposure.strength>0);

const charged=I.recommendation({
 profile:{goalPaths:['handstand'],daysPerWeek:4,sessionMinutes:40,preferredStyles:['calisthenics']},
 readiness:{energy:5,soreness:1,focus:5,review:false},
 history:[],
 now
});
assert.strictEqual(charged.mode,'train');
assert.strictEqual(charged.energy,'charged');
assert.strictEqual(charged.primary,'control');
assert(charged.reasons.some(x=>/handstand/i.test(x)));

const review=I.recommendation({
 profile:D.profileBlank(),
 readiness:{energy:3,soreness:2,focus:3,review:true},
 history:[],now
});
assert.strictEqual(review.mode,'review');
assert.strictEqual(review.primary,null);
assert(review.reasons.some(x=>/review/i.test(x)));

const week=I.weekly(history,now);
assert.strictEqual(week.sessions,3);
assert.strictEqual(week.minutes,107);
assert(week.effort>0&&week.control>0&&week.confidence>0);

let list=[];
const added=D.addLog(list,{kind:'flow',completedAt:'2026-09-29T00:00:00Z',title:'Test flow',durationMinutes:10,effort:5,control:4,confidence:4,movements:['bear'],domains:['locomotion']});
assert.strictEqual(added.history.length,1);
assert.strictEqual(added.item.kind,'flow');

console.log('Phase 6 personalisation tests passed');
