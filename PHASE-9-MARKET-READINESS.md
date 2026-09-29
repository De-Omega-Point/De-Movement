# Phase 9 · Market Readiness + Pilot

Status: **Engineering gate complete · live cohort pilot ready to begin**

Build: **0.9.0**

## Purpose

Phase 9 turns the Phase 1–8 product into something suitable for controlled real-user testing.

The governing rule remains:

**Local core first. Cloud features are additive. Human decisions remain explicit.**

## Market-readiness work completed

### Installable PWA

De-Movement now includes:

- web app manifest
- installable app identity
- service worker
- versioned offline cache
- cached core movement engine
- cached Movement Passport and Flow Lab
- cached local Assistant
- offline fallback to the main application shell
- visible online/offline status
- install prompt support when the browser exposes it

Cloud-dependent features degrade gracefully when connectivity is unavailable.

### First-run onboarding

The first-run experience explains:

1. start locally;
2. build capability through Passport;
3. connect an account only when sync or coaching is useful.

An account is not required to begin using the core product.

### Privacy and pilot terms

The repository now includes:

- `privacy.html`
- `terms.html`

The pilot notice documents the local-first design, cloud sync boundary, Coach access, Assistant behaviour, feedback handling and account/data controls.

The current pilot is intended for adults 18+ unless a separately governed supervised program is created.

### Data portability and account lifecycle

The account surface includes separate controls for:

- exporting local browser data;
- clearing local browser data;
- exporting connected cloud data;
- deleting a connected cloud account.

Cloud account deletion runs through an authenticated Supabase Edge Function. It prevents deletion of the last active Administrator and uses server-side project secrets rather than exposing a privileged key to the browser.

Local data is not silently erased when a cloud account is deleted.

### Explicit pilot feedback

Pilot feedback is never collected in the background.

Participants may:

- save feedback locally;
- send feedback to the pilot backend when signed in;
- rate an experience from 1–5;
- identify the relevant product area;
- add a comment.

The pilot-feedback table is protected by RLS. A participant can read/delete their own submitted feedback. Administrators can review pilot feedback. A participant cannot forge another author ID or read another participant's feedback.

Live RLS acceptance result: **6 / 6 passed**.

### Privacy-light pilot dashboard

The Administrator console now exposes a Pilot tab using data already created intentionally through normal product use:

- active Movers
- training logs
- Flow logs
- readiness check-ins
- Passport use
- saved Flows
- average effort/control/confidence
- explicit feedback

No hidden clickstream, advertising tracker or third-party behavioural analytics SDK is required.

### Accessibility and device resilience

Phase 9 adds:

- skip-to-content navigation;
- visible keyboard focus;
- reduced-motion support;
- minimum coarse-pointer touch targets;
- responsive account/data-control surfaces;
- responsive onboarding and feedback dialogs;
- horizontally resilient mobile navigation.

## Security state

The existing Phase 7 role-security model remains in force.

The Phase 9 pilot-feedback RLS test verified:

- Mover can submit own feedback;
- Mover cannot forge another author;
- Mover cannot read another participant's feedback;
- Mover can delete own feedback;
- suspended account cannot submit feedback;
- Administrator can review pilot feedback.

The `delete-account` Edge Function is deployed with JWT verification enabled.

Supabase security advisors continue to flag the five intentionally exposed authenticated `SECURITY DEFINER` RPCs used by Coach invitation and Administrator actions. These are role-checked and were covered by the Phase 7 acceptance suite.

Leaked-password protection is reported as disabled; the pilot currently uses passwordless email authentication.

## Automated release gate

The Phase 9 CI gate verifies:

- installable manifest structure;
- offline core asset coverage;
- local Assistant in the offline cache;
- privacy and pilot terms;
- local-first onboarding language;
- local/cloud data controls;
- account deletion secret hygiene;
- pilot feedback migration and RLS declarations;
- Administrator pilot dashboard;
- accessibility CSS hooks;
- absence of common hidden analytics SDKs.

The complete Phase 1–9 test suite remains part of every push to `main`.

## What Phase 9 cannot honestly pre-complete

A real pilot requires real people and elapsed time.

Engineering readiness does **not** prove:

- first-time users understand the interface;
- people return to train over several days;
- Coaches find the Attention Queue useful in practice;
- offline behaviour works across every real phone/browser combination;
- users trust and understand Passport progression;
- willingness to pay;
- support load;
- real-world defect rate.

Those questions are the live pilot gate, not a code-generation task.

See `PILOT-RUNBOOK.md`.
