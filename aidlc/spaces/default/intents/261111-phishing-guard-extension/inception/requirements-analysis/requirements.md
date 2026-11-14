# Requirements

Based on `intent-statement` (ideation/intent-capture), `scope-document` (ideation/scope-definition) and `team-practices` (inception/practices-discovery), plus the confirmed answers in `requirements-analysis-questions.md` (Q1 to Q8).

## Intent Analysis

- Goal: protect an organisation's employees from phishing, scam, malware and other risky sites while they browse in Edge and Chrome, by asking Jev (hosted Jev or hosted OpenJev) for a verdict on each page. [intent-statement]
- Type: new project; scope: one browser extension with a settings page; complexity: standard.
- First version warns only and never blocks a page for good. [scope-document]

## Functional Requirements

### FR1. Check pages

- **FR1.1** When a page is opened in a tab, the extension checks it automatically. [Q1]
  - Given the extension is set up, When a person opens a normal web page, Then a check starts without any click.
  - Given a page loads inside a frame of another page, When the page opens, Then only the top-level page is checked.
- **FR1.2** Only the website address, with query strings and fragments removed, is sent for a check. [scope-document, constraint C5]
  - Given a page address contains a query string or fragment, When a check is sent, Then the sent address has neither.
  - Given a page address is very long, When it is sent, Then it is sent without the query and fragment parts and nothing else from the page.
- **FR1.3** Every check ends in exactly one verdict: Safe, Suspicious, Dangerous or Could not check. [scope-document]
  - Given Jev returns a result, When it is mapped, Then the person sees one of the four labels.
- **FR1.4** A verdict is remembered for a short time (one hour unless changed) and reused when the same address is visited again. [Q2]
  - Given a verdict for an address is less than one hour old, When the person visits it again, Then no new check is sent.
  - Given a verdict is older than one hour, When the person visits again, Then a new check is sent.
  - Given two addresses differ only by query string, When the second is visited, Then the earlier verdict is reused.
- **FR1.5** A verdict is shown only for the page it was requested for. [mockup review R-03]
  - Given a check is running and the person switches to another tab or page, When the late result arrives, Then it is not shown on the new page.

### FR2. Show the verdict

- **FR2.1** The toolbar icon shows the verdict of the current page using a distinct shape and a short text badge, never colour alone. [Q1 rough mockups, Q4 rough mockups]
  - Given a verdict is Dangerous, When the icon updates, Then it shows its own shape and badge text and has a text label announcing "Dangerous".
- **FR2.2** A popup opened from the icon shows the verdict, the short reason, a "Check again" action and a link to Settings. [Q1 rough mockups]
  - Given a verdict exists, When the person opens the popup, Then verdict, reason, "Check again" and Settings are shown.
  - Given "Check again" is chosen, When the check runs, Then the cached verdict for the address is ignored.
- **FR2.3** Each verdict carries a short reason in plain language. [scope-document S3]
  - Given Jev returns no reason, When the verdict is shown, Then a default reason for that label is shown instead.

### FR3. Warn on risky pages

- **FR3.1** For a Dangerous verdict, a large overlay is shown over the page with "Go back" and "Continue anyway". [Q8, Q2 rough mockups]
  - Given a verdict is Dangerous, When the page is shown, Then the overlay shows the verdict and reason, and focus is on "Go back".
  - Given the overlay is shown, When "Go back" is chosen, Then the person returns to the previous page.
- **FR3.2** For a Suspicious verdict, a slim dismissible banner is shown at the top of the page. [Q8]
  - Given a verdict is Suspicious, When the page is shown, Then a banner with the verdict and a dismiss action is shown and the page stays usable.
- **FR3.3** "Continue anyway" and a dismissed banner last for the current page load only. [Q7]
  - Given the person chose "Continue anyway", When the same page is reloaded, Then the warning is shown again.
- **FR3.4** The warning never blocks a page for good, and the toolbar icon keeps showing the risky verdict after a warning is dismissed. [Q7, mockup review R-02]
  - Given a warning was dismissed, When the person looks at the toolbar icon, Then it still shows Suspicious or Dangerous.
- **FR3.5** Pressing Escape on the overlay counts as "Go back". [assumption]
  - Given the overlay is open, When Escape is pressed, Then the person returns to the previous page and focus is restored.

### FR4. Could not check

- **FR4.1** If Jev does not answer within 5 seconds, the verdict is Could not check. [Q4]
  - Given a check takes longer than 5 seconds, When the limit passes, Then Could not check is shown with the reason "no answer in time".
- **FR4.2** Pages that cannot be checked (browser pages, store pages, local files) show Could not check with a clear reason and send nothing. [Q5]
  - Given the page is a browser-internal page, When it is opened, Then Could not check is shown with the reason "this page cannot be checked" and no request is sent.
