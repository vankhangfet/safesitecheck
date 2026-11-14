# Scope Document

Builds on `intent-statement`, `feasibility-assessment` and `constraint-register`.

## Scope Boundary

### In scope (first version)

| ID | Capability | Priority | Source |
|----|------------|----------|--------|
| S1 | Check the address of the page being visited with Jev and show a clear verdict (safe, suspicious or dangerous) | Must | [Q1] |
| S2 | Show a warning on the page itself when a site is judged risky | Must | [Q1] |
| S3 | Give a short reason for each verdict | Must | [Q1] |
| S4 | A simple settings page to enter the Jev key or server address | Must | [Q1] |
| S5 | Support both hosted Jev and hosted OpenJev as verdict sources | Must | [Q2] |
| S6 | Measure detection quality on public lists of known phishing and legitimate sites | Must (supports the success metric) | [Q5] |

### Deferred (not in the first version)

| ID | Capability | Priority | Source |
|----|------------|----------|--------|
| D1 | Quick checks on the device before calling Jev (for example, look-alike addresses) | Could | [Q1] (not selected) |
| D2 | A list of trusted sites that are never flagged | Could | [Q1] (not selected) |

### Out of scope

| Item | Source |
|------|--------|
| Automatically blocking pages (warn only) | intent-statement (boundary confirmed in intent capture) |

## Sequencing

Value first: show a verdict to the user as early as possible, then measure quality and widen. [Q3]

## Deadlines and Timeline

- No hard deadline beyond the earlier "few days" statement. [Q4]
- The user chose to keep the full scope above (both backends and all four chosen capabilities); the time frame can stretch beyond a few days if needed. This replaces the earlier few-days expectation in the feasibility assessment. [Q6]

## Constraints Carried Forward

- Only the website address, with query strings removed, is sent for a check (constraint-register C5).
- Edge and Chrome only; installed from the public store (constraint-register C1, C7).

## Assumptions & Open Questions

- "Safe, suspicious or dangerous" are working labels; the exact set of verdicts is to be settled in requirements. [assumption]
- The size of the public lists and the pass/fail thresholds for the success metric are not yet defined. [assumption]
- The stretched time frame has no new target date. [assumption]
