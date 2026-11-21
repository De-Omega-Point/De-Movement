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
assert(read('account.js').includes("'demovement.presscontrol.v2'")&&read('account.js').includes("'de-movement-press-lab-v1'"),'local account export and wipe must include training records');
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
vm.runInNewContext(script,ctx,{filename:'press-control.js'});
assert.equal(fakeElement('#metric-hold').textContent,'18s','recorded performance did not survive reload');
console.log('Press Control smoke tests passed');

// Exercise identity, not a shared day label, establishes a comparable session.
const entry=(id,extra={})=>({id,done:true,quality:'good',rir:'3',seconds:'20',...extra});
const session=(id,entries,extra={})=>({id,date:'2026-11-01',completedAt:'2026-11-01T12:00:00Z',day:'monday',nextMorning:'baseline',readiness:{symptoms:'baseline'},entries,...extra});
function loadSessions(sessions,tab){
 saved.set('demovement.presscontrol.v2',JSON.stringify({version:2,day:'monday',sessions}));
 vm.runInNewContext(script,ctx,{filename:'press-control.js'});
 tabs.find(t=>t.dataset.tab===tab).handlers.click();
 return fakeElement('#'+tab+'-content').innerHTML;
}
function verdict(a,b){return loadSessions([session('new',a,{completedAt:'2026-11-02T12:00:00Z'}),session('old',b)],'review')}
assert(verdict([entry('warmup')],[entry('pike')]).includes('Maintain and measure'),'different completed exercises must not imply progression');
assert(verdict([entry('wall'),entry('compression')],[entry('wall')]).includes('Maintain and measure'),'partially overlapping sessions must not imply whole-session progression');
assert(verdict([],[]).includes('Maintain and measure'),'empty sessions must not pass via every([])');
assert(verdict([entry('warmup')],[entry('warmup')]).includes('Maintain and measure'),'preparation alone must not imply progression');
assert(verdict([entry('unknown')],[entry('unknown')]).includes('Maintain and measure'),'unknown imported exercises must not establish comparability');
assert(verdict([entry('wall')],[entry('wall')]).includes('Consider one small change'),'matching completed exercises should retain the cautious prompt');
assert(verdict([entry('wall'),entry('compression')],[entry('compression'),entry('wall')]).includes('Consider one small change'),'entry ordering must not change comparability');
assert(verdict([entry('wall'),entry('compression',{done:false})],[entry('wall')]).includes('Consider one small change'),'uncompleted entries must not count as performed work');
assert(verdict([entry('wall',{quality:'poor'})],[entry('wall')]).includes('Maintain and measure'),'technique gate must remain active');
assert(verdict([entry('press',{rir:''})],[entry('press')]).includes('Maintain and measure'),'effort reserve gate must remain active');
assert(loadSessions([session('new',[entry('wall')],{nextMorning:'pending'}),session('old',[entry('wall')])],'review').includes('Maintain and measure'),'pending recovery must not clear progression');
const today=new Date().toISOString().slice(0,10);
assert(loadSessions([session('new',[entry('wall')],{date:today,nextMorning:'worse'}),session('old',[entry('wall')])],'review').includes('Reduce or assess'),'recent adverse recovery must retain priority');

// All five grid lines must span the plot, including flat and singleton series.
for(const values of [[10,20],[20,10],[10,10],[10]]){
 fakeElement('#progress-measure').value='wall';
 const svg=loadSessions(values.map((value,i)=>session('chart-'+i,[entry('wall',{seconds:String(value)})],{date:'2026-11-0'+(i+1)})),'progress');
 const lines=[...svg.matchAll(/<line[^>]*y1="([^"]+)"[^>]*y2="([^"]+)"[^>]*class="chart-grid"/g)];
 assert.equal(lines.length,5);
 const ys=lines.map(m=>Number(m[1]));
 assert.deepEqual(ys,[198,154.3,110.5,66.8,23],'grid ticks must evenly span the plot bounds');
 for(const m of lines){assert.equal(m[1],m[2]);assert(Number(m[1])>=23&&Number(m[1])<=198)}
}
console.log('Press Control regression tests passed');
