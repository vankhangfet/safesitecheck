<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations

- 2026-11-14 u1-core-check: adapters return the chosen option, confidence and probabilities (a RiskAnswer); VerdictService maps them to a label with the pure function (functional spec W1 step 7), not the label as contract C1 text says.
- 2026-11-14 u1-core-check: a status other than 200, 400, 401, 413, 415, 422, 429 or 529 (for example 500) maps to unreadable-answer, since the error catalog has no kind for it.
- 2026-11-14 u1-core-check: when the label is not Safe but the chosen option is safe (low confidence), the fixed reason is "The check was not sure about this page, so take care." instead of the normal-website sentence.
- 2026-11-14 u1-core-check: the Check again 5-second limit restarts from the recheck (startedAt is reset), because counting from the original visit start would time out every later recheck at once.
- 2026-11-14 u1-core-check: OpenJev has no adapter in u1; a check with source openjev ends as internal-error and Test connection says it is not available yet. u4 adds the adapter.
- 2026-11-14 u1-core-check: the settings page never fills the key field from storage (the key stays out of the page and out of messages); a "Remove saved key" button is the way to delete it. Test connection tests saved details and asks to Save first when the form has unsaved changes.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations

- 2026-11-14 u1-core-check: Jest 30 renamed `--testPathPattern` to `--testPathPatterns`, so the command recorded in unit-test-instructions.md fails. The npm script `test:unit` and the run used `--testPathPatterns`. The brief forbids edits under aidlc/, so unit-test-instructions.md still shows the old flag and needs the conductor to update it (plan step 2 asked to record the command there).
- 2026-11-14 u1-core-check: source-manifest.json, code-summary.md and traceability.json were not written by this agent; the brief gives them to the conductor (plan step 14). In-code comments are done.
- 2026-11-14 u1-core-check: added `.tmp-jest-out/` to .gitignore beyond the plan's list (tsconfig.test.json names it as outDir; nothing is emitted), and extra files pageWatcher.ts, toolbarIcon.ts, wiring.ts, chromeEnv.ts, popupApi.ts, collector.ts so wiring can be tested without a browser.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs

- 2026-11-14 u1-core-check: the collector is pulled (background asks the page, 1 second cap) with a content/ready push as retry, because a pull alone fails before the page script exists and a push alone cannot cover address changes without reload.
- 2026-11-14 u1-core-check: tab events use only `tabs` and `storage` permissions (tabs.onUpdated covers in-page address changes), avoiding `webNavigation`. Server access is `optional_host_permissions` https only, requested per saved address.
- 2026-11-14 u1-core-check: the 4 entry files (background.ts, content.ts, popup.ts, options.ts) stay as one-to-three line glue with no unit test; their logic lives in tested modules.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions

- 2026-11-14 u1-core-check: not tested against the live service or a real browser: whether api.typesafe.ai accepts the C7 request shape from the extension, and CORS and permission behaviour in Edge and Chrome. This is the manual walking-skeleton check.
- 2026-11-14 u1-core-check: `npm audit` reports 26 moderate or low findings, all in dev tooling pulled in by Jest and typescript-eslint (glob, minimatch, deepmerge); `npm audit --omit=dev` reports 0. The suggested fix downgrades Jest to 25, so it was not applied.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
