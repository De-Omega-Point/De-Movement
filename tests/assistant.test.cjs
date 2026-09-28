const assert=require('assert');
const A=require('../assistant-engine.js');
const PP=require('../passport.js');

const now=Date.parse('2026-09-29T00:00:00Z');
const profile={goalPaths:['handstand','locomotion'],daysPerWeek:4,sessionMinutes:40,preferredStyles:['calisthenics','locomotion']};
const history=[
 {id:'a',kind:'session',completedAt:'2026-09-28T10:00:00Z',title:'Hard pull',primary:'strength',blend:'none',energy:'charged',durationMinutes:40,effort:9,control:2,confidence:2,movements:['pull-up'],domains:['calisthenics']},
 {id:'b',kind:'session',completedAt:'2026-09-26T10:00:00Z',title:'Hard push',primary:'strength',blend:'mobility',energy:'charged',durationMinutes:40,effort:9,control:2,confidence:2,movements:['planche-lean'],domains:['calisthenics']},
 {id:'c',kind:'session',completedAt:'2026-09-18T10:00:00Z',title:'Older',primary:'control',blend:'mobility',energy:'steady',durationMinutes:25,effort:5,control:4,confidence:4,movements:['wall-handstand'],domains:['calisthenics']}
];

let evidence={profile,readiness:{energy:2,soreness:4,focus:3,review:true,note:'Shoulder feels different today',checkedAt:'2026-09-28T23:00:00Z'},history,passport:PP.blank(),assignments:[]};
const signals=A.attentionSignals(evidence,now);
assert.strictEqual(signals[0].priority,'review');
assert(/review/i.test(signals[0].title));
assert(signals.some(x=>x.id==='repeated-high-effort'));
assert(signals.some(x=>x.id==='low-control'));
assert(signals.some(x=>x.id==='low-confidence'));

const answer=A.moverAnswer('Why this session?',evidence,now);
assert(answer.title&&answer.evidence.length>=1);
assert(/holding back|suggested|why/i.test(answer.title));

const next=A.moverAnswer('What should I work on next?',evidence,now);
assert(/next capability/i.test(next.title));
assert(/Handstand/i.test(next.answer));

const plan={primary:'strength',movements:[{name:'Planche Lean',regression:'High Plank Lean',objective:'Build straight-arm pushing capacity.'}]};
const easier=A.moverAnswer('Give me an easier option',{...evidence,plan},now);
assert(/High Plank Lean/.test(easier.answer));

const coach=A.coachAnswer('What changed?',evidence,now);
assert.strictEqual(coach.title,'What changed');
assert(Array.isArray(coach.evidence));

const proposal=A.coachAnswer('What could I assign?',{...evidence,readiness:{...evidence.readiness,review:false}},now);
assert(proposal.proposal);
assert(['proposal','review'].includes(proposal.proposal.mode));

const steady=A.attentionSignals({
 profile,
 readiness:{energy:3,soreness:2,focus:3,review:false},
 history:[],
 passport:PP.blank()
},now);
assert.strictEqual(steady[0].id,'steady');

const queue=A.coachQueue([
 {moverId:'1',name:'Needs Review',state:{trainingProfile:profile,readiness:{energy:2,soreness:4,focus:3,review:true,note:'Review'},logs:[],passportState:PP.blank()}},
 {moverId:'2',name:'Steady',state:{trainingProfile:profile,readiness:{energy:3,soreness:2,focus:3,review:false},logs:[],passportState:PP.blank()}}
],now);
assert.strictEqual(queue[0].moverId,'1');
assert(queue[0].priorityRank>queue[1].priorityRank);

console.log('Phase 8 assistant engine tests passed');