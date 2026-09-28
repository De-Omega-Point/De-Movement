-- De-Movement Phase 7 · live security hardening
-- Applied to D-Move after Supabase advisor review.

create or replace function public.dm_touch_updated_at()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  new.updated_at=now();
  return new;
end
$$;

revoke execute on function public.dm_handle_new_user() from public, anon, authenticated;
revoke execute on function public.dm_touch_updated_at() from public, anon, authenticated;

revoke execute on function public.dm_current_role() from public, anon;
revoke execute on function public.dm_account_active() from public, anon;
revoke execute on function public.dm_is_admin() from public, anon;
revoke execute on function public.dm_is_active_coach_for(uuid) from public, anon;
revoke execute on function public.dm_create_coach_invite(text,text) from public, anon;
revoke execute on function public.dm_claim_coach_invite(text) from public, anon;
revoke execute on function public.dm_admin_set_role(uuid,public.dm_role) from public, anon;
revoke execute on function public.dm_admin_set_account_status(uuid,public.dm_account_status) from public, anon;
revoke execute on function public.dm_admin_transfer_mover(uuid,uuid) from public, anon;

grant execute on function public.dm_current_role() to authenticated;
grant execute on function public.dm_account_active() to authenticated;
grant execute on function public.dm_is_admin() to authenticated;
grant execute on function public.dm_is_active_coach_for(uuid) to authenticated;
grant execute on function public.dm_create_coach_invite(text,text) to authenticated;
grant execute on function public.dm_claim_coach_invite(text) to authenticated;
grant execute on function public.dm_admin_set_role(uuid,public.dm_role) to authenticated;
grant execute on function public.dm_admin_set_account_status(uuid,public.dm_account_status) to authenticated;
grant execute on function public.dm_admin_transfer_mover(uuid,uuid) to authenticated;

alter policy profiles_self_select on public.profiles to authenticated;
alter policy profiles_self_update on public.profiles to authenticated;
alter policy profiles_admin_all on public.profiles to authenticated;
alter policy training_profiles_mover on public.training_profiles to authenticated;
alter policy passport_mover on public.passport_states to authenticated;
alter policy readiness_access on public.readiness_checkins to authenticated;
alter policy readiness_insert_self on public.readiness_checkins to authenticated;
alter policy training_logs_access on public.training_logs to authenticated;
alter policy training_logs_insert_self on public.training_logs to authenticated;
alter policy saved_flows_read on public.saved_flows to authenticated;
alter policy saved_flows_insert on public.saved_flows to authenticated;
alter policy saved_flows_update on public.saved_flows to authenticated;
alter policy saved_flows_delete on public.saved_flows to authenticated;
alter policy coach_movers_access on public.coach_movers to authenticated;
alter policy coach_movers_admin_write on public.coach_movers to authenticated;
alter policy coach_notes_access on public.coach_notes to authenticated;
alter policy coach_notes_insert on public.coach_notes to authenticated;
alter policy assignments_access on public.coach_assignments to authenticated;
alter policy assignments_coach_insert on public.coach_assignments to authenticated;
alter policy assignments_mover_update on public.coach_assignments to authenticated;
alter policy invites_coach_read on public.coach_invites to authenticated;
alter policy audit_admin_read on public.admin_audit_log to authenticated;

create index if not exists coach_notes_relationship_idx on public.coach_notes(relationship_id);
create index if not exists coach_notes_coach_idx on public.coach_notes(coach_id);
create index if not exists coach_assignments_relationship_idx on public.coach_assignments(relationship_id);
create index if not exists coach_assignments_coach_idx on public.coach_assignments(coach_id);
create index if not exists coach_invites_coach_idx on public.coach_invites(coach_id);
create index if not exists admin_audit_actor_idx on public.admin_audit_log(actor_id);
create index if not exists admin_audit_target_profile_idx on public.admin_audit_log(target_profile_id);
create index if not exists admin_audit_target_relationship_idx on public.admin_audit_log(target_relationship_id);
