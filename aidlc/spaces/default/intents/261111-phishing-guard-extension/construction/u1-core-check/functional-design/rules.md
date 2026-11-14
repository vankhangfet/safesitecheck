# Business Rules — u1-core-check

Rules for the first thin slice. Based on `requirements.md`, `stories.md` (the stories assigned to u1-core-check), `contract-summary.md` and the answers in `functional-design-questions.md`.

```yaml
rules:
  - id: BR1.1
    statement: Every top-level page that opens is checked without any click.
    category: policy
    applies_to: PageVisit
    trigger: A top-level page opens in a tab.
    logic: "IF a top-level page opens THEN create a PageVisit and start a check."
    violation: "No check starts; the icon shows nothing for that page."
    source: FR1.1

  - id: BR1.2
    statement: Pages inside frames are not checked.
    category: constraint
    applies_to: PageVisit
    trigger: A page loads inside a frame.
    logic: "IF the page is not the top-level page THEN do not create a PageVisit."
    violation: "A frame is checked and its verdict overwrites the real page's."
    source: FR1.1

  - id: BR1.3
    statement: The address sent for a check never has a query string, a fragment or login details in it, and nothing but the stripped address and the three signals is sent.
    category: validation
    applies_to: PageVisit
    trigger: Before any request leaves the extension.
    logic: "IF the address has a query string, a fragment or user name and password parts THEN remove them before use; send only the stripped address and PageSignals."
    violation: "The request is not sent."
    source: FR1.2

  - id: BR1.4
    statement: The check works in current Edge and Chrome.
    category: constraint
    applies_to: PageVisit
    trigger: The extension is loaded in either browser.
    logic: "IF the extension runs in current Edge or Chrome THEN every rule here holds in both."
    violation: "A behaviour differs between the two browsers; the unit is not done."
    source: NFR5

  - id: BR1.5
    statement: A change of address within a page, without a reload, is a new page visit and is checked again.
    category: policy
    applies_to: PageVisit
    trigger: The address of a tab changes without a full page load.
    logic: "IF the stripped address differs from the current visit's THEN end the current visit and create a new PageVisit."
    violation: "The old verdict stays on a page with a new address."
    source: "functional design Q3"

  - id: BR2.1
    statement: Every check ends in exactly one of Safe, Suspicious, Dangerous or Could not check.
    category: constraint
    applies_to: Verdict
    trigger: A check ends.
    logic: "IF the check ends THEN produce one Verdict with exactly one label."
    violation: "A page is left without a verdict."
    source: AC1.2.1

  - id: BR2.2
    statement: Probabilities from Jev become labels by these starting thresholds. Dangerous when the probabilities for phishing, scam and malware together reach 70% or more and Jev is confident; Suspicious when they reach 40% or more, when other risk is the top option, or when Jev's confidence is low; otherwise Safe.
    category: calculation
    applies_to: Verdict
    trigger: A readable answer arrives from a verdict source.
    logic: "Let risk be the sum of the probabilities for phishing, scam and malware. IF risk is 70% or more AND confidence is not low THEN dangerous. ELSE IF risk is 40% or more OR the top option is other risk OR confidence is low THEN suspicious. ELSE safe."
    violation: "The answer is treated as unreadable (BR5.7)."
    source: "functional design Q2"
    note: "Confidence is low when it is below 0.6, the starting value; the thresholds are named constants and are tuned after the quality measurement. This mapping is a pure function: the same probabilities and confidence always give the same label, with no use of the page, the clock or settings, so the quality measurement (contract C4) gets the same result as the extension."

  - id: BR2.3
    statement: Every verdict carries one short fixed sentence for the chosen option, and a longer part lists the simple signals seen.
    category: policy
    applies_to: Verdict
    trigger: A verdict is created.
    logic: "IF a verdict is created THEN reasonShort is the fixed sentence for the chosen option (or the failure); IF any of the three signals is yes THEN reasonMore lists each, in plain words."
    violation: "A verdict without a reason is not shown."
    source: "AC2.2.3, functional design Q1"

  - id: BR2.4
    statement: Without verdict memory present, every visit makes a fresh check.
    category: policy
    applies_to: Verdict
    trigger: A visit needs a verdict and no memory component exists.
    logic: "IF no memory is available THEN check afresh."
    violation: "None; reuse is added by u3-verdict-memory."
    source: FR1.4

  - id: BR3.1
    statement: Every check is tied to the visit it was started for, and an answer for a visit that has ended is never shown.
    category: constraint
    applies_to: PageVisit
    trigger: An answer arrives.
    logic: "IF the visit's state is ended THEN discard the answer ELSE show it."
    violation: "A verdict appears on the wrong page."
    source: "AC1.3.1, AC1.3.2"

  - id: BR3.2
    statement: A late answer for a page the person has left is not shown and, without verdict memory, is discarded.
    category: policy
    applies_to: Verdict
    trigger: An answer arrives after its visit ended.
    logic: "IF the visit ended THEN discard (with memory present, u3 may store it for that address)."
    violation: "A stale verdict is shown."
    source: AC1.3.3

  - id: BR3.3
    statement: Every check has its own attempt number within its visit. Only the answer to the latest attempt of a visit is shown; Check again is allowed after a verdict, after Could not check and after a timeout, and a new attempt cancels any earlier attempt still waiting.
    category: constraint
    applies_to: PageVisit
    trigger: Check again is chosen, or an answer arrives.
    logic: "IF Check again is chosen THEN attemptId becomes a new value and earlier attempts are marked superseded. IF an answer arrives whose attemptId is not the visit's latest THEN discard it. IF Check again is chosen while an attempt is still waiting THEN that attempt is superseded and a single new attempt starts."
    violation: "An answer to an earlier request is shown for a later one."
    source: "review of functional design (attempt identity)"

  - id: BR4.1
    statement: The toolbar icon shows a shield with a symbol and badge text for each state, never colour alone.
    category: policy
    applies_to: Verdict
    trigger: The state of the current page's check changes.
    logic: "checking shows the dots; safe the check mark; suspicious the question mark; dangerous the exclamation mark; could-not-check the dash."
    violation: "A state looks the same as another."
    source: "AC2.1.1, AC2.1.4"

  - id: BR4.2
    statement: The icon has an accessible name that announces the verdict.
    category: policy
    applies_to: Verdict
    trigger: The icon updates.
    logic: "The name reads 'Phishing Guard: <verdict>' with the reason when Could not check."
    violation: "A screen reader says nothing useful."
    source: AC2.1.2

  - id: BR4.3
    statement: Enter or Space on the focused icon opens the popup.
    category: policy
    applies_to: Verdict
    trigger: Keyboard activation of the icon.
    logic: "IF the icon is focused AND Enter or Space is pressed THEN open the popup."
    violation: "The popup cannot be opened by keyboard."
    source: AC2.1.3

  - id: BR4.4
    statement: The popup shows the verdict, the short reason, Check again and a link to Settings.
    category: policy
    applies_to: Verdict
    trigger: The popup opens.
    logic: "IF a verdict exists THEN show label, reasonShort (with Show more when reasonMore exists), Check again and Settings."
    violation: "A control is missing."
    source: AC2.2.1

  - id: BR4.5
    statement: Check again ignores any remembered verdict and starts a fresh check.
    category: policy
    applies_to: PageVisit
    trigger: The person chooses Check again.
    logic: "IF Check again is chosen THEN start a new check for the current visit without reading memory."
    violation: "The same stale verdict returns."
    source: AC2.2.2

  - id: BR5.1
    statement: A check that takes more than 5 seconds, counted from the moment the visit starts (not from the request), ends as Could not check with the reason that no answer came in time.
    category: constraint
    applies_to: Verdict
    trigger: 5 seconds pass after the visit started.
    logic: "IF no answer within 5 seconds THEN Verdict Could not check with failureKind timeout. IF an answer arrives within 5 seconds THEN show it within that time."
    violation: "The person waits without an answer."
    source: "AC4.1.1, AC4.1.2"

  - id: BR5.2
    statement: An answer that arrives after the time limit does not change the verdict already shown for that visit.
    category: policy
    applies_to: Verdict
    trigger: An answer arrives after a timeout.
    logic: "IF the visit already has a Could not check from a timeout THEN ignore the late answer."
    violation: "The verdict changes after the person has read it."
    source: AC4.1.3

  - id: BR5.3
    statement: Pages that cannot be checked (browser-internal pages, store pages, local files) show Could not check with a clear reason and send nothing.
    category: constraint
    applies_to: PageVisit
    trigger: A page opens whose address is not checkable.
    logic: "A page is checkable only if its address starts with http or https and is not on the Edge Add-ons or Chrome Web Store sites. IF it is not checkable (any other kind, such as browser-internal pages, extension pages, local files, data pages or blank pages) THEN checkable is no AND label could-not-check, failureKind unsupported-page, and no request is sent."
    violation: "A request is sent for such a page."
    source: "AC4.2.1, AC4.2.2, AC4.2.3"

  - id: BR5.4
    statement: With no key saved, the verdict is Could not check, says a key is missing and offers Settings.
    category: validation
    applies_to: Verdict
    trigger: A check starts with no key.
    logic: "IF the selected source needs a key AND none is saved THEN label could-not-check, failureKind missing-key, no request sent."
    violation: "A request is sent without a key."
    source: "AC4.3.1, AC6.1.2"

  - id: BR5.5
    statement: With no connection, the verdict is Could not check and the page still loads normally.
    category: constraint
    applies_to: Verdict
    trigger: The request cannot reach the server.
    logic: "IF the request fails to connect THEN label could-not-check, failureKind no-connection; never block or alter the page."
    violation: "The page is broken by the failure."
    source: AC4.3.2

  - id: BR5.6
    statement: A rate-limit or busy answer gives Could not check with its own reason; the extension does not retry on its own.
    category: constraint
    applies_to: Verdict
    trigger: The server answers 429 or 529.
    logic: "IF 429 THEN failureKind rate-limited; IF 529 THEN failureKind overloaded; do not retry."
    violation: "The extension keeps calling a busy service."
    source: AC4.3.3

  - id: BR5.7
    statement: An unreadable answer gives Could not check and is never remembered as a verdict.
    category: validation
    applies_to: Verdict
    trigger: The answer cannot be read or lacks the expected parts.
    logic: "IF the answer is unreadable THEN label could-not-check, failureKind unreadable-answer; never store it as a verdict."
    violation: "A bad answer is treated as a real verdict."
    source: AC4.3.4

  - id: BR5.8
    statement: A rejected key (401 answer) gives Could not check with its own reason and offers Settings.
    category: validation
    applies_to: Verdict
    trigger: The server answers 401.
    logic: "IF 401 THEN failureKind rejected-key."
    violation: "The person is not told the key is the problem."
    source: "contract C7 failure mapping"

  - id: BR6.1
    statement: The chosen source is saved and used for the next check.
    category: policy
    applies_to: Settings
    trigger: The person saves settings.
    logic: "IF the person picks a source and saves THEN the next check uses it."
    violation: "An old source keeps being used."
    source: AC5.1.1

  - id: BR6.2
    statement: The key is used only for requests to the server the person chose.
    category: constraint
    applies_to: Settings
    trigger: A request is made.
    logic: "IF a request goes to any address other than the saved server THEN the key is not sent."
    violation: "The key is exposed to another server."
    source: AC5.1.2

  - id: BR6.3
    statement: The key is stored on the person's device only and never appears in code, committed files, logs or messages other than the one request that needs it.
    category: constraint
    applies_to: Settings
    trigger: A key is saved or used.
    logic: "The key lives only in SettingsManager's device storage; it is passed to an adapter for one request and then dropped."
    violation: "The project rule 'NEVER put the Jev key in code, committed files or logs' is broken."
    source: "AC5.1.3, NFR2"

  - id: BR6.4
    statement: On first run the settings page shows a short hint about what to enter.
    category: policy
    applies_to: Settings
    trigger: The settings page opens with nothing saved.
    logic: "IF nothing is saved THEN show the hint."
    violation: "The person does not know what to do."
    source: AC5.1.4

  - id: BR6.5
    statement: Test connection tells the person whether it worked.
    category: policy
    applies_to: Settings
    trigger: The person chooses Test connection.
    logic: "IF a valid key and address are saved THEN show success."
    violation: "The person cannot tell if the setup works."
    source: AC5.2.1

  - id: BR6.6
    statement: An invalid server address is rejected with an error that names the field and the fix, and what the person typed is kept.
    category: validation
    applies_to: Settings
    trigger: Save or Test connection with an invalid address.
    logic: "IF the address is not a valid secure web address THEN show an error beside the address field naming the fix; keep typed values."
    violation: "The person loses what they typed."
    source: AC5.2.2

  - id: BR6.7
    statement: Every settings field and action can be reached by keyboard and errors are described in text, not colour alone.
    category: policy
    applies_to: Settings
    trigger: The settings page is used.
    logic: "Tab order follows the visual order; errors are text and read by screen readers."
    violation: "Keyboard users cannot complete setup."
    source: AC5.2.3

  - id: BR7.1
    statement: With hosted Jev selected and a valid key, the verdict comes from hosted Jev.
    category: policy
    applies_to: Verdict
    trigger: A check starts with source jev.
    logic: "IF source is jev AND a key exists THEN ask hosted Jev with one Choice question named risk."
    violation: "Another source answers."
    source: AC6.1.1

  - id: BR7.2
    statement: Tests for this unit mock every call to Jev.
    category: constraint
    applies_to: Verdict
    trigger: Unit tests run.
    logic: "No test calls the real service."
    violation: "Tests need a key or a network."
    source: AC6.1.3

  - id: BR7.3
    statement: The request to hosted Jev follows contract C7: one POST with a bearer key and one Choice question named risk with the options safe, phishing, scam, malware and other risk, about the stripped address and the three signals.
    category: constraint
    applies_to: Verdict
    trigger: A request is made to hosted Jev.
    logic: "Shape and failure mapping as in contract-summary.md C7."
    violation: "Unreadable or unsupported request failures."
    source: "contract C7"

  - id: BR7.4
    statement: Only yes/no signals leave the page; page text and field values never do.
    category: constraint
    applies_to: PageSignals
    trigger: Signals are collected.
    logic: "IF a field is not one of the three PageSignals THEN it is not collected."
    violation: "Private page content is sent."
    source: "contract C5"

  - id: BR7.5
    statement: Collecting the three signals waits at most 1 second; if they are not ready, all three count as no and the check goes ahead.
    category: constraint
    applies_to: PageSignals
    trigger: A visit starts a check.
    logic: "IF the signals are not collected within 1 second THEN use all three as no; the check still starts so the 5-second limit holds."
    violation: "A slow page delays or blocks its own check."
    source: "review of functional design (signal timing), NFR3"

  - id: BR7.6
    statement: The text sent to Jev as the state is exactly the stripped address and the three signals as simple named yes/no values, and the model name is a setting whose starting value is jev-latest.
    category: constraint
    applies_to: Verdict
    trigger: A request is built.
    logic: "state = a text holding 'address' and the three signal names with yes or no; model = the saved model name, default jev-latest."
    violation: "Extra page information is sent, or the request is rejected."
    source: "contract C7, review of functional design (request definition)"

  - id: BR5.9
    statement: A request the service rejects as malformed or too large (400, 413, 415, 422) gives Could not check with the reason that the request was not accepted; it is not retried.
    category: validation
    applies_to: Verdict
    trigger: The service answers 400, 413, 415 or 422.
    logic: "IF the status is one of these THEN failureKind unsupported-request and no retry."
    violation: "The extension repeats a request that cannot succeed."
    source: "contract C7 failure mapping"

  - id: BR6.8
    statement: The key is only ever sent to the saved server address over a secure (https) connection; hosted Jev has the starting address https://api.typesafe.ai, a hosted OpenJev source needs an address to be entered, and a missing address gives Could not check with the reason that the address is missing.
    category: constraint
    applies_to: Settings
    trigger: A check starts or settings are saved.
    logic: "IF source is jev AND no address is saved THEN use https://api.typesafe.ai. IF source is openjev AND no address is saved THEN failureKind missing-address and no request. IF the address is not https THEN reject it on save (BR6.6). The settings page shows the address the key will be sent to."
    violation: "The key goes to an unexpected or insecure address."
    source: "review of functional design (address and key), AC5.1.2"

  - id: BR8.1
    statement: VerdictService keeps, for every open tab, the current visit and its latest state (checking or the verdict), and publishes an update when a check starts as well as when it ends, so every screen can show the checking state.
    category: policy
    applies_to: PageVisit
    trigger: A check starts or ends.
    logic: "On check start publish state checking for the visit; on end publish the verdict; a screen that opens later pulls the tab's current state."
    violation: "The icon never shows the checking state, or a newly opened popup shows nothing."
    source: "AC2.1.4, review of functional design (state to screens)"

  - id: BR8.2
    statement: The per-tab current state survives the extension's background process being stopped and restarted by the browser; if it cannot be restored for a tab, that tab is treated as a new visit and checked again.
    category: constraint
    applies_to: PageVisit
    trigger: The background process restarts.
    logic: "State is kept in short-lived browser session storage keyed by tab. IF it is missing for an open tab THEN create a new PageVisit and check again."
    violation: "After a restart the icon shows nothing or a stale verdict."
    source: "review of functional design (browser restarts the background process), NFR6"
```

## Rules Summary

| Group | Rules | What they decide |
|-------|-------|------------------|
| 1 Checking | BR1.1 to BR1.5 | When a page is checked and what is sent |
| 2 Verdict | BR2.1 to BR2.4 | One label, how probabilities become labels, the reason text |
| 3 Late answers | BR3.1, BR3.2 | Never show an answer on the wrong page |
| 4 Icon and popup | BR4.1 to BR4.5 | What the person sees and can do |
| 5 Could not check | BR5.1 to BR5.9 | Timeouts, unsupported pages and each failure |
| 6 Settings | BR6.1 to BR6.8 | Source, key, address and their errors |
| 7 Jev source | BR7.1 to BR7.6 | The request, tests, signals and privacy limit |
| 8 Screen state | BR8.1, BR8.2 | How the checking state and current verdict reach the screens and survive restarts |
