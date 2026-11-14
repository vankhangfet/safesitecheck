# RAID Log

Based on `intent-statement` and the feasibility questions.

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Jev may miss real threats or raise false alarms on some of the four risk kinds | Medium | High | Measure on a labeled sample early |
| R2 | A few days is too short for all four risk kinds | Medium | Medium | Ship a thin first slice, widen later |
| R3 | Public store review delays availability | Medium | Medium | Hand-loaded pilot as a stopgap |
| R4 | Hosted Jev limits, pricing or terms block use | Medium | Medium | Check terms; OpenJev on-prem as fallback |

## Assumptions

| ID | Assumption |
|----|------------|
| A1 | A labeled sample of known-bad and known-good sites can be obtained. [assumption] |
| A2 | Sending only the website address to Jev is acceptable to the organisation. [assumption] |
| A3 | No rules or approvals apply today, as stated in the answers. [Q4] [Q7] |

## Issues

| ID | Issue |
|----|-------|
| I1 | None raised so far. |

## Dependencies

| ID | Dependency |
|----|------------|
| D1 | Access to hosted TypeSafe Jev with an existing API key [Q2] |
| D2 | Edge and Chrome extension stores for distribution [Q6] |
| D3 | Optional on-prem hosting of OpenJev if the hosted service is not used [Q5] |

## Assumptions & Open Questions

- A1 and A2 are unconfirmed and should be settled in later stages. [assumption]
