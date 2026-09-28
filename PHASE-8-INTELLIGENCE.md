# Phase 8 · De-Movement Intelligence + Coach Assistant

Status: **Complete · deterministic intelligence layer verified**

## Purpose

Phase 8 turns De-Movement's accumulated evidence into explainable assistance without handing control to a black box.

The governing pattern is:

**Evidence → Signal → Explanation → Suggested action → Human decision**

## Mover Assistant

The Mover Assistant can answer:

- Why is this session being suggested?
- What should I work on next?
- Give me an easier option.
- Show my Passport progress.
- Explain a specific pathway such as Handstand, Planche, Front Lever, Compression, Locomotion, Soft Acrobatics or Mobility.

The Assistant reads:

- training profile and goals
- latest readiness
- recent completed sessions and Flows
- Movement Passport state
- current composed session
- active Coach assignments

It may load a proposed session into the chooser only after the Mover explicitly presses the action button.

It cannot:

- auto-start a workout
- auto-mark a Passport node Ready or Mastered
- make a medical diagnosis
- silently alter goals
- override a Coach assignment

## Coach Assistant

The Coach Portal now includes an Attention Queue across active assigned Movers.

Current signal families include:

- explicit Mover review flag
- recent high soreness
- recent low energy
- repeated very-high effort
- repeated low control
- repeated low confidence
- training gap against the Mover's stated routine
- high-effort / low-control mismatch
- Passport nodes waiting at Ready
- overdue Coach assignments
- no strong signal

Queue labels are:

- Review first
- Follow-up
- Watch
- Steady

These labels prioritise review. They are not clinical severity ratings.

For a selected Mover, the Coach can ask:

- Why does this Mover need attention?
- What changed?
- What could I assign?
- Show Passport progress.
- Ask about a specific pathway.

A proposed session may be loaded into the existing assignment form, but it is **never saved or assigned automatically**.

## Week-over-week intelligence

Phase 8 compares the current seven days with the preceding seven days for:

- sessions
- minutes
- average effort
- average control
- average confidence

The comparison is descriptive. The Assistant does not infer injury, motivation, mental state or medical condition.

## AI architecture

The current intelligence engine is deterministic and auditable. This is intentional.

A future generative language model may sit **after** the signal engine to improve phrasing or conversational flexibility, but:

1. the deterministic evidence/signal result remains the source of truth;
2. model credentials must live server-side;
3. the generative layer must not gain direct permission to change Passport state, create assignments or mutate training data;
4. all consequential actions remain separate explicit user/Coach actions.

No model API key is committed to the browser or GitHub.

## Verification

Phase 8 automated verification covers:

- attention-signal ordering
- readiness review priority
- repeated high-effort / low-control / low-confidence signals
- next-capability answers
- easier-variation answers
- pathway explanations
- Coach week-over-week explanation
- Coach assignment proposals
- steady/no-manufactured-problem behaviour
- queue ordering
- Mover Assistant UI integration
- Coach Assistant UI integration
- human-approval controls

The existing Phase 1–7 suite also remains part of the Phase 8 gate.
