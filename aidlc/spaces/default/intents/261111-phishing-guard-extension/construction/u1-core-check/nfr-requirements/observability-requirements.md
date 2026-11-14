# Observability Requirements — u1-core-check

Based on `functional-spec.md`, `rules.md` and `requirements.md`, and the logging answer in `nfr-requirements-questions.md` (Q4). Each requirement carries its inception NFR ID with a sub-number.

| ID | Requirement | Source |
|----|-------------|--------|
| NFR2.8 | The extension logs only error kinds (the failure kinds from the error catalogue) and timings. It never logs the key, a page address, the signals or page content. | NFR2, Q4 |
| NFR2.9 | A debug setting, off by default, may add more detail such as which step ran; even with it on, the key, page addresses, signals and page content are never logged. | NFR2, Q4 |
| NFR3.4 | The time from visit start to shown result is recorded as a number in the debug output (not stored), so the 5-second target can be checked. | NFR3 |

## What Is Not Needed

- No remote monitoring, tracing or alerting: there is no server of ours.
- No local history of checks is kept or shown (the optional list in Q4 was not chosen).

## Health Signals

- The toolbar icon and popup are the health signal for the person: Could not check with its reason says what is wrong.
- The quality measurement (u5) is the signal for detection quality.

## Assumptions & Open Questions

- Whether a copyable "diagnostics" text for support is wanted is left for later; it would also need to avoid addresses and the key. [assumption]
