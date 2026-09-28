(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DeMovementLibrary=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

const MOVEMENTS=[
{
 id:'wall-handstand',name:'Wall Handstand',domain:'calisthenics',intent:'control',level:'Foundation',
 objective:'Build inversion confidence, shoulder elevation and a repeatable stacked handstand line.',
 dose:'4 × 20–40 sec',visual:['pike','wallInvert','wallInvertTall'],
 regression:'Elevated A-frame',next:'Wall Float',
 cues:['Push the floor away','Ribs gently down','Keep shoulders tall'],
 mistakes:['Collapsing through shoulders','Over-arching to find the wall'],
 reference:{label:'GMB handstand progression',url:'https://gmb.io/handstand/'}
},
{
 id:'pull-up',name:'Pull-Up',domain:'calisthenics',intent:'strength',level:'Foundation',
 objective:'Build vertical pulling strength with controlled shoulder movement and full-body tension.',
 dose:'3–5 × 3–8 reps',visual:['hang','halfPull','pullTop'],
 regression:'Foot-assisted pull / row',next:'Weighted Pull-Up',
 cues:['Start from an active shoulder','Pull elbows towards ribs','Control the lowering'],
 mistakes:['Kicking for momentum','Losing the bottom position'],
 reference:{label:'GMB exercise tutorials',url:'https://help.gmb.io/article/553-additional-exercise-tutorials-help'}
},
{
 id:'tuck-front-lever',name:'Tuck Front Lever',domain:'calisthenics',intent:'strength',level:'Intermediate',
 objective:'Build straight-arm pulling strength and whole-body tension for lever progressions.',
 dose:'4–5 × 6–12 sec',visual:['hang','tuckLever','tuckLeverLong'],
 regression:'Inverted Row / Lever Tuck Prep',next:'Advanced Tuck Lever',
 cues:['Push the bar down','Round into a strong hollow shape','Keep hips level with shoulders'],
 mistakes:['Bent-arm pulling','Hips dropping below the lever line'],
 reference:{label:'FitnessFAQs front lever tutorial',url:'https://www.youtube.com/watch?v=AGhb8V8M758'}
},
{
 id:'planche-lean',name:'Planche Lean',domain:'calisthenics',intent:'strength',level:'Intermediate',
 objective:'Build straight-arm pushing capacity, wrist tolerance and forward shoulder lean for planche work.',
 dose:'4 × 12–25 sec',visual:['plank','lean','leanLong'],
 regression:'High Plank Lean',next:'Tuck Planche',
 cues:['Lock elbows without hyperextending','Protract shoulder blades','Lean as one unit'],
 mistakes:['Piking hips','Turning the lean into a push-up'],
 reference:{label:'FitnessFAQs planche tutorial',url:'https://www.youtube.com/watch?v=bn-HZm7bpy0'}
},
{
 id:'tuck-lsit',name:'Tuck L-Sit',domain:'calisthenics',intent:'compression',level:'Foundation',
 objective:'Build support strength and active hip compression for L-sits, presses and floor transitions.',
 dose:'4 × 10–20 sec',visual:['support','tuckSit','lSit'],
 regression:'Supported Tuck Hold',next:'Full L-Sit',
 cues:['Push shoulders down','Lift knees using the hips','Keep the chest proud'],
 mistakes:['Sinking between shoulders','Holding breath and shaking past control'],
 reference:{label:'GMB bodyweight progressions',url:'https://gmb.io/progressions/'}
},
{
 id:'bear',name:'Bear',domain:'locomotion',intent:'locomotion',level:'Foundation',
 objective:'Coordinate contralateral movement while loading shoulders and moving the spine through space.',
 dose:'3 × 20–40 sec',visual:['quadruped','bearHigh','bearTravel'],
 regression:'Static Bear Position',next:'Travelling Bear Variations',
 cues:['Move opposite hand and foot','Keep weight distributed through all four points','Let the knees bend if needed'],
 mistakes:['Racing the pattern','Locking the spine rigid'],
 reference:{label:'GMB Bear tutorial',url:'https://gmb.io/bear/'}
},
{
 id:'monkey',name:'Monkey',domain:'locomotion',intent:'locomotion',level:'Foundation',
 objective:'Develop lateral squat mobility, hand support and side-to-side coordination.',
 dose:'3 × 4–8 passes',visual:['squat','monkeyShift','monkeyTravel'],
 regression:'Lateral Squat Shift',next:'Travelling / Stalled Monkey',
 cues:['Hands lead the direction','Shift weight before moving feet','Land softly into the squat'],
 mistakes:['Throwing the legs without control','Forcing squat depth'],
 reference:{label:'GMB locomotion foundations',url:'https://gmb.io/locomotion/'}
},
{
 id:'frogger',name:'Frogger',domain:'locomotion',intent:'locomotion',level:'Foundation',
 objective:'Connect squat mobility with forward hand loading and hip lift.',
 dose:'3 × 5–8 reps',visual:['squat','frogHands','frogLift'],
 regression:'Squat Hand-Shift',next:'High Frogger / Straight-Leg Frogger',
 cues:['Place hands before shifting','Lift hips with control','Keep the landing quiet'],
 mistakes:['Jumping blindly forward','Dumping weight into wrists'],
 reference:{label:'GMB locomotion foundations',url:'https://gmb.io/locomotion/'}
},
{
 id:'crab',name:'Crab',domain:'locomotion',intent:'locomotion',level:'Foundation',
 objective:'Build posterior-chain support, shoulder extension tolerance and belly-up coordination.',
 dose:'3 × 20–40 sec',visual:['crabSit','crabLift','crabTravel'],
 regression:'Static Crab Support',next:'Crab Reach / Travelling Crab',
 cues:['Press the floor away','Keep steps small at first','Move without excessive side sway'],
 mistakes:['Collapsing shoulders','Forcing hip height'],
 reference:{label:'GMB Crab tutorial',url:'https://gmb.io/crab/'}
},
{
 id:'forward-roll',name:'Forward Roll',domain:'acrobatics',intent:'acrobatics',level:'Foundation',
 objective:'Build floor confidence, orientation and a soft pathway from standing towards the ground and back.',
 dose:'5–8 clean reps',visual:['rock','tuckRoll','stand'],
 regression:'Rock to Squat',next:'Roll to Stand',
 cues:['Round the back','Tuck the chin','Finish balanced before repeating'],
 mistakes:['Loading directly onto the head','Rushing the stand-up'],
 reference:null
},
{
 id:'cartwheel-prep',name:'Cartwheel Prep',domain:'acrobatics',intent:'acrobatics',level:'Foundation',
 objective:'Learn lateral hand transfer, weight shift and safe inversion entry before chasing a full cartwheel.',
 dose:'3 × 4–6 / side',visual:['lunge','sideHands','splitInvert'],
 regression:'Lateral Hand Transfer',next:'Low Cartwheel',
 cues:['Reach long through the first hand','Let the hips travel over the hands','Finish facing the opposite direction'],
 mistakes:['Trying to jump high too early','Hands landing too close together'],
 reference:{label:'Handstand bail and lateral inversion context',url:'https://gmb.io/handstand/'}
},
{
 id:'cossack',name:'Cossack Squat',domain:'mobility',intent:'mobility',level:'Foundation',
 objective:'Build active lateral hip range, adductor strength and ankle control.',
 dose:'3 × 5–8 / side',visual:['wideStand','cossackMid','cossackDeep'],
 regression:'Supported Cossack',next:'Loaded / Deeper Cossack',
 cues:['Sit into one hip','Keep the working foot grounded','Own the bottom position before rising'],
 mistakes:['Collapsing the knee inward','Dropping deeper than you can control'],
 reference:null
}
];

const DOMAINS={
 all:{label:'All'},
 calisthenics:{label:'Calisthenics'},
 locomotion:{label:'Locomotion'},
 acrobatics:{label:'Soft Acrobatics'},
 mobility:{label:'Mobility'}
};

function get(id){return MOVEMENTS.find(x=>x.id===id)||null}
function filter(domain='all'){return domain==='all'?[...MOVEMENTS]:MOVEMENTS.filter(x=>x.domain===domain)}
return {MOVEMENTS,DOMAINS,get,filter};
});