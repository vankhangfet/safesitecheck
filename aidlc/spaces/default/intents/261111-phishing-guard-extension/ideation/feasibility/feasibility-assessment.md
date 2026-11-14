# Feasibility Assessment

Builds on `intent-statement` (ideation/intent-capture/intent-statement.md): protect an organisation's employees from phishing, scam, malware and other risky sites in Edge and Chrome, using Jev / OpenJev, with warn-only behaviour in the first version.

## Verdict

**Feasible, with conditions.** The first version looks achievable in the stated time frame, provided the conditions below are checked early.

## Technical Viability

| Area | Assessment | Basis |
|------|------------|-------|
| Skills | Good fit: the builder is comfortable with JavaScript / TypeScript, the usual language for browser extensions | [Q1] |
| Jev access | Good: an API key for the hosted TypeSafe Jev already exists, and OpenJev on-prem is a fallback | [Q2] [Q5] |
| Data sent for checks | Low exposure: only the website address, with query strings removed, is sent | [Q3] |
| Timeline | Tight: a few days for the first version, so scope must stay small (warn only, one risk judgment path) | [Q8] |
| Rollout | Simple: each person installs from the public Edge or Chrome store; no managed deployment needed in the first version | [Q6] |

## Risk Analysis

| Risk | Likelihood | Impact | Note |
|------|------------|--------|------|
| Jev's verdict quality on the four risk kinds (phishing, scam, malware, general risk) is not known; the success target of few false alarms may not be met | Medium | High | Needs a labeled sample of pages; thresholds are not yet defined [assumption] |
| A few days is short for all four risk kinds | Medium | Medium | Mitigate by shipping a thin first slice and widening later |
| Public store publishing can take longer than the build and has its own review rules | Medium | Medium | Not confirmed with the stores; a hand-loaded pilot is a possible stopgap |
| Jev (hosted) is a third-party service; its availability, limits and terms were not checked in this stage | Medium | Medium | Listed as an open item |
| Sending visited addresses to a third party may need approval by the organisation, even though no blockers are known today | Low | High | [Q3] [Q4] [Q7] say none known; worth confirming once before rollout [assumption] |

## Conditions for Proceeding

- Obtain a small labeled sample of known-bad and known-good sites to measure the success target.
- Confirm Jev's usage limits and terms for this use.
- Decide the "few days" scope boundary in the next stage (Scope Definition).

## Assumptions & Open Questions

- The labeled sample, its owner and its size have not been defined. [assumption]
- Jev usage limits, pricing beyond free use and terms of service were not checked. [assumption]
- The "none known" answers on rules and approvals reflect today's knowledge and may change once an organisation-wide rollout is planned. [assumption]
