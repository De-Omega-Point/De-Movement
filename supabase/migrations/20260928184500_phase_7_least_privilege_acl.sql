-- De-Movement Phase 7 · least-privilege browser ACL
-- RLS remains the row-level authority. These grants reduce the outer permission envelope.

revoke all privileges on table
  public.profiles,
  public.training_profiles,
  public.passport_states,
  public.readiness_checkins,
  public.training_logs,
  public.saved_flows,
  public.coach_movers,
  public.coach_notes,
  public.coach_assignments,
  public.coach_invites,
  public.admin_audit_log
from anon;

revoke all privileges on table
  public.profiles,
  public.training_profiles,
  public.passport_states,
  public.readiness_checkins,
  public.training_logs,
  public.saved_flows,
  public.coach_movers,
  public.coach_notes,
  public.coach_assignments,
  public.coach_invites,
  public.admin_audit_log
from authenticated;

grant select on table public.profiles to authenticated;
grant update(display_name) on table public.profiles to authenticated;
grant select,insert,update on table public.training_profiles to authenticated;
grant select,insert,update on table public.passport_states to authenticated;
grant select,insert on table public.readiness_checkins to authenticated;
grant select,insert on table public.training_logs to authenticated;
grant select,insert,update,delete on table public.saved_flows to authenticated;
grant select on table public.coach_movers to authenticated;
grant select,insert on table public.coach_notes to authenticated;
grant select,insert on table public.coach_assignments to authenticated;
grant update(status,completed_at) on table public.coach_assignments to authenticated;
grant select on table public.coach_invites to authenticated;
grant select on table public.admin_audit_log to authenticated;
