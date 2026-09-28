(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DeMovementPaths=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

const PATHS=[
{
 id:'handstand',name:'Handstand',category:'Balance + Control',accent:'lime',icon:'◒',
 promise:'Build from comfortable hand loading to freestanding inversion and controlled travel.',
 nodes:[
  {id:'wrist-load',name:'Wrist Load Prep',movementId:'wrist-rocks',level:'Foundation',criteria:['Complete 2 × 10 slow wrist rocks with even pressure','Hold a high plank for 20 seconds with stable hands','Finish without sharp or increasing discomfort']},
  {id:'wall-handstand',name:'Wall Handstand',movementId:'wall-handstand',level:'Foundation',criteria:['Accumulate 3 × 30 seconds with calm breathing','Maintain tall shoulders without collapsing','Enter and exit the position under control']},
  {id:'wall-float',name:'Wall Float',level:'Developing',criteria:['Float both heels from the wall for 5 controlled attempts','Hold the free balance for 3–8 seconds when it appears','Return to the wall or floor without a rushed exit']},
  {id:'freestanding-handstand',name:'Freestanding Handstand',level:'Skill',criteria:['Produce 5 controlled entries in one practice','Hold at least 5 seconds with active shoulders','Demonstrate a repeatable safe exit']},
  {id:'handstand-shift',name:'Handstand Weight Shift',level:'Skill+',criteria:['Hold a stable freestanding handstand before shifting','Move weight deliberately from side to side','Complete 5 shifts without collapsing the shoulder line']},
  {id:'handstand-travel',name:'Handstand Travel',level:'Expression',criteria:['Take controlled handstand steps without chasing balance','Stop or exit intentionally','Repeat the pattern on more than one attempt']}
 ]
},
{
 id:'planche',name:'Planche',category:'Straight-Arm Push',accent:'coral',icon:'◆',
 promise:'Develop wrist tolerance, scapular control and progressively stronger forward-lean support.',
 nodes:[
  {id:'scapular-support',name:'Scapular Support',movementId:'scapular-push-up',level:'Foundation',criteria:['Complete 2 × 12 straight-arm scapular push-ups','Keep elbows locked without forcing hyperextension','Maintain a stable trunk through the set']},
  {id:'planche-lean',name:'Planche Lean',movementId:'planche-lean',level:'Foundation+',criteria:['Complete 4 × 15 seconds with controlled protraction','Keep hips and shoulders moving as one unit','Finish every hold before wrist or shoulder position breaks down']},
  {id:'tuck-planche',name:'Tuck Planche',level:'Developing',criteria:['Lift both feet clear with straight elbows','Accumulate 4 controlled holds of 5–8 seconds','Maintain protraction without sinking between shoulders']},
  {id:'advanced-tuck-planche',name:'Advanced Tuck Planche',level:'Skill',criteria:['Extend the hips beyond the basic tuck with control','Accumulate 3 × 6–10 second holds','Keep shoulder position consistent across attempts']},
  {id:'straddle-planche',name:'Straddle Planche',level:'Skill+',criteria:['Open the legs without losing the planche line','Accumulate multiple controlled 3–5 second holds','Exit before form collapses']},
  {id:'full-planche',name:'Full Planche',level:'Expression',criteria:['Reach a straight-body planche position intentionally','Hold with straight elbows and controlled scapular position','Repeat the position across separate attempts']}
 ]
},
{
 id:'front-lever',name:'Front Lever',category:'Straight-Arm Pull',accent:'aqua',icon:'━',
 promise:'Build grip, shoulder depression and lever-body tension from hangs to horizontal pulling shapes.',
 nodes:[
  {id:'active-hang',name:'Active Hang',movementId:'active-hang',level:'Foundation',criteria:['Hold 3 × 20 seconds with long elbows','Keep shoulders drawn away from the ears','Maintain trunk control without swinging']},
  {id:'pull-up',name:'Pull-Up',movementId:'pull-up',level:'Foundation+',criteria:['Complete 3 × 5 clean pull-ups','Use a controlled bottom position','Lower each rep without dropping']},
  {id:'tuck-front-lever',name:'Tuck Front Lever',movementId:'tuck-front-lever',level:'Developing',criteria:['Complete 4 × 8 second tuck-lever holds','Keep hips near shoulder height','Maintain straight arms through the hold']},
  {id:'advanced-tuck-lever',name:'Advanced Tuck Lever',level:'Skill',criteria:['Open the hip angle beyond the basic tuck','Accumulate 3 × 6–10 second holds','Keep the lever line stable without bent-arm pulling']},
  {id:'one-leg-lever',name:'One-Leg / Straddle Lever',level:'Skill+',criteria:['Extend leverage without losing shoulder position','Hold 3–5 seconds on repeated attempts','Control the return to an easier shape']},
  {id:'full-front-lever',name:'Full Front Lever',level:'Expression',criteria:['Reach a straight-body lever intentionally','Maintain straight arms and horizontal body tension','Repeat the position across separate attempts']}
 ]
},
{
 id:'compression',name:'Compression',category:'Core + Hip Flexion',accent:'violet',icon:'⌁',
 promise:'Build active compression from trunk tension through L-sit and press-oriented shapes.',
 nodes:[
  {id:'hollow-body',name:'Hollow Body',movementId:'hollow-body',level:'Foundation',criteria:['Hold 3 × 20 seconds with the lower back controlled','Breathe without losing trunk tension','Finish before the shape turns into a back arch']},
  {id:'pike-lift',name:'Pike Compression Lift',movementId:'pike-compression-lift',level:'Foundation+',criteria:['Complete 3 × 8 controlled lifts','Lift from the hips without bouncing','Keep the torso as tall as the current range allows']},
  {id:'tuck-lsit',name:'Tuck L-Sit',movementId:'tuck-lsit',level:'Developing',criteria:['Hold 4 × 12 seconds with strong support','Keep shoulders pushed down','Lift the knees without collapsing the chest']},
  {id:'full-lsit',name:'Full L-Sit',level:'Skill',criteria:['Straighten both legs without losing support height','Accumulate 3 × 10 second holds','Maintain active compression rather than passive hanging']},
  {id:'v-sit-path',name:'V-Sit Path',level:'Skill+',criteria:['Lift the feet above hip height with control','Maintain support pressure through the hands','Repeat the elevated compression shape without momentum']},
  {id:'press-compression',name:'Press Compression',level:'Expression',criteria:['Demonstrate sufficient active pike compression for press work','Shift weight into the hands without jumping','Control the return from the press preparation']}
 ]
},
{
 id:'locomotion',name:'Ground Locomotion',category:'Travel + Coordination',accent:'aqua',icon:'↝',
 promise:'Expand a ground-movement vocabulary from individual patterns into connected multidirectional travel.',
 nodes:[
  {id:'bear',name:'Bear',movementId:'bear',level:'Foundation',criteria:['Travel for 30 seconds with opposite hand and foot coordination','Move forward and backward without rushing','Keep breathing relaxed through the pattern']},
  {id:'frogger',name:'Frogger',movementId:'frogger',level:'Foundation',criteria:['Complete 3 × 6 quiet controlled repetitions','Shift weight into the hands before the feet move','Land back into a controlled squat']},
  {id:'monkey',name:'Monkey',movementId:'monkey',level:'Developing',criteria:['Travel laterally in both directions','Place the hands before transferring the feet','Land softly without losing the squat position']},
  {id:'crab',name:'Crab',movementId:'crab',level:'Developing',criteria:['Travel for 30 seconds with stable shoulder support','Move in more than one direction','Keep the pattern controlled rather than rushed']},
  {id:'transition-chain',name:'Transition Chain',level:'Skill',criteria:['Connect at least three locomotion patterns without stopping','Change direction deliberately','Keep every transition recognisable and controlled']},
  {id:'continuous-ground-flow',name:'Continuous Ground Flow',level:'Expression',criteria:['Sustain a 60-second ground flow','Use at least four movement patterns','Maintain breathing, rhythm and control throughout']}
 ]
},
{
 id:'soft-acrobatics',name:'Soft Acrobatics',category:'Orientation + Transition',accent:'gold',icon:'✦',
 promise:'Build floor confidence and controlled inversion transitions before adding speed or complexity.',
 nodes:[
  {id:'rock-to-squat',name:'Rock to Squat',movementId:'rock-to-squat',level:'Foundation',criteria:['Rock through the rounded back without loading the head','Return to a balanced squat','Repeat 5 times without using uncontrolled momentum']},
  {id:'forward-roll',name:'Forward Roll',movementId:'forward-roll',level:'Foundation',criteria:['Complete 5 smooth rolls without pressure on the head','Finish each roll balanced','Control the return to standing or squat']},
  {id:'cartwheel-prep',name:'Cartwheel Prep',movementId:'cartwheel-prep',level:'Developing',criteria:['Transfer weight through both hands comfortably','Practise both sides','Keep the landing quiet and controlled']},
  {id:'low-cartwheel',name:'Low Cartwheel',level:'Skill',criteria:['Travel laterally through a clear hand-hand-foot-foot pattern','Keep the movement controlled rather than thrown','Finish facing the opposite direction with balance']},
  {id:'full-cartwheel',name:'Full Cartwheel',level:'Skill+',criteria:['Pass the hips over the hands with a clear inverted line','Demonstrate both a reliable entry and exit','Repeat the skill without rushing the take-off']},
  {id:'acro-flow',name:'Roll + Cartwheel Flow',level:'Expression',criteria:['Connect a roll and cartwheel with a deliberate transition','Maintain orientation throughout the sequence','Complete the flow smoothly on repeated attempts']}
 ]
},
{
 id:'mobility',name:'Ground Range',category:'Mobility + Control',accent:'blue',icon:'◌',
 promise:'Turn passive range into active positions that can be used inside locomotion, skills and floor transitions.',
 nodes:[
  {id:'deep-squat',name:'Deep Squat',movementId:'deep-squat-pry',level:'Foundation',criteria:['Stay in a comfortable squat for 30 seconds with support as needed','Breathe easily in the position','Shift weight gently without losing foot contact']},
  {id:'ninety-ninety',name:'90/90 Hip Switch',movementId:'ninety-ninety-switch',level:'Foundation',criteria:['Complete 2 × 6 controlled switches per side','Move from the hips rather than twisting the knees','Reduce hand support as control improves']},
  {id:'cossack',name:'Cossack Squat',movementId:'cossack',level:'Developing',criteria:['Complete 3 × 5 controlled reps per side','Keep the working foot grounded','Return from the bottom without collapsing inward']},
  {id:'hands-free-9090',name:'Hands-Free 90/90',level:'Skill',criteria:['Transition between sides without hand support','Pause in each end position under control','Repeat the sequence without falling between positions']},
  {id:'squat-cossack-flow',name:'Squat → Cossack Flow',level:'Skill+',criteria:['Move from deep squat into each Cossack side','Keep the transitions slow and recognisable','Complete multiple cycles without forcing range']},
  {id:'integrated-ground-range',name:'Integrated Ground Range',level:'Expression',criteria:['Combine squat, 90/90 and lateral range positions','Move continuously for 60 seconds','Maintain active control rather than passive collapse']}
 ]
}
];

const ACCENTS={lime:'#b8ff56',coral:'#ff7a66',violet:'#b39cff',aqua:'#70e6d2',gold:'#ffd26f',blue:'#77aefc'};
function get(id){return PATHS.find(x=>x.id===id)||null}
function node(pathId,nodeId){const p=get(pathId);return p?.nodes.find(x=>x.id===nodeId)||null}
return {PATHS,ACCENTS,get,node};
});