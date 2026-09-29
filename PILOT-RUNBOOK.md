# De-Movement Pilot Runbook

## Pilot goal

Validate that adults can use De-Movement to choose, complete, understand and track movement training without requiring constant founder assistance.

The pilot should test the product, not manufacture positive feedback.

## Cohort

Recommended first cohort:

- **5–10 adults**
- mixture of self-directed Movers and, if available, at least one Coach↔Mover relationship
- participants capable of giving informed feedback on the pilot
- no requirement to perform skills beyond their normal safe movement capability

The general pilot is 18+.

## Duration

Run the first cohort for **7–14 days**.

That is long enough to observe repeat use, readiness check-ins, multiple sessions and some Passport/Flow interaction without turning the first pilot into a research expedition.

## Day 0

Ask each participant to:

1. open/install De-Movement;
2. complete first-run onboarding;
3. choose goals and preferred session length;
4. complete a readiness check-in;
5. build and complete one session;
6. save the reflection;
7. explore the Movement Passport;
8. send one piece of explicit feedback.

Do not coach the interface unless the person is genuinely stuck. Friction is evidence.

## During the pilot

Participants should use De-Movement naturally.

Useful activities include:

- 2+ completed sessions where appropriate;
- at least one readiness check-in;
- inspect Passport progression;
- try Flow Lab if relevant to their movement level;
- use the Assistant for a real question;
- use offline mode at least once after the app has been loaded online;
- submit feedback when something helps or gets in the way.

For Coach participants:

- invite a Mover;
- review the Attention Queue;
- inspect evidence;
- load a proposed assignment;
- decide whether to assign it;
- add a private Coach note.

## Administrator review

Use the Pilot tab to review aggregate product signals already created through normal use.

Do not infer health, motivation or ability from usage volume alone.

Look for:

- failed or abandoned workflows reported by users;
- repeated confusion around onboarding;
- sessions that cannot be completed because of UI defects;
- unclear Passport progression;
- Assistant answers users find unhelpful or misleading;
- coaching workflows that require workarounds;
- account, sync or offline failures;
- privacy or trust concerns.

## Issue severity

### Blocker

Examples:

- cross-account data exposure;
- data loss with no recovery path;
- account deletion deletes the wrong account;
- core session cannot run;
- Passport can be silently auto-promoted;
- app becomes unusable offline after being installed/cached.

A Blocker pauses the pilot.

### Major

Examples:

- common workflow cannot be completed without a workaround;
- repeated sync conflict;
- mobile controls are unusable on a common device;
- Coach assignment does not reach the Mover;
- feedback or export repeatedly fails.

### Minor

Examples:

- copy confusion;
- cosmetic overflow;
- non-blocking layout defect;
- unclear label;
- isolated visual inconsistency.

## Suggested pilot exit criteria

Before a broader public launch, aim to establish:

- **zero unresolved Blockers**;
- no known cross-account security breach;
- no known unrecoverable training-data loss;
- core session completion works on the tested phone/desktop mix;
- local Assistant remains usable offline after caching;
- account deletion/export is understandable to testers;
- most participants can start a first session without founder intervention;
- feedback identifies no recurring confusion that makes the core value proposition unclear;
- Coach participants can complete invite → review → assign → Mover completion without a manual database workaround.

Do not use a single satisfaction average as the launch decision. Read the comments and failure modes.

## Device matrix

At minimum include:

- iPhone Safari / installed web app
- Android Chrome / installed PWA
- desktop Chrome
- desktop Safari if available
- tablet layout if a participant has one

Test:

- portrait and landscape where relevant;
- online → offline → online;
- page reload while offline;
- interrupted session;
- service-worker update after a new deployment;
- sign-in magic link;
- local-only use with no account.

## Pilot closeout

At the end of the cohort:

1. export Administrator pilot metrics;
2. review every submitted feedback item;
3. group issues by workflow rather than by person;
4. resolve all Blockers;
5. decide whether Major issues require another small cohort;
6. record the tested device/browser matrix;
7. update the public-launch checklist.

The pilot is complete only when real-world evidence exists. A green CI run is necessary, but it is not a substitute for people.
