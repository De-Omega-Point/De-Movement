const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const manifest=JSON.parse(read('manifest.webmanifest'));
assert.strictEqual(manifest.name,'De-Movement');
assert.strictEqual(manifest.start_url,'./');
assert.strictEqual(manifest.scope,'./');
assert.strictEqual(manifest.display,'standalone');
assert(Array.isArray(manifest.icons)&&manifest.icons.length>=1);
for(const icon of manifest.icons)assert(fs.existsSync(path.join(root,icon.src)),'missing manifest icon '+icon.src);

const sw=read('sw.js');
assert(sw.includes("demovement-v0.9.0"));
for(const required of ['index.html','assistant-engine.js','passport.js','flow.js','market-ready.js','privacy.html','terms.html']){
  assert(sw.includes(required),'offline core missing '+required);
  assert(fs.existsSync(path.join(root,required)),'offline asset does not exist '+required);
}

const index=read('index.html');
assert(index.includes('rel="manifest"'));
assert(index.includes('PHASE 9 · PILOT READY'));
assert(index.includes('class="skip-link"'));
assert(index.includes('market-ready.js'));

const market=read('market-ready.js');
assert(/local-first/i.test(market));
assert(market.includes('navigator.serviceWorker.register'));
assert(market.includes('beforeinstallprompt'));
assert(market.includes('demovement.feedback.v1'));
assert(market.includes('Save locally'));
assert(market.includes('Send to pilot team'));

const account=read('account.js');
for(const term of ['Export local data','Clear this device','Export cloud data','Delete cloud account','B.deleteAccount()'])assert(account.includes(term),'account control missing '+term);

const privacy=read('privacy.html'),terms=read('terms.html');
assert(/local first|local-first/i.test(privacy));
assert(/Assistant/.test(privacy));
assert(/not medical/i.test(terms));
assert(/18 and over/i.test(terms));

const migration=read('supabase/migrations/20260929234000_phase_9_pilot_feedback.sql');
assert(migration.includes('create table if not exists public.pilot_feedback'));
assert(migration.includes('enable row level security'));
assert(migration.includes('from anon, authenticated'));
assert(migration.includes('grant select,insert,delete'));

const edge=read('supabase/functions/delete-account/index.ts');
assert(edge.includes('confirmation_required'));
assert(edge.includes('last_administrator'));
assert(edge.includes('admin.auth.admin.deleteUser'));
assert(edge.includes('SUPABASE_SECRET_KEYS'));
assert(!/sb_secret_|service_role\s*[:=]\s*["'][^"']+/i.test(edge),'privileged key must not be hard-coded');

const admin=read('administrator.js');
assert(admin.includes('data-tab="pilot"'));
assert(admin.includes('administratorPilotMetrics'));
assert(/No hidden clickstream/.test(admin));

const styles=read('styles.css')+read('platform.css');
assert(styles.includes(':focus-visible'));
assert(styles.includes('prefers-reduced-motion'));
assert(styles.includes('@media(pointer:coarse)'));

const clientBundle=[index,market,account,read('app.js'),read('coach.js'),read('administrator.js')].join('\n');
assert(!/google-analytics|gtag\(|mixpanel|amplitude|segment\.com/i.test(clientBundle),'unexpected hidden analytics integration');

console.log('Phase 9 market-readiness tests passed');