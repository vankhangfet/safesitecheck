# Unit Test Instructions — u1-core-check

How to run the tests for this unit, and what they must cover. Test-after: each layer is written and then tested (see the Testing Contract in `code-generation-plan.md`). Strategy: standard (about 5 to 8 tests per component, plus tests for key boundaries).

## Framework and Setup

- Runner: Jest with a TypeScript transform, run through npm.
- Page tests use jsdom; storage and browser extension calls are replaced by simple in-memory fakes in `src/test-support/`.
- Every call to Jev is mocked: no test uses a real key or the network. Test keys are obviously fake.
- Install once: `npm install`.

## Commands (scoped to this unit)

Run this unit's tests only:

```bash
npx jest --runInBand --testPathPatterns "src/(shared|core|adapters|background|content|popup|options)/"
```

Run the key scan and the content-bundle check (after a build):

```bash
npm run build
npm run check:key-scan
```

The coverage floor is not part of the unit-scoped run. It is set in the Jest configuration and checked by Build and Test on the full suite with:

```bash
npx jest --coverage
```

When that command exits non-zero only because of the 80% line threshold with every selected test passing, record that with this unit's results; it is not a failed test.

## Expected Coverage Targets

- 80% of lines for the whole project, checked by Build and Test on the full suite. Never lowered to make a run pass.
- For this unit's own paths, aim for at least 80% of lines; the unit-scoped command above lists them.

## What the Tests Cover

| Component | Tests (about) | Focus |
|-----------|---------------|-------|
| Shared types | 5 | Allowed values; Could not check needs a failure kind |
| Address handling | 8 | Query, fragment and login details removed; odd and very long addresses; checkable and not checkable pages |
| Mapping and reasons | 8 | Thresholds at, below and above 70% and 40%; confidence 0.6; other risk on top; fixed sentences; pure function |
| Request and answer handling | 6 | Request body holds only the address and three signals; unreadable shapes rejected |
| Jev adapter | 8 | Bearer key to the saved address only; 401, 429, 529, 400, network failure; no retry |
| Settings manager | 8 | Save and load; https only; permission denied; key handed out once; key never in events or logs |
| Visit store | 6 | Save and restore; restart gives a new attempt; missing state becomes a new visit |
| Verdict service | 10 | Timer from visit start; attempts and ended visits; Check again from answered and timed-out; missing key; checking published |
| Signal collector | 6 | Password field, card field, form to another site, none; no page text leaves |
| Popup and settings pages | 10 | States and wording; Show more; keyboard order; errors beside fields; live regions |
| Background wiring | 6 | Messages only from the extension; in-page address change starts a new visit; frames ignored |
| Build checks | 3 | No key-shaped text in the build or test output; collector bundle excludes the settings module; manifest permissions list |

## Mocking and Test Data

- Storage: an in-memory fake with the same calls as the browser's.
- Time: Jest fake timers, so the 5-second and 1-second limits are tested without waiting.
- Jev: a fake `fetch` that returns a chosen status and body; sample answers cover safe, phishing, scam, malware, other risk and low confidence.
- Pages: small HTML strings for the signal collector tests.
- No test data contains a real key or a real person's browsing.

## Manual Check (walking skeleton)

Run after the build and not part of the commands above: load `dist/` unpacked in current Edge and Chrome with a real Jev key; open a known safe site and a known phishing test page; confirm the icon and popup; remove the key and confirm "Could not check" with the key-missing reason.
