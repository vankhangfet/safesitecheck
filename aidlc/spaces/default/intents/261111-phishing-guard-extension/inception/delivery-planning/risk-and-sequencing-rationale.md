# Risk and Sequencing Rationale

A Bolt is one build pass over a piece of the work, ending in something that runs. A walking skeleton is a minimal version that runs the whole way through, built first to prove the pieces connect. This file explains why the Bolts in `bolt-plan.md` are in this order. It builds on `unit-of-work-dependency.md` and the answers in `delivery-planning-questions.md`.

## Heuristic Used

- **First Bolt: walking skeleton first** (Cockburn, *Crystal Clear*). Your practice is to build the thin end-to-end slice first. u1-core-check is that slice and every other unit depends on it. [team practices]
- **Remaining Bolts: risk first** (Boehm, Spiral Model): do the work that settles the biggest uncertainty earliest. [Q1]
- No formal scoring model (such as WSJF, which ranks work by value, urgency and risk reduction against size) is used; the order is a plain judgment. [Q2]

## The Order and the Reasoning

1. **B1 u1-core-check** proves the riskiest connection first: the extension asking Jev from the browser and showing a verdict. It also settles the open questions on direct browser calls and permissions.
2. **B2 u5-quality-measurement** goes second because your biggest worry is whether Jev can judge well from the address and a few signals. [Q6] Everything else you build is only worth it if the numbers reach 90% and 1%. Learning this before building warnings, a second source and memory avoids investing in work that depends on it.
3. **B3 u2-page-warnings** comes next because it is the main visible protection and carries its own risks (broad permission, rendering on any page).
4. **B4 u4-openjev-source** follows; it depends on a server that is not yet in place and an API shape that is unconfirmed, so it is less urgent than it looks.
5. **B5 u3-verdict-memory** is last: it is a performance and cost improvement, not a protection, and it is small.

## Dependency Check

Every Bolt after B1 depends only on u1-core-check, so any order of B2 to B5 respects the dependency graph. The chosen order does not depart from a valid topological order, so no deviation needs justifying.

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Value first: warnings next | Users get protection sooner, but warnings would be built before we know whether the verdicts are good enough to warn about |
| OpenJev next | Early second source, but the server is not in place and its shape is unconfirmed |
| Bundle u3 and u4 into one Bolt | Fewer Bolts, but mixes two unrelated pieces and delays a clear result [Q3] |

## Risk Register for the Plan

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Jev's judgment from the address and three signals falls short of 90% and 1% | Medium | High | B2 measures it early; the contract allows adding signals or content later by changing C5 |
| The browser blocks direct calls to Jev, or the permissions are rejected by stores | Medium | High | B1 tests the call; B3 tests the permissions; fall back to a small server holding the key if needed (a design change) |
| No reason text comes back from Jev (it returns only the chosen option, confidence and probabilities) | High | Medium | Settle in Functional Design who writes the reason |
| The quality run hits Jev rate limits | Medium | Medium | Pace the run; no automatic retry in the extension itself |
| Store accounts and review time delay release | Medium | Medium | Not in the plan's Bolts; set up accounts before release |
| Page signals cannot be collected on all pages | Low | Medium | Tested in B1 and B3 |

## Assumptions & Open Questions

- The 90% and 1% targets are met only if Jev's judgment is good enough; B2 is where this is decided. [assumption]
- The order of B3 to B5 may change after B2 shows what Jev can do. [assumption]
