const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const schema=fs.readFileSync(path.join(root,'supabase-schema.sql'),'utf8');
const config=fs.readFileSync(path.join(root,'config.js'),'utf8');
const adapter=require('../supabase-adapter.js');

assert.strictEqual(adapter.mode,'local','Node/no-browser config must fall back to local mode');

for(const role of ["'mover'","'coach'","'administrator'"])assert(schema.includes(role),'missing role '+role);
for(const table of ['profiles','training_profiles','passport_states','readiness_checkins','training_logs','saved_flows','coach_movers','coach_notes','coach_assignments','coach_invites','admin_audit_log']){
  assert(schema.includes('alter table public.'+table+' enable row level security;'),'RLS not enabled: '+table);
}
for(const rpc of ['dm_create_coach_invite','dm_claim_coach_invite','dm_admin_set_role','dm_admin_set_account_status','dm_admin_transfer_mover']){
  assert(schema.includes('function public.'+rpc),'missing RPC '+rpc);
}
assert(schema.includes('grant update(display_name) on table public.profiles to authenticated;'));
assert(!schema.includes('grant update on table public.profiles to authenticated;'),'profiles must not have broad update grant');
assert(schema.includes('grant update(status,completed_at) on table public.coach_assignments to authenticated;'));
assert(!schema.includes('grant select,insert,update on table public.coach_assignments to authenticated;'),'assignment payload must not be broadly updateable');
assert(schema.includes('create policy saved_flows_read'));
assert(schema.includes('create policy saved_flows_delete'));
assert(schema.includes('public.dm_account_active()'));
assert(!/as \$\s/.test(schema),'malformed SQL dollar quote');

assert(/supabaseUrl:'https:\/\/[a-z0-9]+\.supabase\.co'/.test(config),'live Supabase URL missing');
assert(/supabaseAnonKey:'sb_publishable_[^']+'/.test(config),'publishable browser key missing');
assert(!/service[_-]?role\s*[:=]\s*['"][^'"]+/i.test(config),'service role secret must not appear in browser config');
assert(!/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(config),'legacy JWT anon key should not be committed when a publishable key is available');

for(const file of ['account.html','invite.html','coach.html','administrator.html']){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 assert(html.includes('supabase-adapter.js'),file+' missing cloud adapter');
 assert(html.includes('config.js'),file+' missing public config');
}
for(const file of ['account.js','invite.js','coach.js','administrator.js']){
 assert(fs.existsSync(path.join(root,file)),file+' missing');
}
const main=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(main.includes('id="cloud-account-link"'));
assert(main.includes('supabase-adapter.js'));
assert(main.includes('id="coach-assignment-panel"'));

console.log('Phase 7 cloud architecture tests passed');