- **FR4.3** Missing key, no connection, a rate-limit answer or an unreadable answer from Jev each give Could not check with its own reason. [corner checklist]
  - Given no key is saved, When a page is opened, Then Could not check says a key is missing and offers Settings.
  - Given Jev returns an unreadable answer, When it is received, Then Could not check is shown and the answer is not cached as a verdict.

### FR5. Settings

- **FR5.1** The settings page lets the person choose hosted Jev or hosted OpenJev. [Q2 scope-definition]
  - Given the person picks a source and saves, When the next page is checked, Then that source is used.
- **FR5.2** The person enters their own Jev key and the server address in settings; the key is stored on their device only. [Q6]
  - Given a key is saved, When the extension runs, Then the key is used only for requests to the chosen server.
- **FR5.3** "Test connection" reports success or the reason it failed, naming the field and the fix, and keeps what was typed. [Screen 4 mockup]
  - Given an invalid server address is entered, When "Test connection" is chosen, Then the error names the address field and the typed value is kept.

### FR6. Verdict sources

- **FR6.1** The extension can get verdicts from hosted Jev. [scope-document S1]
  - Given hosted Jev is selected with a valid key, When a page is checked, Then the verdict comes from hosted Jev.
- **FR6.2** The extension can get verdicts from hosted OpenJev. [scope-document S5]
  - Given hosted OpenJev is selected with a valid server address, When a page is checked, Then the verdict comes from hosted OpenJev.

### FR7. Measure detection quality

- **FR7.1** A measurement can be run on public lists of known phishing and legitimate sites and reports the detection rate and the false-alarm rate. [scope-document S6, Q5 scope-definition]
  - Given a list of known phishing and legitimate addresses, When the measurement runs, Then it reports the share of phishing addresses flagged and the share of legitimate addresses flagged.

## Non-Functional Requirements

- **NFR1 Detection quality.** On the public lists, at least 90% of known phishing pages are flagged and at most 1% of legitimate pages are flagged. [Q3]
  - Given the measurement from FR7.1, When it finishes, Then both numbers meet these limits.
- **NFR2 Privacy.** Nothing except the stripped website address leaves the browser, and the Jev key never appears in code, committed files or logs. [constraint C5, project rule]
  - Given a build and its logs, When they are searched for the key, Then it is not found.
- **NFR3 Responsiveness.** A verdict or Could not check is shown within 5 seconds of a page opening. [Q4]
- **NFR4 Accessibility.** All screens meet WCAG 2.1 AA, including keyboard use, screen reader support and not relying on colour alone. [Q4 rough mockups]
  - Given only a keyboard, When the person uses the popup, overlay and settings, Then every action can be done.
- **NFR5 Compatibility and look.** The extension works in current Edge and Chrome and matches their native look. [Q5 rough mockups, constraint C1]
- **NFR6 Reliability.** A failure of Jev or the extension never breaks the visited page or stops the person from using it. [corner checklist]
  - Given Jev is unreachable, When a page is opened, Then the page loads normally.
- **NFR7 Testing.** At least 80% of lines are covered by tests, tests run and pass before merge, and calls to Jev are mocked in tests. [team-practices]
- **NFR8 Maintainability.** Code is TypeScript with a standard formatter and a linter that must pass before merge. [team-practices]

## Constraints

- Edge and Chrome only; installed from the public store; store review has no instant rollback, so rolling back means re-publishing the previous version. [constraint-register C1, C7; team-practices]
- Only the stripped website address is sent for a check. [constraint-register C5]
- Verdicts come from hosted Jev or hosted OpenJev. [constraint-register C4]

## Assumptions

- Escape on the overlay counts as "Go back" (FR3.5). [assumption]
- Each employee has access to their own Jev key, and a hosted OpenJev server address is available to them (FR5.2). [assumption]
- The one-hour verdict memory is a starting value and may change. [assumption]
- Jev returns a verdict, or enough information to map to Safe, Suspicious or Dangerous, and a short reason; its exact answer format was not checked. [assumption]

## Out of Scope

- Automatically blocking pages for good. [intent-statement]
- Quick checks on the device before calling Jev, and a trusted-sites list (deferred). [scope-document D1, D2]
- Browsers other than Edge and Chrome, scanning downloads or email, and central management or reporting. [intent-statement]

## Open Questions

- How the Jev answer maps to Safe, Suspicious and Dangerous is to be settled in design.
- Whether employees will each hold a Jev key, or an administrator should provide access another way, was not confirmed.
- The final retention time for remembered verdicts and what happens to them when settings change.
