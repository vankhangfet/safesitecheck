# Bolt Plan

A Bolt is one build pass over a piece of the work, ending in something that runs. This plan orders five Bolts, one for each unit of work from Units Generation. It builds on `requirements.md` (the requirements it must deliver), `components.md` (the building blocks each Bolt builds), `unit-of-work.md`, `unit-of-work-dependency.md`, `contract-summary.md` and the answers in `delivery-planning-questions.md` (Q1 to Q8).

A walking skeleton is a minimal version that runs the whole way through, built first to prove the pieces connect before real features go in. Bolt 1 is the walking skeleton. [team practices, Q3 units-generation]

## Order

| Bolt | Unit | Marker | Why here |
|------|------|--------|----------|
| B1 | u1-core-check | Walking skeleton | First thin slice; every other unit depends on it |
| B2 | u5-quality-measurement | none | Risk first: shows early whether Jev's judgment reaches the targets [Q1] |
| B3 | u2-page-warnings | none | Banner and overlay on risky pages |
| B4 | u4-openjev-source | none | Second verdict source |
| B5 | u3-verdict-memory | none | Remembers recent verdicts; added last [Q1] |

All five Bolts respect the dependency graph: each of B2 to B5 depends only on u1-core-check. The order is not the only valid one; it is chosen for risk, as explained in `risk-and-sequencing-rationale.md`. [Q1] Bolts run one at a time. [Q4] There is one Bolt per unit. [Q3]

## B1. u1-core-check (walking skeleton)

- **Units**: u1-core-check (PageWatcher, VerdictService, JevAdapter, SettingsManager, BrowserPresenter).
- **Definition of Done**:
  - Opening a page triggers a check automatically, for top-level pages only.
  - Hosted Jev is asked with the address (query string removed) and the three yes/no signals, and a Safe, Suspicious, Dangerous or Could not check verdict shows on the toolbar icon and in the popup within 5 seconds.
  - The key and server address are entered on the settings page and stored on the device only; the key never appears in code, committed files or logs.
  - Pages that cannot be checked, a missing key, no connection, a rate limit and an unreadable answer each show Could not check with their own reason.
  - Late answers never show on the wrong page.
  - Tests for this unit pass and cover at least 80% of its lines, with Jev calls mocked.
- **Confidence hypothesis**: the extension can call Jev directly from the browser, with its key sent from the person's device, and get a usable answer fast enough. Shipping B1 also tests the open questions on browser permissions and cross-origin calls.
- **Expected demo**: load the extension unpacked in Edge and Chrome, enter a real key, open a known safe site and a known phishing test page, and see the verdicts appear on the icon and popup.
- **Real integrated check**: the demo above, run by hand against real Jev with a valid key, in both browsers.
- **Prerequisites**: a working Jev key (in place [Q8]); the contract summary C1 to C7; a test runner chosen at Code Generation.

## B2. u5-quality-measurement

- **Units**: u5-quality-measurement (QualityMeasurement).
- **Definition of Done**: running the tool over public lists of known phishing and legitimate addresses reports the share of phishing addresses flagged, the share of legitimate addresses flagged and the count that could not be checked; the numbers can be compared with the 90% and 1% targets; the tool runs outside the browser using the same check and mapping as the extension.
- **Confidence hypothesis**: Jev, given only the address and three signals, reaches at least 90% detection with at most 1% false alarms. If it does not, we learn it before building warnings on top.
- **Expected demo**: a printed report from a run over a public list.
- **Prerequisites**: B1 done; public lists chosen (not yet [Q5]); a rate-limit-safe way to run many requests.

## B3. u2-page-warnings

- **Units**: u2-page-warnings (PageWarningPresenter).
- **Definition of Done**: Suspicious pages show a slim dismissible banner; Dangerous pages show a large overlay with Go back and Continue anyway; Escape acts as Go back; focus is trapped in the overlay and restored on close; the warnings look the same on any page and are not broken by page styles; Continue anyway lasts one page load; the toolbar icon keeps showing the risk after a warning is dismissed.
- **Confidence hypothesis**: warnings can be shown correctly on arbitrary websites without being broken by them, and the broad permission needed to run on all websites is acceptable.
- **Expected demo**: a known risky test page shows the banner and the overlay, and both can be dismissed with keyboard only.
- **Prerequisites**: B1 done.

## B4. u4-openjev-source

- **Units**: u4-openjev-source (OpenJevAdapter).
- **Definition of Done**: choosing hosted OpenJev in settings makes checks go to the entered server with the same request and answer shape as hosted Jev; the same failure reasons are shown; Test connection works for it.
- **Confidence hypothesis**: the hosted OpenJev server accepts the same requests as TypeSafe's Jev, as assumed. If not, the contract is revised.
- **Expected demo**: switch the source to OpenJev, open a page and see a verdict.
- **Prerequisites**: B1 done; a hosted OpenJev server (not yet in place [Q5]).

## B5. u3-verdict-memory

- **Units**: u3-verdict-memory (VerdictMemory).
- **Definition of Done**: a verdict is reused for one hour for the same source and address; two addresses that differ only by query string share one entry; remembered verdicts are cleared when the source, key or server address changes; Could not check is not remembered unless Functional Design decides otherwise; the key is never stored.
- **Confidence hypothesis**: reusing verdicts reduces repeat calls without showing stale or wrong-source results.
- **Expected demo**: open the same site twice and see that the second check makes no new request; change the source and see the next check go out again.
- **Prerequisites**: B1 done.

## Construction Settings

- New work keeps the defaults: one unit at a time, with a checkpoint after each unit and serial execution. Nothing is changed here.
- The project check that verifies each finished unit is not chosen yet; it is chosen at the first checkpoint, once B1 exists and a test runner is chosen. [Q7]

## Assumptions & Open Questions

- Whether hosted OpenJev matches the Jev request shape is unconfirmed until B4. [assumption]
- B2 may hit Jev's rate limits when running many addresses; how to pace the run is decided in Functional Design. [assumption]
- The final choice of test runner and bundler is made when B1 is built. [assumption]
