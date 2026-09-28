-- Phase 7 · RLS performance hardening
-- Wrap stable auth/helper calls so Postgres can evaluate them once per statement.

drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists coach_movers_admin_write on public.coach_movers;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated
using (id=(select auth.uid()) or (select private.dm_is_admin()) or private.dm_is_active_coach_for(id));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
using (((id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()))
with check (((id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists training_profiles_mover on public.training_profiles;
create policy training_profiles_mover on public.training_profiles for all to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()) or private.dm_is_active_coach_for(mover_id))
with check (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists passport_mover on public.passport_states;
create policy passport_mover on public.passport_states for all to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()) or private.dm_is_active_coach_for(mover_id))
with check (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists readiness_access on public.readiness_checkins;
create policy readiness_access on public.readiness_checkins for select to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()) or private.dm_is_active_coach_for(mover_id));

drop policy if exists readiness_insert_self on public.readiness_checkins;
create policy readiness_insert_self on public.readiness_checkins for insert to authenticated
with check (mover_id=(select auth.uid()) and (select private.dm_account_active()));

drop policy if exists training_logs_access on public.training_logs;
create policy training_logs_access on public.training_logs for select to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()) or private.dm_is_active_coach_for(mover_id));

drop policy if exists training_logs_insert_self on public.training_logs;
create policy training_logs_insert_self on public.training_logs for insert to authenticated
with check (mover_id=(select auth.uid()) and (select private.dm_account_active()));

drop policy if exists saved_flows_read on public.saved_flows;
create policy saved_flows_read on public.saved_flows for select to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()) or private.dm_is_active_coach_for(mover_id));

drop policy if exists saved_flows_insert on public.saved_flows;
create policy saved_flows_insert on public.saved_flows for insert to authenticated
with check (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists saved_flows_update on public.saved_flows;
create policy saved_flows_update on public.saved_flows for update to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()))
with check (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists saved_flows_delete on public.saved_flows;
create policy saved_flows_delete on public.saved_flows for delete to authenticated
using (((mover_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists coach_movers_access on public.coach_movers;
create policy coach_movers_access on public.coach_movers for select to authenticated
using ((((coach_id=(select auth.uid())) or (mover_id=(select auth.uid()))) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists coach_notes_access on public.coach_notes;
create policy coach_notes_access on public.coach_notes for select to authenticated
using (((coach_id=(select auth.uid())) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists coach_notes_insert on public.coach_notes;
create policy coach_notes_insert on public.coach_notes for insert to authenticated
with check (
  coach_id=(select auth.uid())
  and (select private.dm_account_active())
  and (select private.dm_current_role())='coach'
  and exists(select 1 from public.coach_movers cm where cm.id=relationship_id and cm.coach_id=(select auth.uid()) and cm.status='active')
);

drop policy if exists assignments_access on public.coach_assignments;
create policy assignments_access on public.coach_assignments for select to authenticated
using ((((coach_id=(select auth.uid())) or (mover_id=(select auth.uid()))) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists assignments_coach_insert on public.coach_assignments;
create policy assignments_coach_insert on public.coach_assignments for insert to authenticated
with check (
  coach_id=(select auth.uid())
  and (select private.dm_account_active())
  and (select private.dm_current_role())='coach'
  and exists(select 1 from public.coach_movers cm where cm.id=relationship_id and cm.coach_id=(select auth.uid()) and cm.mover_id=coach_assignments.mover_id and cm.status='active')
);

drop policy if exists assignments_mover_update on public.coach_assignments;
create policy assignments_mover_update on public.coach_assignments for update to authenticated
using ((((mover_id=(select auth.uid())) or (coach_id=(select auth.uid()))) and (select private.dm_account_active())) or (select private.dm_is_admin()))
with check ((((mover_id=(select auth.uid())) or (coach_id=(select auth.uid()))) and (select private.dm_account_active())) or (select private.dm_is_admin()));

drop policy if exists invites_coach_read on public.coach_invites;
create policy invites_coach_read on public.coach_invites for select to authenticated
using (((coach_id=(select auth.uid())) and (select private.dm_account_active()) and (select private.dm_current_role())='coach') or (select private.dm_is_admin()));

drop policy if exists audit_admin_read on public.admin_audit_log;
create policy audit_admin_read on public.admin_audit_log for select to authenticated
using ((select private.dm_is_admin()));
