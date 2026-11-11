const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('press-lab/index.html'),css=read('press-lab/press-control.css'),script=read('press-lab/press-control.js'),dashboard=read('dashboard.html'),sw=read('sw.js');
for(const id of ['today-content','progress-content','review-content','guide-content','finish-session','export-json','import-json','metric-hold','timer-toggle']){
 assert(page.includes(id)||script.includes(id),'missing Press Control widget '+id);
}
for(const feature of ['nextMorning','pikeReach','compression','boxhold','rir','quality','legacyPressLab','session-note','localStorage']){
 assert(script.includes(feature),'missing performance or recovery feature '+feature);
}
assert(!script.includes("EX('float'"),'unsupported float must not appear in foundation plan');
assert(css.includes('prefers-reduced-motion'));
assert(dashboard.includes('demovement.presscontrol.v2'));
assert(sw.includes("'./press-lab/press-control.js'"));
assert(read('press-lab/classic.html').includes('de-movement-press-lab-v1'),'classic data compatibility missing');
const saved=new Map(),elements=new Map();
function fakeElement(selector){
 if(!elements.has(selector)){
  const e={selector,value:'',textContent:'',innerHTML:'',dataset:{},checked:false,hidden:false,style:{},handlers:{},
   classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn},scrollIntoView(){},focus(){}};
  elements.set(selector,e);
 }
 return elements.get(selector);
}
const tabs=['today','progress','review','guide'].map(t=>({...fakeElement('tab-'+t),dataset:{tab:t}}));
const ctx={
 document:{querySelector:fakeElement,querySelectorAll:selector=>selector==='button[data-tab]'?tabs:[],addEventListener(){}},
 localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
 confirm:()=>true,alert:()=>{throw Error('Unexpected alert')},setInterval:()=>1,clearInterval:()=>{},
 Date,Math,Number,String,JSON,Array,Object,RegExp,parseInt,Blob:class{},URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},
};
vm.runInNewContext(script,ctx,{filename:'press-control.js'});
assert.equal(saved.size,0,'new user must not be assigned invented workouts');
let work=fakeElement('#today-content');
fakeElement('#day-select').handlers.change({target:{value:'monday'}});
assert(work.innerHTML.includes('Chest-to-wall handstand'),'supported foundation drill missing');
work.handlers.change({target:{dataset:{ex:'wall',field:'done'},type:'checkbox',checked:true}});
assert.equal(JSON.parse(saved.get('demovement.presscontrol.v2')).sessions.length,0,'ticking an exercise must not auto-create session');
work.handlers.change({target:{dataset:{ex:'wall',field:'seconds'},type:'number',value:'18'}});
work.handlers.change({target:{dataset:{ex:'wall',field:'sets'},type:'number',value:'3'}});
work.handlers.change({target:{dataset:{ex:'wall',field:'quality'},type:'select-one',value:'good'}});
work.handlers.click({target:{closest:selector=>selector==='#finish-session'?{}:null}});
let state=JSON.parse(saved.get('demovement.presscontrol.v2'));
assert.equal(state.sessions.length,1,'completed press workout not recorded');
assert.equal(state.sessions[0].entries.find(e=>e.id==='wall').seconds,'18');
assert.equal(state.sessions[0].entries.find(e=>e.id==='wall').done,true);
assert.equal(state.sessions[0].entries.find(e=>e.id==='compression').done,false,'unticked work became completed');
assert.equal(state.sessions[0].nextMorning,'pending','next morning should not be assumed healthy');
console.log('Press Control smoke tests passed');
