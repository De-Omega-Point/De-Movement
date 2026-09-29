-- Phase 9 · explicit pilot feedback
-- Feedback is user-submitted only. No background behavioural event stream.

create table if not exists public.pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  area text not null check (area in ('onboarding','session','passport','flow','assistant','coaching','account','other')),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 2000),
  build text not null default '0.9.0',
  created_at timestamptz not null default now()
);

create index if not exists pilot_feedback_author_time_idx on public.pilot_feedback(author_id,created_at desc);

alter table public.pilot_feedback enable row level security;

drop policy if exists pilot_feedback_read on public.pilot_feedback;
create policy pilot_feedback_read on public.pilot_feedback for select to authenticated
using (author_id=(select auth.uid()) or (select private.dm_is_admin()));

drop policy if exists pilot_feedback_insert on public.pilot_feedback;
create policy pilot_feedback_insert on public.pilot_feedback for insert to authenticated
with check (author_id=(select auth.uid()) and (select private.dm_account_active()));

drop policy if exists pilot_feedback_delete on public.pilot_feedback;
create policy pilot_feedback_delete on public.pilot_feedback for delete to authenticated
using (author_id=(select auth.uid()) or (select private.dm_is_admin()));

revoke all privileges on table public.pilot_feedback from anon, authenticated;
grant select,insert,delete on table public.pilot_feedback to authenticated;
