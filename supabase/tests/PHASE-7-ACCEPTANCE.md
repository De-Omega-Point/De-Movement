# Phase 7 Live Acceptance Report

Status: **PASSED**

Backend: Supabase project `D-Move`

## Live verification

The acceptance suite used temporary synthetic Supabase Auth identities inside a database transaction. All synthetic users, notes, assignments, invitations and relationship changes were rolled back after the test.

### Full role/security matrix

**28 / 28 tests passed.**

Verified:

- Coach can see an actively assigned Mover
- Coach cannot see a paused/unassigned Mover
- Coach can read assigned Mover training evidence
- Coach cannot read unrelated Mover training evidence
- Coach can create a private note for an active relationship
- Coach cannot create a note for a paused relationship
- Coach can assign an active Mover
- Coach cannot assign a paused Mover
- Coach cannot delete a Mover's saved Flow
- Coach cannot edit a Mover's Passport
- Coach can create a role-safe Mover invite
- invite email mismatch is rejected
- matching invite creates an active Coach↔Mover relationship
- Mover sees only their own profile
- Mover cannot read private Coach notes
- Mover sees their own assignment
- Mover can update assignment status
- Mover cannot rewrite assignment payload
- Mover cannot self-promote to Administrator
- Mover cannot create Coach invitations
- Administrator can transfer a Mover to another active Coach
- old Coach loses access immediately after transfer
- new Coach gains access immediately after transfer
- new Coach can read transferred Mover evidence
- suspended Mover can still see their own account status
- suspended Mover cannot read training profile
- suspended Mover cannot read assignments
- suspended Mover cannot write training logs

### Administrator bootstrap tests

Also verified live:

- Administrator can read own profile
- Administrator cannot demote themselves
- Administrator cannot suspend themselves
- Administrator cannot masquerade as a Coach to create Mover invites

### Post-optimisation smoke test

After RLS performance optimisation, **6 / 6 critical isolation tests passed**.

## Supabase advisors

Performance advisor after hardening reports only informational unused-index notices on this new, mostly empty database. The earlier RLS init-plan warnings were removed.

Security advisor retains warnings for the five intentionally exposed authenticated `SECURITY DEFINER` RPCs used for role-checked invitations and Administrator actions. Internal RLS helper functions were moved to a private, non-exposed schema.

## Result

Phase 7 account, Coach, Administrator, cloud-sync and permission architecture is accepted as complete for the current product stage.
