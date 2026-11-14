# User Stories

Grouped by feature area, following `requirements.md` (plan Q2). Small stories of about one to three days with three to six criteria each (plan Q3). Priorities use MoSCoW. Deferred ideas have no stories (plan Q4). The final MVP boundary is decided later in Delivery Planning.

Personas: P1 Mia (employee), P2 Sam (sets up), P3 Alex (product owner). See `personas.md`.

## Group 1: Check pages

### US1.1 Automatic check when a page opens
As Mia (P1), I want each page I open to be checked without any click, so that I get a verdict without extra effort. Covers FR1.1, FR1.2, NFR2, NFR5. Priority: Must Have.

- AC1.1.1: Given the extension is set up, When I open a normal web page, Then a check starts without any click.
- AC1.1.2: Given a page loads inside a frame of another page, When the page opens, Then only the top-level page is checked.
- AC1.1.3: Given the page address contains a query string or fragment, When the check is sent, Then the sent address has neither.
- AC1.1.4: Given a page address is very long, When it is sent, Then only the stripped website address is sent and nothing else from the page.
- AC1.1.5: Given current Edge or Chrome, When the extension is installed from the store, Then the check works in both.

### US1.2 One clear verdict, reused briefly
As Mia (P1), I want every check to end in one clear verdict, and a recent verdict to be reused, so that pages open quickly and I always see a simple answer. Covers FR1.3, FR1.4. Priority: Must Have.

- AC1.2.1: Given Jev returns a result, When it is mapped, Then I see exactly one of Safe, Suspicious, Dangerous or Could not check.
- AC1.2.2: Given a verdict for an address is less than one hour old, When I visit it again, Then no new check is sent.
- AC1.2.3: Given a verdict is older than one hour, When I visit again, Then a new check is sent.
- AC1.2.4: Given two addresses differ only by query string, When I visit the second, Then the earlier verdict is reused.

### US1.3 No verdict on the wrong page
As Mia (P1), I want a late answer never to show on a different page, so that I am never told the wrong thing about the page in front of me. Covers FR1.5. Priority: Must Have.

- AC1.3.1: Given a check is running and I switch to another tab, When the late result arrives, Then it is not shown on the other tab.
- AC1.3.2: Given a check is running and I go to another page in the same tab, When the late result arrives, Then it is not shown on the new page.
- AC1.3.3: Given the late result arrives for a page I already left, When it is received, Then it may be remembered for that address only.

## Group 2: Show the verdict

### US2.1 Verdict on the toolbar icon
As Mia (P1), I want the toolbar icon to show the verdict for the current page, so that I can see it at a glance. Covers FR2.1, NFR4. Priority: Must Have.

- AC2.1.1: Given a verdict is Dangerous, When the icon updates, Then it shows its own shape and badge text.
- AC2.1.2: Given any verdict, When a screen reader reads the icon, Then it announces the verdict, such as "Dangerous".
- AC2.1.3: Given the icon is focused, When I press Enter or Space, Then the popup opens.
- AC2.1.4: Given a check is running, When I look at the icon, Then it shows a distinct "checking" state.

### US2.2 Popup with verdict and reason
As Mia (P1), I want a popup with the verdict, a short reason, "Check again" and Settings, so that I understand the verdict and can recheck. Covers FR2.2, FR2.3. Priority: Must Have.

- AC2.2.1: Given a verdict exists, When I open the popup, Then I see the verdict, the reason, "Check again" and a link to Settings.
- AC2.2.2: Given I choose "Check again", When the check runs, Then the remembered verdict for the address is ignored.
- AC2.2.3: Given Jev returns no reason, When the verdict is shown, Then a default reason for that label is shown.

## Group 3: Warn on risky pages

### US3.1 Large warning for Dangerous pages
As Mia (P1), I want a clear large warning on Dangerous pages, so that I stop and think before going on. Covers FR3.1, FR3.5, NFR4. Priority: Must Have.

- AC3.1.1: Given a verdict is Dangerous, When the page is shown, Then an overlay shows the verdict and reason with "Go back" and "Continue anyway", and focus is on "Go back".
- AC3.1.2: Given the overlay is shown, When I choose "Go back", Then I return to the previous page.
- AC3.1.3: Given the overlay is open, When I press Escape, Then I return to the previous page and focus is restored.
- AC3.1.4: Given the overlay is open, When I use a screen reader, Then it is announced as a dialog with a name and the page behind it is hidden from assistive technology.

### US3.2 Slim banner for Suspicious pages
As Mia (P1), I want a slim banner on Suspicious pages, so that I am told without being interrupted too much. Covers FR3.2. Priority: Must Have.

- AC3.2.1: Given a verdict is Suspicious, When the page is shown, Then a banner with the verdict and a dismiss action appears at the top.
- AC3.2.2: Given the banner is shown, When I keep using the page, Then the page stays fully usable.
- AC3.2.3: Given I dismiss the banner, When I reload the page, Then the banner appears again.

### US3.3 Warnings never block for good
As Mia (P1), I want to be able to continue to a page after seeing a warning, and still see its risk, so that the warning informs me without taking control. Covers FR3.3, FR3.4. Priority: Must Have.

- AC3.3.1: Given I chose "Continue anyway", When I reload the same page, Then the warning is shown again.
- AC3.3.2: Given I dismissed a warning, When I look at the toolbar icon, Then it still shows Suspicious or Dangerous.
- AC3.3.3: Given I chose "Continue anyway", When the page is shown, Then I can use it normally.

