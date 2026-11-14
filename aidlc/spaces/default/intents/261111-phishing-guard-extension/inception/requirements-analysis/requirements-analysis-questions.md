# Requirements Analysis — Questions

## Q1. [Product owner] When should a page be checked?

Why we ask: it decides how often Jev is called and whether people see verdicts without doing anything.

- A. Automatically, every time a page is opened
- B. Only when the person clicks the toolbar icon
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Automatically, every time a page is opened

## Q2. [Developer] What should happen when the same site is visited again?

Why we ask: repeat visits could reuse the earlier verdict, which is faster and uses fewer Jev calls, but a site's safety can change.

- A. Remember each verdict for a short time (for example one hour) and reuse it
- B. Check again on every visit
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Remember each verdict for a short time (for example one hour) and reuse it

## Q3. [Quality] What numbers define "most known phishing pages flagged, with few false alarms"?

Why we ask: the earlier success target had no numbers, and a requirement needs a clear pass or fail line.

- A. At least 90% of known phishing pages flagged, and at most 1% of legitimate pages flagged
- B. At least 95% of known phishing pages flagged, and at most 0.5% of legitimate pages flagged
- C. Set the numbers after a first measurement on the public lists
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. At least 90% of known phishing pages flagged, and at most 1% of legitimate pages flagged

## Q4. [Product owner] How long should the extension wait for Jev before showing "Could not check"?

Why we ask: a slow answer should not leave the person waiting, and a late answer must not appear on the wrong page.

- A. 3 seconds
- B. 5 seconds
- C. 10 seconds
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. 5 seconds

## Q5. [Product owner] What should happen on pages that cannot be checked, such as the browser's own pages, store pages and local files?

Why we ask: these pages have no normal website address, and nothing should be sent to Jev for them.

- A. Show "Could not check" with a clear reason, and send nothing to Jev
- B. Show nothing at all
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Show "Could not check" with a clear reason, and send nothing to Jev

## Q6. [Security] Where should the Jev key be kept?

Why we ask: a key placed inside a store-installed extension can be read by anyone who installs it. Your rule is that the key never goes in code, committed files or logs.

- A. Each person enters their own Jev key in the settings page, and it stays on their device
- B. A small server that you run holds the key; the extension only has that server's address and a shared access token
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Each person enters their own Jev key in the settings page, and it stays on their device

## Q7. [Product owner] How long should "Continue anyway" last after someone chooses it on a warning?

Why we ask: this was left open in the mockups, and it decides whether the warning keeps coming back.

- A. For this page load only; the warning returns if the page is reloaded
- B. For the rest of the browser tab session on that site
- C. Remembered for that site until the person resets it
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. For this page load only; the warning returns if the page is reloaded

## Q8. [Product owner] Should "Suspicious" sites get the same large warning as "Dangerous" sites?

Why we ask: the review of the mockups noted that a large overlay on uncertain verdicts may train people to click "Continue anyway" by habit.

- A. Yes, the same large overlay for both
- B. A slim banner for Suspicious and the large overlay for Dangerous
- C. Only the toolbar icon for Suspicious, and the large overlay for Dangerous
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. A slim banner for Suspicious and the large overlay for Dangerous

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
