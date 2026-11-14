# External Dependency Map

Things outside this project that a Bolt needs. A Bolt is one build pass over a piece of the work, ending in something that runs. Based on `bolt-plan.md`, `contract-summary.md` and the answers in `delivery-planning-questions.md`.

| # | Dependency | Owner | Needed by | In place today? | Lead time | If it slips |
|---|------------|-------|-----------|-----------------|-----------|-------------|
| D1 | A TypeSafe Jev key that works for this use | You, with TypeSafe | B1, B2 | Yes, by your earlier answer (Q8) | Not known | B1 and B2 cannot show real verdicts; use mocked answers for code and tests, but the integrated check needs the key |
| D2 | TypeSafe's Jev service, its limits and its terms | TypeSafe | B1, B2 | Not checked | Not applicable | A rate limit slows B2; a terms issue could block use for this purpose; check before B2 |
| D3 | Browser permissions: calling the Jev address, and running on all websites | Edge and Chrome, and the store reviewers | B1, B3 | Not tested | Store review time unknown | Fall back to a small server that holds the key, or narrow what the warnings do; both are design changes |
| D4 | Public lists of known phishing and legitimate sites | You | B2 | Not chosen (Q5) | Not applicable | B2 cannot report numbers; choose the lists before B2 |
| D5 | A hosted OpenJev server | You | B4 | Not in place (Q5) | Not known | B4 waits; the other Bolts do not |
| D6 | OpenJev's request and answer shape | The OpenJev server's owner | B4 | Assumed same as Jev, unconfirmed | Not applicable | The contract is revised in B4 |
| D7 | A developer account for the Edge Add-ons store | You | Release | No (Q5) | Not known | Release cannot happen; does not block any Bolt |
| D8 | A developer account for the Chrome Web Store | You | Release | No (Q5) | Not known | Release cannot happen; does not block any Bolt |
| D9 | A test runner and a bundler | You and the developer agent | B1 | Not chosen | Not applicable | Chosen when B1 is built; nothing is blocked outside B1 |

## Notes

- D1 is the only item that blocks the first Bolt, and it is in place by your answer.
- D2 and D3 are real risks for B1 and B2 even though nobody outside the project owns a delay: they are unknowns the first Bolt tests.
- Store accounts (D7, D8) do not block any Bolt but block release; setting them up takes unknown time, so starting them early is wise.

## Assumptions & Open Questions

- Jev's rate limits and terms were not checked in this stage. [assumption]
- Lead times for store accounts and store review are unknown. [assumption]
