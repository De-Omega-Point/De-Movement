-- De-Movement Phase 7 · private RLS helpers + role-safe invites
-- Applied live after Administrator acceptance testing.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.dm_current_role()
returns public.dm_role
language sql stable security definer
set search_path=public,private
as $$ select role from public.profiles where id=auth.uid() $$;

create or replace function private.dm_account_active()
returns boolean
language sql stable security definer
set search_path=public,private
as $$ select coalesce((select account_status='active' from public.profiles where id=auth.uid()),false) $$;

create or replace function private.dm_is_admin()
returns boolean
language sql stable security definer
set search_path=public,private
as $$ select coalesce((select role='administrator' and account_status='active' from public.profiles where id=auth.uid()),false) $$;

create or replace function private.dm_is_active_coach_for(target_mover uuid)
returns boolean
language sql stable security definer
set search_path=public,private
as $$
  select coalesce(exists(
    select 1
    from public.coach_movers cm
    join public.profiles p on p.id=cm.coach_id
    join public.profiles m on m.id=cm.mover_id
    where cm.coach_id=auth.uid()
      and cm.mover_id=target_mover
      and cm.status='active'
      and p.role='coach'
      and p.account_status='active'
      and m.role='mover'
      and m.account_status='active'
  ),false)
$$;

revoke all on function private.dm_current_role() from public, anon;
revoke all on function private.dm_account_active() from public, anon;
revoke all on function private.dm_is_admin() from public, anon;
revoke all on function private.dm_is_active_coach_for(uuid) from public, anon;

grant execute on function private.dm_current_role() to authenticated;
grant execute on function private.dm_account_active() to authenticated;
grant execute on function private.dm_is_admin() to authenticated;
grant execute on function private.dm_is_active_coach_for(uuid) to authenticated;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated
using (id=auth.uid() or private.dm_is_admin() or private.dm_is_active_coach_for(id));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
using (id=auth.uid() and private.dm_account_active())
with check (id=auth.uid() and private.dm_account_active());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
using (private.dm_is_admin()) with check (private.dm_is_admin());

drop policy if exists training_profiles_mover on public.training_profiles;
create policy training_profiles_mover on public.training_profiles for all to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin() or private.dm_is_active_coach_for(mover_id))
with check ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists passport_mover on public.passport_states;
create policy passport_mover on public.passport_states for all to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin() or private.dm_is_active_coach_for(mover_id))
with check ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists readiness_access on public.readiness_checkins;
create policy readiness_access on public.readiness_checkins for select to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin() or private.dm_is_active_coach_for(mover_id));

drop policy if exists readiness_insert_self on public.readiness_checkins;
create policy readiness_insert_self on public.readiness_checkins for insert to authenticated
with check (mover_id=auth.uid() and private.dm_account_active());

drop policy if exists training_logs_access on public.training_logs;
create policy training_logs_access on public.training_logs for select to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin() or private.dm_is_active_coach_for(mover_id));

drop policy if exists training_logs_insert_self on public.training_logs;
create policy training_logs_insert_self on public.training_logs for insert to authenticated
with check (mover_id=auth.uid() and private.dm_account_active());

drop policy if exists saved_flows_read on public.saved_flows;
create policy saved_flows_read on public.saved_flows for select to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin() or private.dm_is_active_coach_for(mover_id));

