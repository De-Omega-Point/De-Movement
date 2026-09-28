-- Phase 7 · Supabase pgcrypto resolution fix
-- Supabase installs pgcrypto in the extensions schema.

create or replace function public.dm_create_coach_invite(invite_email text, invite_name text default null)
returns text
language plpgsql
security definer
set search_path=public,private,extensions
as $$
declare raw_token text;
begin
  if private.dm_current_role()<>'coach' then raise exception 'coach_role_required'; end if;
  if not private.dm_account_active() then raise exception 'account_inactive'; end if;
  raw_token:=encode(extensions.gen_random_bytes(24),'hex');
  insert into public.coach_invites(coach_id,email,display_name,token_hash,expires_at)
  values(
    auth.uid(),
    lower(trim(invite_email)),
    nullif(trim(invite_name),''),
    encode(extensions.digest(raw_token,'sha256'),'hex'),
    now()+interval '7 days'
  );
  return raw_token;
end $$;

create or replace function public.dm_claim_coach_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path=public,private,extensions
as $$
declare inv public.coach_invites%rowtype; rel_id uuid; user_email text;
begin
  if private.dm_current_role()<>'mover' then raise exception 'mover_role_required'; end if;
  if not private.dm_account_active() then raise exception 'account_inactive'; end if;
  user_email:=lower(coalesce(auth.jwt()->>'email',''));
  select * into inv from public.coach_invites
  where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex')
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
