-- De-Movement Phase 7 · Accounts + Coaching Platform
-- Fresh schema for Mover / Coach / Administrator architecture.
-- Requires Supabase Auth and pgcrypto.

create extension if not exists pgcrypto;

do $$ begin
  create type public.dm_role as enum ('mover','coach','administrator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dm_account_status as enum ('active','suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dm_relationship_status as enum ('active','paused','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dm_assignment_status as enum ('assigned','started','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Mover',
  role public.dm_role not null default 'mover',
  account_status public.dm_account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_profiles (
  mover_id uuid primary key references public.profiles(id) on delete cascade,
  goal_paths text[] not null default '{}',
  days_per_week integer not null default 4 check (days_per_week between 1 and 7),
  session_minutes integer not null default 40 check (session_minutes in (25,40,55)),
  preferred_styles text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.passport_states (
  mover_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  mover_id uuid not null references public.profiles(id) on delete cascade,
  energy integer not null check (energy between 1 and 5),
  soreness integer not null check (soreness between 1 and 5),
  focus integer not null check (focus between 1 and 5),
  review boolean not null default false,
  note text,
  checked_at timestamptz not null default now()
);

create index if not exists readiness_mover_time_idx on public.readiness_checkins(mover_id,checked_at desc);

create table if not exists public.training_logs (
  id uuid primary key default gen_random_uuid(),
  mover_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('session','flow')),
  title text not null,
  primary_intent text,
  blend text,
  energy text,
  duration_minutes integer not null default 0 check (duration_minutes between 0 and 240),
  effort integer not null check (effort between 1 and 10),
  control integer not null check (control between 1 and 5),
  confidence integer not null check (confidence between 1 and 5),
  movements jsonb not null default '[]'::jsonb,
  domains jsonb not null default '[]'::jsonb,
  notes text,
  completed_at timestamptz not null default now()
);

create index if not exists training_logs_mover_time_idx on public.training_logs(mover_id,completed_at desc);

create table if not exists public.saved_flows (
  id uuid primary key default gen_random_uuid(),
  mover_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Current Flow',
  builder jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(mover_id,name)
);

create table if not exists public.coach_movers (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  mover_id uuid not null references public.profiles(id) on delete cascade,
  status public.dm_relationship_status not null default 'active',
  created_at timestamptz not null default now(),
  unique(coach_id,mover_id)
);

create index if not exists coach_movers_coach_idx on public.coach_movers(coach_id);
create index if not exists coach_movers_mover_idx on public.coach_movers(mover_id);

create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.coach_movers(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.coach_assignments (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.coach_movers(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  mover_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('session','flow')),
  payload jsonb not null default '{}'::jsonb,
  status public.dm_assignment_status not null default 'assigned',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists assignments_mover_idx on public.coach_assignments(mover_id,status,created_at desc);

create table if not exists public.coach_invites (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  display_name text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists coach_invites_email_idx on public.coach_invites(lower(email),claimed_at,expires_at);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  target_relationship_id uuid references public.coach_movers(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.dm_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.dm_touch_updated_at();
drop trigger if exists training_profiles_touch on public.training_profiles;
create trigger training_profiles_touch before update on public.training_profiles for each row execute function public.dm_touch_updated_at();
drop trigger if exists passport_states_touch on public.passport_states;
create trigger passport_states_touch before update on public.passport_states for each row execute function public.dm_touch_updated_at();
drop trigger if exists saved_flows_touch on public.saved_flows;
create trigger saved_flows_touch before update on public.saved_flows for each row execute function public.dm_touch_updated_at();

create or replace function public.dm_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(id,email,display_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name',split_part(coalesce(new.email,'Mover'),'@',1),'Mover'))
  on conflict(id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.dm_handle_new_user();

create or replace function public.dm_current_role()
returns public.dm_role
language sql stable security definer
set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

create or replace function public.dm_account_active()
returns boolean
language sql stable security definer
set search_path=public
as $dm$ select coalesce((select account_status='active' from public.profiles where id=auth.uid()),false) $dm$;

create or replace function public.dm_is_admin()
returns boolean
language sql stable security definer
set search_path=public
as $$ select coalesce((select role='administrator' and account_status='active' from public.profiles where id=auth.uid()),false) $$;

create or replace function public.dm_is_active_coach_for(target_mover uuid)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select coalesce(exists(
    select 1 from public.coach_movers cm
    join public.profiles p on p.id=cm.coach_id
    where cm.coach_id=auth.uid() and cm.mover_id=target_mover and cm.status='active'
      and p.role='coach' and p.account_status='active'
  ),false)
$$;

alter table public.profiles enable row level security;
alter table public.training_profiles enable row level security;
alter table public.passport_states enable row level security;
alter table public.readiness_checkins enable row level security;
alter table public.training_logs enable row level security;
alter table public.saved_flows enable row level security;
alter table public.coach_movers enable row level security;
alter table public.coach_notes enable row level security;
alter table public.coach_assignments enable row level security;
alter table public.coach_invites enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select using (id=auth.uid() or public.dm_is_admin() or public.dm_is_active_coach_for(id));
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (id=auth.uid() and public.dm_account_active()) with check (id=auth.uid() and public.dm_account_active());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all using (public.dm_is_admin()) with check (public.dm_is_admin());

drop policy if exists training_profiles_mover on public.training_profiles;
create policy training_profiles_mover on public.training_profiles for all using ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin() or public.dm_is_active_coach_for(mover_id)) with check ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());
drop policy if exists passport_mover on public.passport_states;
create policy passport_mover on public.passport_states for all using ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin() or public.dm_is_active_coach_for(mover_id)) with check ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());
drop policy if exists readiness_access on public.readiness_checkins;
create policy readiness_access on public.readiness_checkins for select using ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin() or public.dm_is_active_coach_for(mover_id));
drop policy if exists readiness_insert_self on public.readiness_checkins;
create policy readiness_insert_self on public.readiness_checkins for insert with check (mover_id=auth.uid() and public.dm_account_active());
drop policy if exists training_logs_access on public.training_logs;
create policy training_logs_access on public.training_logs for select using ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin() or public.dm_is_active_coach_for(mover_id));
drop policy if exists training_logs_insert_self on public.training_logs;
create policy training_logs_insert_self on public.training_logs for insert with check (mover_id=auth.uid() and public.dm_account_active());
drop policy if exists saved_flows_owner on public.saved_flows;
create policy saved_flows_owner on public.saved_flows for all using ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin() or public.dm_is_active_coach_for(mover_id)) with check ((mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());

drop policy if exists coach_movers_access on public.coach_movers;
create policy coach_movers_access on public.coach_movers for select using ((coach_id=auth.uid() and public.dm_account_active()) or (mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());
drop policy if exists coach_movers_admin_write on public.coach_movers;
create policy coach_movers_admin_write on public.coach_movers for all using (public.dm_is_admin()) with check (public.dm_is_admin());

drop policy if exists coach_notes_access on public.coach_notes;
create policy coach_notes_access on public.coach_notes for select using ((coach_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());
drop policy if exists coach_notes_insert on public.coach_notes;
create policy coach_notes_insert on public.coach_notes for insert with check (
  coach_id=auth.uid() and public.dm_account_active() and exists(select 1 from public.coach_movers cm where cm.id=relationship_id and cm.coach_id=auth.uid() and cm.status='active')
);

drop policy if exists assignments_access on public.coach_assignments;
create policy assignments_access on public.coach_assignments for select using ((coach_id=auth.uid() and public.dm_account_active()) or (mover_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());
drop policy if exists assignments_coach_insert on public.coach_assignments;
create policy assignments_coach_insert on public.coach_assignments for insert with check (
  coach_id=auth.uid() and public.dm_account_active() and exists(select 1 from public.coach_movers cm where cm.id=relationship_id and cm.coach_id=auth.uid() and cm.mover_id=coach_assignments.mover_id and cm.status='active')
);
drop policy if exists assignments_mover_update on public.coach_assignments;
create policy assignments_mover_update on public.coach_assignments for update using (((mover_id=auth.uid() or coach_id=auth.uid()) and public.dm_account_active()) or public.dm_is_admin()) with check (((mover_id=auth.uid() or coach_id=auth.uid()) and public.dm_account_active()) or public.dm_is_admin());

drop policy if exists invites_coach_read on public.coach_invites;
create policy invites_coach_read on public.coach_invites for select using ((coach_id=auth.uid() and public.dm_account_active()) or public.dm_is_admin());
drop policy if exists audit_admin_read on public.admin_audit_log;
create policy audit_admin_read on public.admin_audit_log for select using (public.dm_is_admin());

create or replace function public.dm_create_coach_invite(invite_email text, invite_name text default null)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare raw_token text;
begin
  if public.dm_current_role() not in ('coach','administrator') then raise exception 'not_authorised'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and account_status='active') then raise exception 'account_inactive'; end if;
  raw_token:=encode(gen_random_bytes(24),'hex');
  insert into public.coach_invites(coach_id,email,display_name,token_hash,expires_at)
  values(auth.uid(),lower(trim(invite_email)),nullif(trim(invite_name),''),encode(digest(raw_token,'sha256'),'hex'),now()+interval '7 days');
  return raw_token;
end $$;

create or replace function public.dm_claim_coach_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare inv public.coach_invites%rowtype; rel_id uuid; user_email text;
begin
  user_email:=lower(coalesce(auth.jwt()->>'email',''));
  select * into inv from public.coach_invites
   where token_hash=encode(digest(raw_token,'sha256'),'hex')
     and claimed_at is null and expires_at>now()
   limit 1;
  if inv.id is null then raise exception 'invalid_or_expired_invite'; end if;
  if user_email='' or user_email<>lower(inv.email) then raise exception 'email_mismatch'; end if;
  insert into public.coach_movers(coach_id,mover_id,status)
   values(inv.coach_id,auth.uid(),'active')
   on conflict(coach_id,mover_id) do update set status='active'
   returning id into rel_id;
  update public.coach_invites set claimed_at=now() where id=inv.id;
  if inv.display_name is not null then update public.profiles set display_name=inv.display_name where id=auth.uid(); end if;
  return rel_id;
end $$;

create or replace function public.dm_admin_set_role(target uuid,new_role public.dm_role)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.dm_is_admin() then raise exception 'not_authorised'; end if;
 if target=auth.uid() and new_role<>'administrator' then raise exception 'cannot_demote_self'; end if;
 update public.profiles set role=new_role where id=target;
 insert into public.admin_audit_log(actor_id,action,target_profile_id,metadata) values(auth.uid(),'set_role',target,jsonb_build_object('role',new_role));
end $$;

create or replace function public.dm_admin_set_account_status(target uuid,new_status public.dm_account_status)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.dm_is_admin() then raise exception 'not_authorised'; end if;
 if target=auth.uid() and new_status='suspended' then raise exception 'cannot_suspend_self'; end if;
 update public.profiles set account_status=new_status where id=target;
 insert into public.admin_audit_log(actor_id,action,target_profile_id,metadata) values(auth.uid(),'set_account_status',target,jsonb_build_object('status',new_status));
end $$;

create or replace function public.dm_admin_transfer_mover(relationship uuid,new_coach uuid)
returns void language plpgsql security definer set search_path=public as $$
declare mover uuid;
begin
 if not public.dm_is_admin() then raise exception 'not_authorised'; end if;
 if not exists(select 1 from public.profiles where id=new_coach and role='coach' and account_status='active') then raise exception 'invalid_coach'; end if;
 select mover_id into mover from public.coach_movers where id=relationship;
 if mover is null then raise exception 'relationship_not_found'; end if;
 update public.coach_movers set coach_id=new_coach where id=relationship;
 insert into public.admin_audit_log(actor_id,action,target_profile_id,target_relationship_id,metadata) values(auth.uid(),'transfer_mover',mover,relationship,jsonb_build_object('coach_id',new_coach));
end $$;

grant execute on function public.dm_current_role() to authenticated;
grant execute on function public.dm_create_coach_invite(text,text) to authenticated;
grant execute on function public.dm_claim_coach_invite(text) to authenticated;
grant execute on function public.dm_admin_set_role(uuid,public.dm_role) to authenticated;
grant execute on function public.dm_admin_set_account_status(uuid,public.dm_account_status) to authenticated;
grant execute on function public.dm_admin_transfer_mover(uuid,uuid) to authenticated;


-- Explicit browser grants. RLS still decides which rows are visible/writable.
grant select on table public.profiles to authenticated;
revoke update on table public.profiles from authenticated;
grant update(display_name) on table public.profiles to authenticated;

grant select,insert,update on table public.training_profiles to authenticated;
grant select,insert,update on table public.passport_states to authenticated;
grant select,insert on table public.readiness_checkins to authenticated;
grant select,insert on table public.training_logs to authenticated;
grant select,insert,update,delete on table public.saved_flows to authenticated;
grant select on table public.coach_movers to authenticated;
grant select,insert on table public.coach_notes to authenticated;
grant select,insert,update on table public.coach_assignments to authenticated;
grant select on table public.coach_invites to authenticated;
grant select on table public.admin_audit_log to authenticated;

grant execute on function public.dm_account_active() to authenticated;
