# Code Summary — u1-core-check

The first working slice of the extension: open a page, ask hosted Jev, show a verdict on the toolbar icon and popup, with a settings page for the source, key and server address. Built from the approved plan `code-generation-plan.md` (14 steps, all ticked), test-after.

## What Was Built

Application code is at the project root (not in this record folder).

| Area | Files |
|------|-------|
| Project setup | `package.json`, `package-lock.json`, `.npmrc` (exact versions), `tsconfig.json`, `tsconfig.test.json`, `jest.config.cjs` (80% line floor), `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `manifest.json` (Manifest V3), `.gitignore` (lines added) |
| Build and checks | `scripts/build.cjs`, `scripts/checkBuild.cjs` (permissions and page-script bundle check), `scripts/keyScan.cjs` (no key-shaped text), `scripts/icons.cjs` (generated icon files), `scripts/jestHtmlTransform.cjs` |
| Shared | `src/shared/types.ts` (entities and closed lists), `contracts.ts`, `logger.ts` (error kinds and timings only), `browser.ts` |
| Core logic | `src/core/address.ts`, `mapping.ts` (pure mapping from probabilities to labels), `reasons.ts`, `request.ts`, `verdict.ts` |
| Jev adapter | `src/adapters/jevAdapter.ts` (one request, bearer key, https only, no retry) |
| Background process | `settingsManager.ts` (only reader of the key), `visitStore.ts` (per-tab state in session storage), `verdictService.ts` (5-second timer, attempts, late-answer guard), `pageWatcher.ts`, `toolbarIcon.ts`, `wiring.ts`, `chromeEnv.ts`, `background.ts` |
| Page script | `src/content/signals.ts`, `collector.ts`, `content.ts` (three yes/no signals only) |
| Screens | `src/popup/` (popup), `src/options/` (settings page) |
| Test support | `src/test-support/` (fakes for storage, browser calls and pages) |

## How to Build, Load and Test

- Install: `npm install`
- Build: `npm run build` (writes `dist/`)
- Load: in Edge or Chrome, open the extensions page, switch on developer mode, choose "Load unpacked" and pick the `dist/` folder, then open the extension's settings and enter your Jev key (the server address starts as `https://api.typesafe.ai`).
- Unit tests: `npx jest --runInBand --testPathPatterns "src/(shared|core|adapters|background|content|popup|options)/"`
- Other checks: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run check:key-scan`
- Coverage on the full suite (the 80% floor is enforced here): `npx jest --coverage`

## Results Recorded in This Stage

| Check | Result |
|-------|--------|
| Unit tests | 18 suites, 259 tests, all passed (re-run by the conductor) |
| Full-suite coverage | 97.54% of lines against the 80% floor; the only uncovered files are four tiny entry files (`background.ts`, `content.ts`, `popup.ts`, `options.ts`) that only connect tested modules |
| Lint, format, type check | Passed |
| Build | Passed; four bundles; the page-side bundle contains no settings module or adapter; manifest permissions are `storage` and `tabs`, with `https://*/*` as an optional permission |
| Key scan | Passed; 106 files checked, nothing key-shaped |
| `npm audit` | 26 findings (4 low, 22 moderate) in dev tooling only (the test runner and linter); 0 in what ships. The suggested forced fix would downgrade Jest, so it was not applied |

## Key Implementation Decisions

- The adapter returns the chosen option, confidence and probabilities; the mapping to Safe, Suspicious or Dangerous lives in one pure function with named thresholds (BR2.2).
- One 5-second timer starts at the start of the visit; Check again starts a new attempt; answers for ended visits or older attempts are discarded.
- Only the settings manager reads the key; it reaches the adapter inside one connection result for one request. The adapter refuses redirects, sends only to the saved https address and never retries. Logs accept only an error kind, a number or a step name.
- Messages are accepted only from the extension itself; the page script reports only three yes/no signals.
- The settings page never shows the stored key; it has "Remove saved key".

## Tests Written but Not Run in This Stage

- The manual walking-skeleton check (load unpacked in Edge and Chrome, real Jev key, a safe site and a phishing test page, then remove the key) has not been run; it needs a browser and a real key.
- Not checked against the real service or a real browser: calling Jev directly from the extension (browser permission and cross-origin behaviour), drawing the icon on a canvas in the background process, behaviour of tab updates on reloads and in-page address changes, and the 50 ms page budget.

## Deviations From the Plan

- Jest 30 renamed the path filter flag; the working command is `--testPathPatterns` (shown above). `unit-test-instructions.md` was updated to match.
- More tests than planned (259 against about 60) because several components use table-driven cases.
- Extra files added so the wiring can be tested without a browser (`pageWatcher.ts`, `toolbarIcon.ts`, `wiring.ts`, `chromeEnv.ts`, `popupApi.ts`, `collector.ts`, `src/test-support/`, `scripts/`) and two linter companion packages (`@eslint/js`, `typescript-eslint`). One extra `.gitignore` line (`.tmp-jest-out/`).

## Known Limits and Open Items

- Hosted OpenJev is not in this unit: choosing it ends in Could not check with an internal-error reason, and Test connection says it is not available yet (u4-openjev-source adds it).
- Statuses outside the contract list (for example 500) are reported as an unreadable answer.
- A page that is slow to become ready may report all three signals as no if the page script is not ready within 1 second.
- After the background process restarts, restoring waits for unfinished checks (up to about 5 seconds) before handling new tab events.
- The `npm audit` findings are in dev tools only; track them or wait for upstream fixes.
