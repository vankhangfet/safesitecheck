# Code Generation Plan — u1-core-check

## Summary

- Builds: the first working slice of the extension: open a page, ask hosted Jev, show a verdict on the toolbar icon and popup, with a settings page for the source, key and address
- Touches: the project root (package files, build and test setup, manifest) and a new `src/` folder with the background process, page-side collector, popup and settings pages, plus tests next to the code; also adds project ignore lines to `.gitignore`
- Tests: about 60 Jest tests (5 to 8 for each of 9 components, including key boundaries), with every call to Jev mocked, and a check that no key-shaped text reaches the build

The plan builds the unit u1-core-check from the approved design: `functional-spec.md`, `rules.md` (BR1.1 to BR8.2), `entities.md`, `contract-summary.md` (C1, C3, C5, C6, C7), `performance-design.md`, `security-design.md`, `reliability-design.md` and the NFR requirements. Application code goes to the project root; this file is only the plan.

## Files This Plan Changes That Were Already in the Project

- `.gitignore`: add lines for `node_modules/`, `dist/`, `coverage/`, `*.log`, `.env`, `.env.*`, `*.pem`, `*.key` (not previously ignored).
- `README.md` and `AGENTS.md` are left as they are. This work's notes on what was built and how to run it go in `code-summary.md`.

## Decisions Carried In