## Group 4: Could not check

### US4.1 Time limit on slow checks
As Mia (P1), I want a slow check to end after a short time, so that I am never left waiting. Covers FR4.1, NFR3. Priority: Must Have.

- AC4.1.1: Given a check takes longer than 5 seconds, When the limit passes, Then "Could not check" is shown with the reason "no answer in time".
- AC4.1.2: Given the answer arrives within 5 seconds, When it is received, Then the verdict is shown within that time.
- AC4.1.3: Given a late answer arrives after "Could not check", When it is received, Then it does not change the page I am on unless it is still the same page.

### US4.2 Pages that cannot be checked
As Mia (P1), I want pages that cannot be checked to say so, so that I am not misled by silence. Covers FR4.2. Priority: Must Have.

- AC4.2.1: Given the page is a browser-internal page, When I open it, Then "Could not check" is shown with the reason "this page cannot be checked" and no request is sent.
- AC4.2.2: Given the page is a store page or a local file, When I open it, Then the same applies.
- AC4.2.3: Given such a page, When I open the popup, Then the reason is shown in plain words.

### US4.3 Clear reasons when checks fail
As Mia (P1), I want each failure to give its own reason, and my page to keep working, so that I know what to do and nothing breaks. Covers FR4.3, NFR6. Priority: Must Have.

- AC4.3.1: Given no key is saved, When I open a page, Then "Could not check" says a key is missing and offers Settings.
- AC4.3.2: Given there is no connection, When I open a page, Then "Could not check" says there is no connection and the page still loads normally.
- AC4.3.3: Given Jev answers with a rate limit, When it is received, Then "Could not check" says so.
- AC4.3.4: Given Jev returns an unreadable answer, When it is received, Then "Could not check" is shown and the answer is not remembered as a verdict.

## Group 5: Settings

### US5.1 Choose a source and save my key
As Sam (P2), I want to choose hosted Jev or hosted OpenJev and enter my key and server address, so that the extension can check pages for me. Covers FR5.1, FR5.2, NFR2. Priority: Must Have.

- AC5.1.1: Given I pick a source and save, When the next page is checked, Then that source is used.
- AC5.1.2: Given I save a key, When the extension runs, Then the key is used only for requests to the server I chose.
- AC5.1.3: Given I save a key, When I look at the stored settings, Then the key is stored on my device only.
- AC5.1.4: Given the settings page is open for the first time, When I look at it, Then a short hint explains what to enter.

### US5.2 Test the connection
As Sam (P2), I want to test the connection, so that I find out quickly if something is wrong. Covers FR5.3, NFR4. Priority: Should Have.

- AC5.2.1: Given a valid key and address, When I choose "Test connection", Then I see that it worked.
- AC5.2.2: Given an invalid server address, When I choose "Test connection", Then the error names the address field and the fix, and what I typed is kept.
- AC5.2.3: Given the settings page, When I use only a keyboard, Then every field and action can be reached, and errors are described in text.

## Group 6: Verdict sources

### US6.1 Verdicts from hosted Jev
As Mia (P1), I want verdicts to come from hosted Jev when it is selected, so that I benefit from its judgment. Covers FR6.1. Priority: Must Have.

- AC6.1.1: Given hosted Jev is selected with a valid key, When a page is checked, Then the verdict comes from hosted Jev.
- AC6.1.2: Given hosted Jev is selected with a missing key, When a page is checked, Then "Could not check" says the key is missing.
- AC6.1.3: Given the tests for this story run, When they call Jev, Then the calls are mocked.

### US6.2 Verdicts from hosted OpenJev
As Mia (P1), I want verdicts to come from hosted OpenJev when it is selected, so that my organisation can use its own server. Covers FR6.2. Priority: Must Have.

- AC6.2.1: Given hosted OpenJev is selected with a valid server address, When a page is checked, Then the verdict comes from hosted OpenJev.
- AC6.2.2: Given hosted OpenJev is selected and the server is unreachable, When a page is checked, Then "Could not check" says there is no connection.
- AC6.2.3: Given I switch the source in settings, When the next page is checked, Then the new source is used.

## Group 7: Measure detection quality

### US7.1 Measure detection on public lists
As Alex (P3), I want to run a measurement on public lists of known phishing and legitimate sites, so that I can show the success target is met. Covers FR7.1, NFR1. Priority: Must Have.

- AC7.1.1: Given a list of known phishing and legitimate addresses, When the measurement runs, Then it reports the share of phishing addresses flagged and the share of legitimate addresses flagged.
- AC7.1.2: Given the measurement finishes, When I read the report, Then I can tell whether at least 90% of phishing pages are flagged and at most 1% of legitimate pages are flagged.
- AC7.1.3: Given an address in the list cannot be checked, When the measurement runs, Then it is reported separately and not counted as flagged.

## Coverage Notes

- NFR7 (tests and 80% coverage) and NFR8 (TypeScript, formatter, linter) describe how the work is built and are handled in Construction, not as user stories.

## INVEST Notes

- Each story is small (one to three days), independently testable, and valuable to a named persona. US1.3 and US4.1 are linked in behaviour but can be built separately.

## Assumptions & Open Questions

- How the Jev answer maps to Safe, Suspicious and Dangerous is still to be settled in design; AC1.2.1 depends on it. [assumption]
- AC3.1.3 assumes Escape counts as "Go back", as in the requirements. [assumption]
- AC7.1.3 assumes unchecked addresses are reported separately rather than counted as flagged; the requirements left this open. [assumption]
