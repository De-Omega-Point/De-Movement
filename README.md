# De-Movement

> **Choose how you move.**

De-Movement is a fresh movement-training product from De-Omega-Point. It is not a fork or reskin of Human Movement OS.

## Product DNA

Calisthenics is the strength and skill spine. Users can blend it with:

- soft acrobatics
- animalistic / ground locomotion
- mobility and flexibility
- strength preparation
- movement transitions and flow

The product is organised around **choice → objective → session → progression**, not around a flat exercise catalogue.

## Build phases

1. **Product DNA & interaction model**
2. **Visual Movement Library**
3. **Session Composer**
4. **Movement Paths & Passport**
5. **Flow Lab**
6. **Commercial / account layer**

## Phase 1 design principles

- **Choice first:** the first screen asks how you want to move.
- **Objectives before exercises:** every choice explains the purpose and expected outcome.
- **Blend, don't stack:** calisthenics can be combined with locomotion, soft acrobatics and mobility without creating four separate workouts.
- **Progressive movement literacy:** strength, balance, control, locomotion, range and transitions all count as progress.
- **Mobile-first:** usable during an actual workout.
- **Human-value-centric:** technology guides and clarifies; the human decides.

## Phase 1 verification gate

Phase 1 is ready to advance when a user can:

1. choose one primary movement intent,
2. optionally add one complementary style,
3. see a clear objective and session promise,
4. understand what success looks like today,
5. start a session without hunting through menus.

## Status

**Phase 7 — Accounts + Coaching Platform complete and live-verified**


## Current product capabilities

- intention-first movement chooser
- deterministic session composer
- guided workout runner with work/rest handling
- visual movement library with regressions and progressions
- seven capability pathways
- local Movement Passport with human-controlled progression
- readiness criteria and prerequisite gating

The Passport is deliberately not an automatic skill-unlocking system. Criteria inform the human decision; they do not make it.


## Phase 6 — Personalisation + Training Intelligence

Built:

- local training profile and goals
- daily readiness check-in
- completed-session / Flow history
- effort, control and confidence ratings
- seven-day movement exposure
- deterministic, explainable next-session recommendations
- explicit suppression of hard auto-recommendations when the Mover marks something for review

## Phase 7 — Accounts + Coaching Platform

Built:

- optional Supabase account layer
- Mover / Coach / Administrator roles
- cross-device Mover data sync architecture
- Coach invitations
- assigned-session workflow
- private Coach notes
- Coach evidence dashboard
- Administrator role, suspension and relationship controls
- RLS and server-checked RPC security model

Phase 7 is connected to the live D-Move Supabase backend and has passed the live role/security acceptance suite: 28/28 full matrix tests plus 6/6 post-optimisation smoke tests. See `supabase/tests/PHASE-7-ACCEPTANCE.md`.