- TypeScript, esbuild build script, Jest, npm, formatter and linter (tech-stack-decisions).
- Test-after: implement each layer, then write and run that layer's tests (Testing Contract below).
- Manifest V3 for Edge and Chrome from one code base; the Jev key is never in code, committed files or logs.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "Implement each testable layer, then write and run that layer's tests.",
  "scope": "mvp",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: test-after\n- **Ordering**: Implement each testable layer, then write and run that layer's tests.\n- **Methodology evidence**: The person chose \"write the code first, then the tests for it\" (Q3), matching the framework default for this scope.\n- Coverage: we keep an 80% line-coverage floor.\n- Gate: tests run and pass before merge.\n- Tooling: test runner not chosen yet; calls to Jev are mocked in tests."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Meet an 80% line-coverage floor.",
      "Run the selected tests in CI before merge."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:583936ff5e07d32d70b40ba1aa34479e94eeb6debdb4cca79169e4bcdf2ced3c",
  "contract_sha256": "sha256:2ed40dc34e79a9c2b43c3a677c45bb3dd532160f2e5201d9d889372790eb51a4"
}
```

## Steps

Layers that do not exist in this unit (a database and a data-access layer) are left out: the unit stores only a settings record and short-lived per-tab state, which are covered as the "data model" and "repository" steps below. Each implement step is followed by its tests.

- [x] **Step 1: Project structure and production configuration skeleton.** Create `package.json` (exact versions, scripts for build, test, lint, format check and key scan), `tsconfig.json`, the `src/` layout (`shared`, `core`, `adapters`, `background`, `content`, `popup`, `options`), `manifest.json` for Manifest V3, and the `.gitignore` additions. Implements: NFR5.1, NFR5.2, NFR8.1.
- [x] **Step 2: Bootstrap the minimal test runner and record the unit-scoped command.** Add Jest with a TypeScript transform and a `jest.config` with the 80% line floor set in `coverageThreshold` (applied only when run with `--coverage`); add one smoke test; record the exact scoped commands in `unit-test-instructions.md`. Implements: NFR7.1, NFR7.2, NFR7.3.
- [x] **Step 3: Data model — implement.** `src/shared/types.ts`: PageVisit, PageSignals, Verdict, Settings, failure kinds (including `missing-address`, `unsupported-page`, `permission-denied`, `internal-error`) and the closed lists. Implements: entities.md.
- [x] **Step 4: Data model — write and run its tests.** Tests for allowed values and constraints (a Could not check verdict always carries a failure kind). Covers: BR2.1.
- [x] **Step 5: Repository / data access — implement.** `src/background/settingsManager.ts` (settings and key in extension storage, key handed out for one request, address validation for https, optional permission request on save) and `src/background/visitStore.ts` (per-tab visit and attempt saved to session storage and restored). Implements: BR6.1 to BR6.8, BR8.2.
- [x] **Step 6: Repository / data access — write and run its tests.** Storage is mocked: save and load; key never leaves through events or logs; https only; permission denied path; restore after a restart; missing state becomes a new visit. Covers: AC5.1.1 to AC5.1.4, AC5.2.2, NFR2.2, NFR2.3, NFR6.3.
- [x] **Step 7: Business logic — implement.** `src/core/address.ts` (strip query, fragment and login details; checkable only for http and https outside the store sites), `src/core/mapping.ts` (BR2.2 pure function with named thresholds and the fixed reason sentences, BR2.3), `src/core/request.ts` (build the Jev request body from the typed CheckSubject and parse the answer into a closed shape), `src/background/verdictService.ts` (visit and attempt identity, the 5-second timer from visit start, late-answer guard, Check again, publish checking and verdict events, missing-key and missing-address handling). Implements: BR1.1 to BR1.5, BR2.1 to BR2.4, BR3.1 to BR3.3, BR5.1 to BR5.9, BR7.3, BR7.6, BR8.1.
- [x] **Step 8: Business logic — write and run its tests.** Address stripping (query, fragment, login details, odd characters); checkable pages; mapping at and around 70% and 40% and the 0.6 confidence value; request shape; each failure kind; timer with fake time; superseded attempts and ended visits; Check again from answered and timed-out. Covers: AC1.1.1 to AC1.1.5, AC1.2.1, AC1.3.1 to AC1.3.3, AC2.2.2, AC2.2.3, AC4.1.1 to AC4.1.3, AC4.2.1 to AC4.2.3, AC4.3.1 to AC4.3.4, AC6.1.2, NFR1.1, NFR3.1, NFR6.1, NFR6.2, NFR6.4, NFR6.5.
- [x] **Step 9: API / endpoint — implement.** `src/adapters/jevAdapter.ts` (one POST to the saved https address with the bearer key, status-to-failure mapping, no retry, validated answer) and `src/background/background.ts` (tab and navigation events, messages with the popup and the page-side collector accepted only from the extension itself, in-page address change handling). Implements: BR7.1, BR7.2, BR7.3, C1, C3, C5, C6, C7.
- [x] **Step 10: API / endpoint — write and run its tests.** The service is mocked: request sent to the saved address only with the bearer key; 401, 429, 529, 400, network failure and unreadable answers; no second request; messages from other senders ignored; in-page address change starts a new visit. Covers: AC5.1.2, AC6.1.1, AC6.1.3, NFR2.1, NFR2.3, NFR2.7.
- [ ] **Step 11: Frontend behavior — implement.** `src/content/signals.ts` (the three yes/no signals, once per visit, a 1-second wait handled by the caller), `src/popup/` (popup page: verdict, reason with Show more, Check again, Settings link, live region), `src/options/` (settings page: source, key with show or hide, address with the notice about what is sent, Save, Test connection, status live region, first-run hint) and the toolbar icon drawing (shield with symbol and badge text, accessible name). Implements: BR4.1 to BR4.5, BR6.4 to BR6.7, BR7.4, BR7.5, BR8.1.
- [ ] **Step 12: Frontend behavior — write and run its tests.** jsdom: signal detection on sample pages (password field, card field, form to another site, none); popup states (checking, safe, suspicious, dangerous, could not check, expanded reason); Check again; settings validation errors beside fields with typed values kept; keyboard order; status messages in live regions. Covers: AC2.1.1 to AC2.1.4, AC2.2.1, AC5.1.4, AC5.2.1 to AC5.2.3, NFR3.2, NFR4.1 to NFR4.3.
- [x] **Step 13: Environment/build configuration.** `esbuild` build script producing `dist/` for the browser (background, content script, popup, options), a key scan script that fails if a key-shaped string is found in `dist/`, tests or test output, and a check that the content-script bundle does not include the settings module; lint and format configuration. Implements: NFR2.6, NFR8.2, NFR8.3, logging rules NFR2.4, NFR2.8, NFR2.9.
- [x] **Step 14: Documentation and traceability.** In-code comments for non-obvious decisions, `code-summary.md` (what was built, how to build, load unpacked in Edge and Chrome, and run the tests, with the manual check for the walking skeleton) and `traceability.json`, plus `source-manifest.json` listing every source path this unit created or changed.

## Manual Integrated Check (the walking skeleton demo)

Loaded unpacked in current Edge and Chrome with a real Jev key: open a known safe site and a known phishing test page; see the verdicts on the toolbar icon and popup; remove the key and see "Could not check, a key is missing". This is run by you after the build and recorded at the checkpoint.

## Story Traceability

| Plan steps | Stories |
|------------|---------|
| 1 to 4, 13 | Foundations for all stories; NFR5, NFR7, NFR8 |
| 5, 6 | US5.1, US5.2 |
| 7, 8 | US1.1, US1.2 (fresh check), US1.3, US2.2 (recheck), US4.1, US4.2, US4.3 |
| 9, 10 | US6.1, parts of US1.1, US4.3 |
| 11, 12 | US2.1, US2.2, US5.1, US5.2 |
| 14 | All |

## Assumptions & Open Questions

- Exact dependency versions are chosen when the packages are installed; they are pinned and recorded in `package.json` and the lock file. [assumption]
- The linter and formatter pair is ESLint and Prettier unless the install shows a better fit. [assumption]
- The toolbar icon's four states are drawn at run time on a canvas; the static icon images in the manifest are small generated files. [assumption]
- The Jev request wording for `state` and the criteria text follow contract C7 and BR7.6. [assumption]
