## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-14T12:21:10Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | src/background/verdictService.ts > recheck() and submitSignals() | If the person chooses Check again while the first signal collection is still running (up to 1 second, and the popup keeps Check again enabled while checking), recheck() sets awaitingSignals to false and starts an attempt with no signals. The real signals that arrive afterwards are dropped by submitSignals(). A page with a password field is then sent to Jev with all three signals as "no", which can lower the verdict. | When Check again arrives before the signals do, either keep waiting for the signals (still within the 1-second limit) or accept the late signals into the visit before the request is built. Add a test for this order of events. | New |
| R-02 | Minor | src/background/verdictService.ts > restore() and beginVisit() | The visit is first saved in beginVisit() without signals. If the background process restarts while signals are still being collected, restore() starts a new attempt from the saved visit, which has no signals, so the request carries three "no" values even though the page-side collector is still alive (BR8.2, BR7.5). | On restore of a visit with no saved signals, ask the page for them again, bounded by the same 1-second wait, before starting the attempt. Alternatively record this as a known limit in the code summary. | New |
| R-03 | Minor | jest.config.cjs and package.json > scripts.test, scripts.test:unit | The 80% line floor is set in coverageThreshold but is only enforced when Jest runs with --coverage. Neither `npm test` nor the unit command passes it, so a routine run cannot fail on coverage. I ran `npx jest --coverage` with the unit patterns. It passed with 97.54% lines, so nothing is relaxed today. The floor is just not part of the default run. | Add `--coverage` to the `test` script, or document in the pre-merge gate that `npm run test:coverage` is the command that enforces the floor. | New |
| R-04 | Minor | scripts/keyScan.cjs > KEY_PATTERNS and scanProject() | The key scan only matches Bearer text, prefixed keys of 20 or more characters, and mixed letter-and-digit tokens of 40 or more characters. It scans dist, src, scripts, coverage and root .log files. It does not scan package.json or other root files, and it cannot match a key that is short or all letters. The "nothing found" result is weaker than it reads. The runtime guarantees (closed-list logger, key kept only in the settings manager, key-absence assertions in the verdictService, wiring and jevAdapter tests) carry the real protection. | State the scan's limits in unit-test-instructions.md. The runtime tests listed there remain the primary evidence for the key rule. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `npx jest --runInBand --testPathPatterns "src/(shared\|core\|adapters\|background\|content\|popup\|options)/"` (also run with `--coverage`) | PASS: 18 suites, 259 tests. Coverage: 97.54% lines, 94.96% branches, 96.2% statements. Only the four entry files (background.ts, content.ts, popup.ts, options.ts) are at 0%. | Tests exercise behaviour: fake timers, a fake fetch with chosen statuses, attempt and visit identity, a late answer after the timeout, restart restore, and key-absence assertions over events, saved records and logs. Coverage is above the 80% floor. |
| `npm run lint` | PASS (eslint ., no output). | Linter passes. no-console is an error in src except the logger file. |
| `npm run typecheck` | PASS (tsc --noEmit, strict). | No type errors. |
| `npm run check:key-scan` | PASS: 106 files checked, nothing key-shaped found. | Passes. See the Minor finding on the scan's reach. |
| `npx prettier --check .` (extra) | PASS. | Formatting is clean. |

**Focus areas traced**

- **Key handling:** The key is read only in createSettingsManager.getConnection() and handed out for one request. The adapter sends it only as a Bearer header over https, with redirect set to error, credentials omitted and no retry. The logger accepts only a closed error kind, a number or a step name. Saved visit records, verdicts and snapshots have no key field. The options page never fills the key field from storage. The page-side bundle check refuses the settings module.
- **What leaves:** buildJevRequest() reads only the stripped address (cut to the maximum length) and the three signals. stripAddress() removes the query, fragment and login details.
- **Timer, attempts and late answers (BR3.x, BR5.x):**
  - The 5-second timer is armed at beginVisit and re-armed at Check again.
  - Every attempt gets a new attemptId.
  - isCurrent() requires the same tab object, state "checking" and the latest attemptId, so superseded, ended and post-timeout answers are discarded.
  - Pages that cannot be checked send nothing.
- **Restart (BR8.2):** State is saved in session storage and re-validated on load. Restore keeps the saved start time, ends the visit as timed-out at once if the limit has passed, and otherwise starts a new attempt with the remaining time. A missing or mismatched record becomes a new visit through restoreOrBegin.
- **Manifest:** Permissions are storage and tabs, plus optional https host access that is requested per server address. The content script is top-frame only. Messages are accepted by sender id and by whether the sender is an extension page or the top frame of a tab. This matches the security design.
- **Quality targets:** No threshold is lowered. The coverage floor stays at 80% lines. ESLint, strict TypeScript and Prettier all pass, and the ESLint ignores cover only generated and framework folders.

### Summary

No Critical or Major defects found. The key stays inside the settings manager and one request, only the stripped address and three yes/no signals leave, and the timer, attempt identity, late-answer and restart paths are implemented and tested with real assertions. Four Minor items remain: signals can be dropped when Check again or a restart happens during the first signal collection, the coverage floor is not part of the default test run, and the key scan has a narrow reach.
