const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const coach=fs.readFileSync(path.join(root,'coach.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const coachJs=fs.readFileSync(path.join(root,'coach.js'),'utf8');

assert(index.includes('data-view-target="assistant"'));
assert(index.includes('id="assistant-view"'));
assert(index.includes('assistant-engine.js'));
assert(/PHASE \d+ ·/.test(index),'phase indicator missing');
assert(app.includes('window.DeMovementAssistant'));
assert(app.includes('askMoverAssistant'));
assert(app.includes('assistant-use-session'));
assert(coach.includes('assistant-engine.js'));
assert(coach.includes('engine.js'));
assert(coach.includes('movements.js'));
assert(coachJs.includes('A.coachQueue'));
assert(coachJs.includes('What changed?'));
assert(coachJs.includes('Load proposal into assignment form'));
assert(!coachJs.includes('auto-assign'));

console.log('Phase 8 UI integration tests passed');