drop policy if exists saved_flows_insert on public.saved_flows;
create policy saved_flows_insert on public.saved_flows for insert to authenticated
with check ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists saved_flows_update on public.saved_flows;
create policy saved_flows_update on public.saved_flows for update to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin())
with check ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists saved_flows_delete on public.saved_flows;
create policy saved_flows_delete on public.saved_flows for delete to authenticated
using ((mover_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists coach_movers_access on public.coach_movers;
create policy coach_movers_access on public.coach_movers for select to authenticated
using (((coach_id=auth.uid() or mover_id=auth.uid()) and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists coach_movers_admin_write on public.coach_movers;
create policy coach_movers_admin_write on public.coach_movers for all to authenticated
using (private.dm_is_admin()) with check (private.dm_is_admin());

drop policy if exists coach_notes_access on public.coach_notes;
create policy coach_notes_access on public.coach_notes for select to authenticated
using ((coach_id=auth.uid() and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists coach_notes_insert on public.coach_notes;
create policy coach_notes_insert on public.coach_notes for insert to authenticated
with check (
  coach_id=auth.uid()
  and private.dm_account_active()
  and private.dm_current_role()='coach'
  and exists(
    select 1 from public.coach_movers cm
    where cm.id=relationship_id and cm.coach_id=auth.uid() and cm.status='active'
  )
);

drop policy if exists assignments_access on public.coach_assignments;
create policy assignments_access on public.coach_assignments for select to authenticated
using (((coach_id=auth.uid() or mover_id=auth.uid()) and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists assignments_coach_insert on public.coach_assignments;
create policy assignments_coach_insert on public.coach_assignments for insert to authenticated
with check (
  coach_id=auth.uid()
  and private.dm_account_active()
  and private.dm_current_role()='coach'
  and exists(
    select 1 from public.coach_movers cm
    where cm.id=relationship_id
      and cm.coach_id=auth.uid()
      and cm.mover_id=coach_assignments.mover_id
      and cm.status='active'
  )
);

drop policy if exists assignments_mover_update on public.coach_assignments;
create policy assignments_mover_update on public.coach_assignments for update to authenticated
using (((mover_id=auth.uid() or coach_id=auth.uid()) and private.dm_account_active()) or private.dm_is_admin())
with check (((mover_id=auth.uid() or coach_id=auth.uid()) and private.dm_account_active()) or private.dm_is_admin());

drop policy if exists invites_coach_read on public.coach_invites;
create policy invites_coach_read on public.coach_invites for select to authenticated
using ((coach_id=auth.uid() and private.dm_account_active() and private.dm_current_role()='coach') or private.dm_is_admin());

drop policy if exists audit_admin_read on public.admin_audit_log;
create policy audit_admin_read on public.admin_audit_log for select to authenticated
using (private.dm_is_admin());

create or replace function public.dm_create_coach_invite(invite_email text, invite_name text default null)
returns text
language plpgsql
security definer
set search_path=public,private
as $$
declare raw_token text;
begin
  if private.dm_current_role()<>'coach' then raise exception 'coach_role_required'; end if;
  if not private.dm_account_active() then raise exception 'account_inactive'; end if;
  raw_token:=encode(gen_random_bytes(24),'hex');
  insert into public.coach_invites(coach_id,email,display_name,token_hash,expires_at)
  values(auth.uid(),lower(trim(invite_email)),nullif(trim(invite_name),''),encode(digest(raw_token,'sha256'),'hex'),now()+interval '7 days');
  return raw_token;
end $$;

create or replace function public.dm_claim_coach_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path=public,private
as $$
declare inv public.coach_invites%rowtype; rel_id uuid; user_email text;
begin
  if private.dm_current_role()<>'mover' then raise exception 'mover_role_required'; end if;
  if not private.dm_account_active() then raise exception 'account_inactive'; end if;
  user_email:=lower(coalesce(auth.jwt()->>'email',''));
  select * into inv from public.coach_invites
  where token_hash=encode(digest(raw_token,'sha256'),'hex')
    and claimed_at is null and expires_at>now()
  limit 1;
  if inv.id is null then raise exception 'invalid_or_expired_invite'; end if;
  if user_email='' or user_email<>lower(inv.email) then raise exception 'email_mismatch'; end if;
  if not exists(select 1 from public.profiles where id=inv.coach_id and role='coach' and account_status='active') then raise exception 'coach_unavailable'; end if;
  insert into public.coach_movers(coach_id,mover_id,status)
  values(inv.coach_id,auth.uid(),'active')
  on conflict(coach_id,mover_id) do update set status='active'
  returning id into rel_id;
  update public.coach_invites set claimed_at=now() where id=inv.id;
  if inv.display_name is not null then update public.profiles set display_name=inv.display_name where id=auth.uid(); end if;
  return rel_id;
end $$;

create or replace function public.dm_admin_set_role(target uuid,new_role public.dm_role)
returns void language plpgsql security definer set search_path=public,private as $$
begin
 if not private.dm_is_admin() then raise exception 'not_authorised'; end if;
 if target=auth.uid() and new_role<>'administrator' then raise exception 'cannot_demote_self'; end if;
 update public.profiles set role=new_role where id=target;
 insert into public.admin_audit_log(actor_id,action,target_profile_id,metadata)
 values(auth.uid(),'set_role',target,jsonb_build_object('role',new_role));
end $$;

create or replace function public.dm_admin_set_account_status(target uuid,new_status public.dm_account_status)
returns void language plpgsql security definer set search_path=public,private as $$
begin
 if not private.dm_is_admin() then raise exception 'not_authorised'; end if;
 if target=auth.uid() and new_status='suspended' then raise exception 'cannot_suspend_self'; end if;
 update public.profiles set account_status=new_status where id=target;
 insert into public.admin_audit_log(actor_id,action,target_profile_id,metadata)
 values(auth.uid(),'set_account_status',target,jsonb_build_object('status',new_status));
end $$;

create or replace function public.dm_admin_transfer_mover(relationship uuid,new_coach uuid)
returns void language plpgsql security definer set search_path=public,private as $$
declare mover uuid;
begin
 if not private.dm_is_admin() then raise exception 'not_authorised'; end if;
 if not exists(select 1 from public.profiles where id=new_coach and role='coach' and account_status='active') then raise exception 'invalid_coach'; end if;
 select mover_id into mover from public.coach_movers where id=relationship;
 if mover is null then raise exception 'relationship_not_found'; end if;
 if not exists(select 1 from public.profiles where id=mover and role='mover' and account_status='active') then raise exception 'invalid_mover'; end if;
 update public.coach_movers set coach_id=new_coach where id=relationship;
 insert into public.admin_audit_log(actor_id,action,target_profile_id,target_relationship_id,metadata)
 values(auth.uid(),'transfer_mover',mover,relationship,jsonb_build_object('coach_id',new_coach));
end $$;

drop function if exists public.dm_current_role();
drop function if exists public.dm_account_active();
drop function if exists public.dm_is_admin();
drop function if exists public.dm_is_active_coach_for(uuid);
