(function(){
'use strict';
const KEY='demovement.presscontrol.v2', LEGACY='de-movement-press-lab-v1';
const $=s=>document.querySelector(s), all=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const localDate=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())};
const dateLabel=v=>{if(!/^\d{4}-\d\d-\d\d$/.test(v||''))return 'Unknown date';return new Date(v+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})};
const EX=(id,name,dose,kind,cue,easier,gym)=>({id,name,dose,kind,cue,easier,gym:gym||'Same exercise'});
const PLAN={
 monday:{name:'Alignment + compression',focus:'Skill + overhead strength',minutes:55,ex:[
 EX('warmup','Wrist, shoulder and crawling preparation','8 min','prep','Controlled wrist rocks, scapular push-ups and floor transitions.','Shorten or reduce wrist angle.'),
 EX('wall','Chest-to-wall handstand','3 × 10–20 sec','hold','Straight elbows, push tall, maintain a safe reverse wall-walk exit.','Box-supported pike hold.'),
 EX('shift','Box-supported pike weight shifts','3 × 5','reps','Keep feet supported and shift shoulders a small, comfortable distance.','Floor downward-dog weight shifts.'),
 EX('compression','Seated pike compression lifts','3 × 6–10','reps','Sit tall, exhale as heels rise; avoid rocking backwards.','Bend knees or raise hands on blocks.'),
 EX('press','Dumbbell overhead press','3 × 8','reps','Keep ribs stacked and finish with 2–3 good repetitions in reserve.','Light seated dumbbell press.','Dumbbell / shoulder press machine'),
 EX('row','Row','3 × 10','reps','Control shoulder blades and lower slowly.','Band or inverted row.','Cable or chest-supported row'),
 EX('pike','Comfortable seated pike fold','2 × 30 sec','hold','Hinge from hips; no aggressive forced stretch.','Sit on a folded towel.') ]},
 wednesday:{name:'Pulling + lower-body capacity',focus:'Strength / low wrist load',minutes:50,ex:[
 EX('warmup','Balance and controlled floor transitions','8 min','prep','Move gently, keep shoulders comfortable.','Supported balance.'),
 EX('compression','Light seated compression','2 × 8','reps','Use the same hip position each test.','Lift one leg at a time.'),
 EX('pull','Lat pulldown / assisted pull-up','3 × 6–10','reps','Full comfortable range, no swinging.','Light cable pulldown.','Lat pulldown machine'),
 EX('row','Chest-supported row','2 × 10','reps','No excessive lumbar movement.','Light resistance band row.','Chest-supported row machine'),
 EX('hinge','Romanian deadlift','3 × 8','reps','Push hips backwards with controlled lowering.','Unweighted hip hinge.','Barbell or dumbbells'),
 EX('split','Split squat','2 × 8 each leg','reps','Knee tracks comfortably; use rail support as needed.','Supported shorter-range split squat.','Leg press'),
 EX('pike','Supported hamstring / pike mobility','2 × 30 sec','hold','Choose a gentle stretch, normal breathing.','Bent-knee seated pike.') ]},
 friday:{name:'Supported press mechanics',focus:'Skill + shoulder control',minutes:55,ex:[
 EX('warmup','Wrist, shoulder and scapular preparation','8 min','prep','Stay in a comfortable range before loading.','Wall-supported preparation.'),
 EX('boxhold','Box-supported pike hold','3 × 15–25 sec','hold','Stable low box, straight arms, elevated shoulders, feet remain supported.','Floor downward dog.'),
 EX('shift','Box-supported pike weight shifts','3 × 5','reps','Small controlled transfers with the feet fully supported.','Floor pike weight shifts.'),
 EX('compression','Seated pike compression lifts','3 × 8','reps','Maintain tall posture and straight knees within your controlled range.','Bent-knee holds or single-leg lifts.'),
 EX('pikepush','Incline pike push-up','3 × 5–8','reps','Keep shoulders controlled; stop short of form loss.','Elevated hands / shorter range.'),
 EX('serratus','Serratus wall slides','2 × 10','reps','Slide overhead while keeping ribs down.','Lower range wall slide.','Cable serratus reach'),
 EX('hollow','Hollow-body hold','3 × 20 sec','hold','Keep lower back controlled, breathe.','Tucked hollow hold.'),
 EX('pike','Comfortable pike stretch','2 × 40 sec','hold','Relax into the stretch without bouncing.','Bent-knee pike.') ]},
 sunday:{name:'Legs + mobility / recovery',focus:'Lower-body strength + range',minutes:50,ex:[
 EX('warmup','Walking, balance and easy floor transitions','8 min','prep','Gentle wrist and shoulder movement; no hard hand balancing.','Easy walking.'),
 EX('squat','Squat or leg press','3 × 8–10','reps','Controlled descent, pain-free range.','Supported box squat.','Leg press'),
 EX('bridge','Glute bridge','2 × 12','reps','Lift pelvis without over-arching.','Shorter-range bridge.','Hip thrust machine'),
 EX('calf','Slow calf raises','3 × 12','reps','Pause briefly at the top and lower under control.','Double-leg calf raise holding a rail.','Calf raise machine'),
 EX('carry','Suitcase carry','2 × 30 m each side','reps','Walk tall and avoid side leaning.','Light grocery-bag carry.','Dumbbells / kettlebells'),
 EX('compression','Light seated pike compression','2 × 6','reps','Gentle range and smooth lift.','Single-leg knee-bent lift.'),
 EX('mobility','Pike, hips and overhead shoulder mobility','8–12 min','hold','Comfortable holds, slow breathing.','Reduce the stretch range.') ]},
 optional:{name:'Optional easy movement',focus:'Recovery, not another hard session',minutes:30,ex:[
 EX('walk','Easy walk or cycle','20–30 min','prep','Conversation pace. Stop before fatigue.','Short easy walk.'),
 EX('mobility','Gentle hips, pike, shoulders and wrists','5–10 min','prep','Finish feeling fresher than you started.','Shorter mobility practice.') ]}
};
const GATES=[
'3 × 20–30-sec supported wall handstand holds with a safe exit',
'3 × 20–30-sec box pike holds with consistent shoulder position',
'3 × 5 controlled feet-supported pike weight shifts',
'3 × 8 controlled seated compression lifts, or documented regression',
'Wrists and shoulders back to usual baseline the next morning',
'Two comparable sessions with reliable technique and suitable effort reserve'
];
const readKey=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
function empty(){return {version:2,day:'monday',drafts:{},sessions:[],gates:{},createdAt:new Date().toISOString()}}
function normalise(raw){const x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};return {version:2,day:PLAN[x.day]?x.day:'monday',drafts:x.drafts&&typeof x.drafts==='object'&&!Array.isArray(x.drafts)?x.drafts:{},sessions:Array.isArray(x.sessions)?x.sessions.filter(s=>s&&typeof s==='object'&&PLAN[s.day]&&/^\d{4}-\d\d-\d\d$/.test(s.date||'')).slice(0,1500):[],gates:x.gates&&typeof x.gates==='object'&&!Array.isArray(x.gates)?x.gates:{},createdAt:typeof x.createdAt==='string'?x.createdAt:new Date().toISOString()}}
let store=normalise(readKey(KEY)||empty()),day=store.day,date=localDate(),tab='today';
function persist(){store.day=day;try{localStorage.setItem(KEY,JSON.stringify(store));$('#save-status').textContent='Saved on this device ✓';return true}catch(e){$('#save-status').textContent='Storage error: export a backup';return false}}
function draftKey(){return date+'|'+day}
function draft(){const k=draftKey();if(!store.drafts[k])store.drafts[k]={readiness:'clear',energy:'3',sleep:'3',symptoms:'baseline',notes:'',pikeReach:'',entries:{}};return store.drafts[k]}
function fmt(n,digits=0){return Number.isFinite(n)?n.toFixed(digits):'—'}
function metric(exid,field){const n=store.sessions.flatMap(s=>(Array.isArray(s.entries)?s.entries:[]).filter(e=>e.id===exid&&e.done).map(e=>Number(e[field]))).filter(n=>Number.isFinite(n)&&n>0);return n.length?Math.max(...n):null}
function recentSessions(days=7){const cutoff=Date.now()-days*86400000;return store.sessions.filter(s=>{const n=Date.parse(s.date+'T12:00:00');return Number.isFinite(n)&&n>=cutoff&&n<=Date.now()+86400000})}
function updateMetrics(){
 const n=recentSessions(7).filter(s=>s.day!=='optional').length;
 $('#metric-sessions').innerHTML=n+' <span>/ 4</span>';
 $('#metric-hold').textContent=metric('wall','seconds')!==null?fmt(metric('wall','seconds'))+'s':'—';
 $('#metric-compression').textContent=metric('compression','reps')!==null?fmt(metric('compression','reps')):'—';
 const s=store.sessions.slice().sort((a,b)=>Date.parse(b.completedAt||b.date)-Date.parse(a.completedAt||a.date))[0];
 const statuses={baseline:'Back to baseline',worse:'Reduce load',concern:'Needs review',pending:'Pending'};
 const recovery=s?statuses[s.nextMorning]||'Pending':'Unlogged';$('#metric-recovery').textContent=recovery;
 $('#metric-recovery').style.color=s&&['worse','concern'].includes(s.nextMorning)?'var(--amber)':'var(--lime)';
}
function setTab(next){if(!['today','progress','review','guide'].includes(next))return;tab=next;
 all('[role="tab"][data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('selected',active);b.setAttribute('aria-selected',String(active))});
 ['today','progress','review','guide'].forEach(t=>{$('#panel-'+t).hidden=t!==tab});
 renderCurrent();
 if(tab!=='today')$('#panel-'+tab).scrollIntoView({block:'start',behavior:'smooth'});
}
function exerciseForm(ex,i,d){
 const x=d.entries[ex.id]||{};
 const input=(f,label,type='number',placeholder='')=>'<label>'+label+'<input type="'+type+'" data-ex="'+esc(ex.id)+'" data-field="'+f+'" min="0" '+(f==='kg'||f==='rir'?'step="0.5"':'step="1"')+' placeholder="'+esc(placeholder)+'" value="'+esc(x[f]||'')+'"></label>';
 return '<article class="exercise-card"><div class="exercise-header"><input aria-label="Completed '+esc(ex.name)+'" type="checkbox" class="check" data-ex="'+esc(ex.id)+'" data-field="done" '+(x.done?'checked':'')+'><div class="exercise-title"><b>'+(i+1)+'. '+esc(ex.name)+'</b><small>Plan: '+esc(ex.dose)+' · '+esc(ex.kind==='hold'?'hold / seconds':ex.kind==='reps'?'repetitions':'preparation')+'</small></div><span class="pill">'+esc(ex.kind)+'</span></div><div class="exercise-fields">'+input('sets','Sets','number','0')+input('reps','Reps','number','0')+input('seconds','Hold sec','number','0')+input('kg','Load kg','number','0')+input('rir','Reps in reserve','number','2–3')+'<label>Technique<select data-ex="'+esc(ex.id)+'" data-field="quality"><option value="">Not rated</option><option value="good" '+(x.quality==='good'?'selected':'')+'>Controlled</option><option value="modified" '+(x.quality==='modified'?'selected':'')+'>Modified</option><option value="poor" '+(x.quality==='poor'?'selected':'')+'>Control lost</option></select></label></div><details><summary>Setup, cue and alternatives</summary><p><strong>Technique:</strong> '+esc(ex.cue)+'</p><p><strong>Easier:</strong> '+esc(ex.easier)+'</p><p><strong>Gym:</strong> '+esc(ex.gym)+'</p></details></article>';
}
function renderToday(){
 $('#day-select').innerHTML=Object.keys(PLAN).map(k=>'<option value="'+k+'" '+(k===day?'selected':'')+'>'+k.charAt(0).toUpperCase()+k.slice(1)+'</option>').join('');
 const p=PLAN[day],d=draft(),count=p.ex.filter(e=>d.entries[e.id]&&d.entries[e.id].done).length;
 $('#today-content').innerHTML='<div class="layout-two"><section class="panel"><div class="panel-top"><div><p class="kicker">SESSION PLAN</p><h3>'+esc(p.name)+'</h3><p class="subtle">'+esc(p.focus)+' · about '+p.minutes+' minutes</p></div><span class="pill">'+count+' / '+p.ex.length+' checked</span></div><div class="bar-track"><div class="bar-fill" style="width:'+(100*count/p.ex.length)+'%"></div></div><div class="form-grid"><label>Date<input type="date" id="workout-date" value="'+esc(date)+'"></label><label>Energy (1–5)<select data-ready="energy">'+[1,2,3,4,5].map(n=>'<option '+(Number(d.energy)===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Sleep/readiness (1–5)<select data-ready="sleep">'+[1,2,3,4,5].map(n=>'<option '+(Number(d.sleep)===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Training decision<select data-ready="readiness"><option value="clear" '+(d.readiness==='clear'?'selected':'')+'>Normal plan</option><option value="light" '+(d.readiness==='light'?'selected':'')+'>Lighten today</option><option value="rest" '+(d.readiness==='rest'?'selected':'')+'>Rest instead</option></select></label></div><label class="field">Wrist/shoulder response<select data-ready="symptoms"><option value="baseline" '+(d.symptoms==='baseline'?'selected':'')+'>Usual baseline</option><option value="changed" '+(d.symptoms==='changed'?'selected':'')+'>Mild change · review tomorrow</option><option value="stop" '+(d.symptoms==='stop'?'selected':'')+'>Concerning symptoms · stop provoking exercise</option></select></label>'+(d.readiness==='rest'||d.symptoms==='stop'?'<div class="callout warning-callout"><strong>Adjust training.</strong> Rest if unwell or too sleepy to train safely. Stop an exercise that causes sharp/escalating pain, weakness, numbness or swelling; seek assessment if needed.</div>':'<p class="subtle">Warm up first. Keep demanding sets 2–3 good repetitions from failure, and finish skill practice before technique deteriorates.</p>')+'</section><aside class="panel"><p class="kicker">TODAY’S NON-NEGOTIABLES</p><h3>Control before intensity.</h3><div class="stats-line"><span class="pill ok">Feet supported</span><span class="pill">Safe exit</span><span class="pill">No forced stretch</span></div><p class="subtle">Demonstrate a stable variation. A completed tick records activity, not mastery. Sessions can be finished with modifications.</p><p class="callout">Start with readiness, then fresh supported skill practice, strength, mobility and a technique note.</p></aside></div><section class="panel"><div class="panel-top"><div><p class="kicker">EXERCISE LOGGER</p><h3>Record the work you actually completed.</h3><p class="subtle">Tick performed exercises and enter actual sets, reps, holds, kilograms and movement quality. Unticked work does not count.</p></div><span class="pill">'+esc(p.focus)+'</span></div>'+p.ex.map((e,i)=>exerciseForm(e,i,d)).join('')+'<div class="form-grid"><label>Seated pike gap to toes, cm (optional)<input data-ready="pikeReach" type="number" step="0.5" placeholder="0 = fingertips reach toes" value="'+esc(d.pikeReach||'')+'"></label></div><p class="muted-line">Pike gap: positive = fingertips short of toes; 0 = toes reached; negative = beyond toes. Use the same test setup each time.</p><label class="field">Technique, symptoms and equipment notes<textarea id="session-note" maxlength="1200" placeholder="What was controlled? What did you modify?">'+esc(d.notes)+'</textarea></label><div class="session-footer"><p>Saved drafts stay on this device. Only pressing “Complete & save session” adds a historical workout.</p><button type="button" class="primary" id="finish-session">Complete & save session →</button></div></section>';
}
function completeSession(){
 const d=draft(),plan=PLAN[day],entries=plan.ex.map(e=>({id:e.id,name:e.name,done:!!d.entries[e.id]?.done,sets:String(d.entries[e.id]?.sets||''),reps:String(d.entries[e.id]?.reps||''),seconds:String(d.entries[e.id]?.seconds||''),kg:String(d.entries[e.id]?.kg||''),rir:String(d.entries[e.id]?.rir||''),quality:String(d.entries[e.id]?.quality||'')}));
 const done=entries.filter(e=>e.done).length;
 if(!done){alert('Tick at least one exercise actually completed. A planned workout is not a completed session.');return}
 if(d.readiness==='rest'||d.symptoms==='stop'){if(!confirm('You marked rest or concerning symptoms. Record the exercises already completed? This is not clearance to continue training.'))return}
 const session={id:'pc-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),date,day,completedAt:new Date().toISOString(),entries,readiness:{energy:d.energy,sleep:d.sleep,decision:d.readiness,symptoms:d.symptoms},notes:String(d.notes||'').slice(0,1200),pikeReach:d.pikeReach===''?'':String(d.pikeReach),nextMorning:'pending'};
 store.sessions.unshift(session);delete store.drafts[draftKey()];
 if(!persist()){store.sessions.shift();store.drafts[draftKey()]=d;alert('Unable to save on this device. Free storage or export a backup before continuing.');return}
 updateMetrics();setTab('progress');$('#save-status').textContent='Session recorded · '+dateLabel(date);
}
function seriesFor(id,field){
 let arr=store.sessions.slice().sort((a,b)=>a.date.localeCompare(b.date));
 const out={};for(const s of arr){let nums=id==='pikeReach'?((s.pikeReach!==''&&s.pikeReach!==undefined&&Number.isFinite(Number(s.pikeReach)))?[Number(s.pikeReach)]:[]):(Array.isArray(s.entries)?s.entries:[]).filter(e=>e.id===id&&e.done&&e[field]!==''&&Number.isFinite(Number(e[field]))&&Number(e[field])>0).map(e=>Number(e[field]));
 if(!nums.length)continue;const value=id==='pikeReach'?nums[0]:Math.max(...nums);out[s.date]=out[s.date]===undefined?value:(id==='pikeReach'?value:Math.max(out[s.date],value));
 }
 return Object.keys(out).sort().map(x=>({date:x,value:out[x]})).slice(-12);
}
function chartSvg(points,label){
 if(!points.length)return '<div class="empty"><strong>Nothing recorded yet.</strong>Complete sessions with actual measurements to build this chart.</div>';
 const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value)),lo=min===max?min-1:min-(max-min)*.12,hi=min===max?max+1:max+(max-min)*.16,W=660,H=240,L=60,R=20,T=23,B=42,ww=W-L-R,hh=H-T-B;
 const x=i=>L+(points.length===1?ww/2:i*ww/(points.length-1)),y=v=>T+(hi-v)/(hi-lo)*hh;
 const line=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.value).toFixed(1)).join(' ');
 let grid='';for(let i=0;i<=4;i++){const n=lo+(hi-lo)*i,yy=y(n);grid+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy.toFixed(1)+'" y2="'+yy.toFixed(1)+'" class="chart-grid"/><text x="'+(L-9)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end" class="chart-label">'+esc(fmt(n,1))+'</text>'}
 const marks=points.map((p,i)=>'<circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.value).toFixed(1)+'" r="5" class="chart-dot"><title>'+esc(dateLabel(p.date)+': '+p.value+' '+label)+'</title></circle>').join('');
 const shown=points.map((p,i)=>i===0||i===points.length-1||points.length<5||i%3===0?'<text x="'+x(i).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle" class="chart-date">'+esc(p.date.slice(5).split('-').reverse().join('/'))+'</text>':'').join('');
 return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(label)+' measured across '+points.length+' recorded dates">'+grid+'<path d="'+line+'" class="chart-line"/>'+marks+shown+'</svg>';
}
function weekGroups(){
 const today=new Date(localDate()+'T12:00:00');const weekday=(today.getDay()+6)%7;today.setDate(today.getDate()-weekday);
 const weeks=[];for(let i=5;i>=0;i--){const from=new Date(today);from.setDate(today.getDate()-7*i);const to=new Date(from);to.setDate(from.getDate()+7);const n=store.sessions.filter(s=>{const ds=new Date(s.date+'T12:00:00');return ds>=from&&ds<to&&s.day!=='optional'}).length;weeks.push({name:from.toLocaleDateString('en-AU',{day:'numeric',month:'short'}),n})}return weeks;
}
function renderProgress(){
 const legacy=readKey(LEGACY),legacyCount=legacy&&legacy.logs&&typeof legacy.logs==='object'?Object.values(legacy.logs).filter(x=>x&&x.done).length:0;
 const options=[['wall','seconds','Wall handstand hold (seconds)'],['boxhold','seconds','Box-supported pike hold (seconds)'],['shift','reps','Supported weight shifts (reps)'],['compression','reps','Seated compression lifts (reps)'],['pikeReach','value','Pike gap to toes (cm)']];
 const id=$('#progress-measure')?.value||'wall';
 const current=options.find(x=>x[0]===id)||options[0],points=seriesFor(current[0],current[1]),week=weekGroups();
 const summary=points.length?'Latest recorded: '+points[points.length-1].value+' · '+dateLabel(points[points.length-1].date):'No baseline recorded';
 $('#progress-content').innerHTML='<div class="layout-two"><section class="panel"><p class="kicker">MEASUREMENT TREND</p><h3>Press performance</h3><label class="field" style="margin:15px 0">What to compare<select id="progress-measure">'+options.map(o=>'<option value="'+o[0]+'" '+(current[0]===o[0]?'selected':'')+'>'+esc(o[2])+'</option>').join('')+'</select></label><div class="chart-wrap">'+chartSvg(points,current[2])+'</div><p class="subtle">'+esc(summary)+'</p></section><aside class="panel"><p class="kicker">CONSISTENCY</p><h3>Training over six weeks</h3><p class="subtle">Number of recorded main sessions against the four-session weekly plan. More than four recordings may include additional sessions.</p><div class="mini-bars">'+week.map(x=>'<div class="mini-col"><div class="bar-shell"><div class="fill" style="height:'+Math.min(100,x.n/4*100)+'%"></div></div><strong>'+x.n+'</strong>'+esc(x.name)+'</div>').join('')+'</div><div class="callout">These graphs show completed entries. Good progression also requires technique quality and next-morning recovery.</div></aside></div><section class="panel"><p class="kicker">HISTORY</p><h3>Recorded press sessions</h3>'+(!store.sessions.length?'<div class="empty"><strong>Baseline pending</strong>Complete your first workout to begin your record.</div>':store.sessions.slice(0,12).map(s=>'<div class="review-row"><div class="review-meta"><strong>'+esc(dateLabel(s.date))+' · '+esc(PLAN[s.day].name)+'</strong><span class="pill">'+(s.entries||[]).filter(e=>e.done).length+' exercises</span></div><div class="subtle">'+esc(s.notes||'No technique notes')+'</div></div>').join(''))+'</section><section class="panel"><p class="kicker">DATA CONTINUITY</p><h3>Original Press Lab: '+legacyCount+' checked exercise entries</h3><p class="subtle">Your original 12-week records remain untouched. They do not have reliable completion dates or standardised press performance measurements, so we keep them separate from the new dated charts instead of inventing data.</p><a href="classic.html">Open original Press Lab ↗</a></section>';
}
function reviewVerdict(){
 const last=store.sessions.slice().sort((a,b)=>Date.parse(b.completedAt||b.date)-Date.parse(a.completedAt||a.date));
 if(!last.length)return ['No recordings yet','Complete and log your first supported session. No readiness judgment is possible before you have comparable results.',''];
 if(last.some(s=>['worse','concern'].includes(s.nextMorning)&&Date.parse(s.date+'T12:00:00')>=Date.now()-10*86400000))return ['Reduce or assess','Recent next-morning recovery was worse or needs review. Reduce the provoking load and assess before progressing.','warning'];
 const same=last.filter(s=>s.day===last[0].day).slice(0,2);
 const good=s=>s.nextMorning==='baseline'&&s.readiness?.symptoms==='baseline'&&(s.entries||[]).filter(e=>e.done).every(e=>e.quality==='good'&&(e.id==='press'||e.id==='pikepush'||e.id==='row'||e.id==='pull'||e.id==='hinge'||e.id==='squat'?e.rir!==''&&Number(e.rir)>=2:true));
 if(same.length===2&&same.every(good))return ['Consider one small change','Two comparable '+PLAN[last[0].day].name+' sessions show controlled logged technique and recovery to baseline. Review support, wrist tolerance and safe exit before making any small assisted progression.','ok'];
 return ['Maintain and measure','Keep the current supported variation. Log next-morning recovery and controlled technique on two comparable sessions before considering an increase.',''];
}
function renderReview(){
 const [title,reason,tone]=reviewVerdict();const latest=store.sessions.slice().sort((a,b)=>Date.parse(b.completedAt||b.date)-Date.parse(a.completedAt||a.date)).slice(0,8);
 $('#review-content').innerHTML='<section class="panel"><p class="kicker">YOUR CURRENT ADJUSTMENT RULE</p><h3>'+esc(title)+'</h3><div class="callout '+(tone==='warning'?'warning-callout':'')+'">'+esc(reason)+'</div><p class="subtle">This is a conservative coaching prompt, not a diagnosis or automatic unlock. A sharp or escalating symptom, swelling, weakness or numbness requires stopping the provoking exercise and appropriate assessment.</p></section><div class="layout-two"><section class="panel"><p class="kicker">NEXT-MORNING FOLLOW-UP</p><h3>How did you recover?</h3><p class="subtle">Update sessions after waking. A pain score alone never clears a progression.</p>'+(latest.length?latest.map(s=>'<div class="review-row"><div class="review-meta"><strong>'+esc(dateLabel(s.date))+' · '+esc(PLAN[s.day].name)+'</strong><span class="pill">'+(s.entries||[]).filter(e=>e.done).length+' performed</span></div><label class="field">Next-morning status<select data-recovery="'+esc(s.id)+'"><option value="pending" '+(s.nextMorning==='pending'?'selected':'')+'>Not assessed yet</option><option value="baseline" '+(s.nextMorning==='baseline'?'selected':'')+'>Function and symptoms at usual baseline</option><option value="worse" '+(s.nextMorning==='worse'?'selected':'')+'>Worse symptoms / function</option><option value="concern" '+(s.nextMorning==='concern'?'selected':'')+'>Concerning symptoms · assessment needed</option></select></label></div>').join(''):'<div class="empty">No completed session to review.</div>')+'</section><aside class="panel"><p class="kicker">FOUNDATION SKILL CHECK</p><h3>Six review gates</h3><p class="subtle">These coaching benchmarks are not scientifically validated universal prerequisites. Tick only genuinely demonstrated abilities; keep supported training until review.</p><div class="gate-list">'+GATES.map((g,i)=>'<label><input type="checkbox" data-gate="'+i+'" '+(store.gates[i]?'checked':'')+'><span>'+esc(g)+'</span></label>').join('')+'</div><div class="stats-line"><span class="pill">'+GATES.filter((_,i)=>store.gates[i]).length+' / 6 verified</span></div></aside></div>';
}
const GUIDE=[
['Chest-to-wall handstand','Overhead alignment, straight-arm support, safe wall exit','1. Start from a short supported wall walk. 2. Keep hands shoulder-width and elbows straight. 3. Push tall through the shoulders, ribs stacked. 4. Hold only while controlled. 5. Reverse the wall walk to step down.','3 × 10–20 seconds; rest 60–90 seconds.','Box-supported pike hold','Do not progress closer to the wall without an independent safe exit.'],
['Box-supported pike hold','Shoulder elevation and wrist-bearing capacity','1. Use a stable low box on nonslip flooring. 2. Plant hands, feet supported. 3. Lift hips high with elbows straight. 4. Push the floor away. 5. Step down under control.','3 × 15–25 seconds; rest 60–90 seconds.','Downward dog on the floor','Never lift the feet without a documented skill review.'],
['Supported pike weight shift','Slow weight transfer over the hands','1. Start in a box-supported pike. 2. Establish tall shoulders. 3. Shift shoulders slightly over hands. 4. Pause 2–3 seconds while breathing. 5. Return slowly, keeping feet supported.','3 × 5 slow shifts; rest 60–90 seconds.','Floor pike weight shifts','Avoid bouncing, wrist compression pain or uncontrolled exits.'],
['Seated pike compression','Active hip flexion and straight-leg lifting','1. Sit tall, legs extended. 2. Hands beside the thighs or on blocks. 3. Exhale and lift both heels a little. 4. Avoid rolling backwards. 5. Lower slowly.','3 × 6–10 repetitions; rest 45–75 seconds.','Raise hands or use one leg at a time','Separate active range from passive flexibility.'],
['Overhead press','Deltoid and triceps capacity, complement to skill training','1. Stand tall or sit with support. 2. Start dumbbells at shoulder height. 3. Press without arching the lower back. 4. Lower slowly.','3 × 8 controlled repetitions, 2–3 reps in reserve.','Light dumbbells or supported machine','Heavy pressing is not a substitute for straight-arm scapular control.'],
['Supported pike stretch','Comfortable hamstring range','1. Sit with straight or lightly bent knees. 2. Lengthen the spine. 3. Hinge forward from the hips. 4. Hold a comfortable stretch while breathing.','2 × 30–40 seconds.','Sit elevated or bend knees','No ballistic bouncing or forcing range.']
];
function renderGuide(){
 $('#guide-content').innerHTML='<div class="guide-grid">'+GUIDE.map((g,i)=>'<article class="panel"><p class="kicker">SKILL '+String(i+1).padStart(2,'0')+'</p><h3>'+esc(g[0])+'</h3><p><strong>Purpose:</strong> '+esc(g[1])+'</p><p><strong>Steps:</strong> '+esc(g[2])+'</p><p><strong>Dose:</strong> '+esc(g[3])+'</p><p><strong>Easier:</strong> '+esc(g[4])+'</p><p><strong>Safety:</strong> '+esc(g[5])+'</p></article>').join('')+'</div><div class="panel"><h3>The training order</h3><div class="stats-line"><span class="pill">01 Readiness + warm-up</span><span class="pill">02 Supported skill</span><span class="pill">03 Strength</span><span class="pill">04 Mobility</span><span class="pill">05 Record + review</span></div></div>';
}
function renderCurrent(){if(tab==='today')renderToday();if(tab==='progress')renderProgress();if(tab==='review')renderReview();if(tab==='guide')renderGuide()}
function saveField(el){
 const d=draft();if(el.dataset.ready){d[el.dataset.ready]=el.value}
 else if(el.dataset.field){const id=el.dataset.ex;if(!PLAN[day].ex.some(x=>x.id===id))return;const x=d.entries[id]||{};x[el.dataset.field]=el.dataset.field==='done'?el.checked:el.value;d.entries[id]=x}
 persist();
 if(el.dataset.field==='done'||el.dataset.ready==='readiness'||el.dataset.ready==='symptoms')renderToday();
}
$('#day-select').addEventListener('change',e=>{if(PLAN[e.target.value]){day=e.target.value;persist();renderToday()}});
$('#today-content').addEventListener('change',e=>{const t=e.target;if(t.id==='workout-date'){if(/^\d{4}-\d\d-\d\d$/.test(t.value)){date=t.value;renderToday()}return}if(t.dataset.ready||t.dataset.field)saveField(t)});
$('#today-content').addEventListener('input',e=>{if(e.target.id==='session-note'){draft().notes=e.target.value;persist()}});
$('#today-content').addEventListener('click',e=>{if(e.target.closest('#finish-session'))completeSession()});
$('#progress-content').addEventListener('change',e=>{if(e.target.id==='progress-measure')renderProgress()});
$('#review-content').addEventListener('change',e=>{const t=e.target;if(t.dataset.recovery){const s=store.sessions.find(s=>s.id===t.dataset.recovery);if(s&&['pending','baseline','worse','concern'].includes(t.value)){s.nextMorning=t.value;persist();updateMetrics();renderReview()}}else if(t.dataset.gate!==undefined){store.gates[t.dataset.gate]=t.checked;persist();renderReview()}}); 
all('button[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
$('#export-json').addEventListener('click',()=>{try{const payload={product:'De-Movement Press Control',version:2,exportedAt:new Date().toISOString(),pressControl:store,legacyPressLab:readKey(LEGACY)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='de-movement-press-control-'+localDate()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}catch(e){alert('Unable to export records. Check browser download permissions.')}});
$('#import-json').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{if(f.size>5e6)throw Error('Backup is too large');const data=JSON.parse(await f.text());if(data.product!=='De-Movement Press Control'||data.version!==2||!data.pressControl||!Array.isArray(data.pressControl.sessions))throw Error('This is not a Press Control v2 backup');if(!confirm('Replace this device’s Press Control records with the imported backup? Export your current records first.'))return;const previous=store;store=normalise(data.pressControl);if(!persist()){store=previous;throw Error('Device storage failed')}if(data.legacyPressLab&&typeof data.legacyPressLab==='object'&&confirm('Also restore the original Press Lab backup? Existing original Press Lab records on this device will be replaced.'))localStorage.setItem(LEGACY,JSON.stringify(data.legacyPressLab));day=store.day;date=localDate();updateMetrics();setTab('progress');alert('Press Control backup imported.')}catch(err){alert('Import failed: '+err.message)}finally{e.target.value=''}});
let timerSeconds=90,remaining=90,endsAt=null,running=false,interval=null;
function timePaint(){const v=Math.max(0,Math.ceil(remaining));$('#timer-display').textContent=String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');$('#timer-toggle').textContent=running?'Pause':'Start'}
function timeTick(){if(!running)return;remaining=Math.max(0,(endsAt-Date.now())/1000);if(remaining<=0){running=false;clearInterval(interval);$('#save-status').textContent='Rest finished ✓'}timePaint()}
$('#timer-toggle').addEventListener('click',()=>{if(running){timeTick();running=false;clearInterval(interval)}else{if(remaining<=0)remaining=timerSeconds;endsAt=Date.now()+remaining*1000;running=true;interval=setInterval(timeTick,250)}timePaint()});
$('#timer-reset').addEventListener('click',()=>{running=false;clearInterval(interval);remaining=timerSeconds;timePaint()});
$('#timer-length').addEventListener('change',e=>{timerSeconds=Number(e.target.value)||90;remaining=timerSeconds;running=false;clearInterval(interval);timePaint()});
document.addEventListener('visibilitychange',timeTick);
updateMetrics();renderCurrent();timePaint();
})();