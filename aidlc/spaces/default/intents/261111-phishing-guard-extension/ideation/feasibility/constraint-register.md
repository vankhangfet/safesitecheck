# Constraint Register

Derived from `intent-statement` and the confirmed answers in `feasibility-questions.md`.

| ID | Type | Constraint | Source |
|----|------|------------|--------|
| C1 | Technical | Targets Edge and Chrome only | [desc] |
| C2 | Technical | The first version warns only; it does not block pages | Intent capture answer (Q7 there), recorded in intent-statement |
| C3 | Technical | Builder skills are JavaScript / TypeScript | [Q1] |
| C4 | Technical | Verdicts come from Jev (hosted, API key held) or OpenJev hosted on-prem | [Q2] [Q5] |
| C5 | Data | Only the website address, with query strings removed, may be sent for a check | [Q3] |
| C6 | Organisational | Time frame for the first version is a few days | [Q8] |
| C7 | Organisational | Distribution is by individual installs from the public Edge or Chrome store | [Q6] |
| C8 | Regulatory | No regulatory or policy constraints known today | [Q4] |
| C9 | Organisational | No blockers or approvals known today | [Q7] |

## Assumptions & Open Questions

- Constraints C8 and C9 hold only as far as known today and should be re-checked before an organisation-wide rollout. [assumption]
