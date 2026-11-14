# Scope Definition & Prioritization — Questions

## Sources

- [desc] Initial description: "i want to implement a web extension for Edge or Chrome by integration with jev/open jev to jud website is hamfull or phishing, or containt security risk or not. For jev/openjev please refer: https://docs.typesafe.ai/introduction"
- [scope] Workflow-selected scope: `mvp`.

## Q1. [Product owner] Which capabilities must be in the first version? (select all that apply)

Why we ask: the time frame is a few days, so only the essentials can fit.

- A. Check the address of the page being visited with Jev and show a clear verdict (safe, suspicious or dangerous)
- B. Show a warning on the page itself when a site is judged risky
- C. Give a short reason for each verdict
- D. A simple settings page to enter the Jev key or server address
- E. Quick checks on the device before calling Jev (for example, obvious look-alike addresses)
- F. A list of trusted sites that are never flagged
- X. Other (please specify)

[Answer]: A, B, C, D

## Q2. [Developer] Which Jev option should the first version support?

Why we ask: hosted Jev and OpenJev on-prem are set up differently, and supporting both costs time.

- A. Hosted Jev only
- B. OpenJev on-prem only
- C. Hosted Jev first, OpenJev later
- D. Not yet defined
- X. Other (please specify)

[Answer]: X. Other: Both Jev and hosted OpenJev

## Q3. [Product owner] In what order should the work be sequenced?

Why we ask: it decides what gets built first if time runs short.

- A. Risk first: prove early that Jev's verdicts are good enough, then build the rest
- B. Value first: show a verdict to the user as early as possible, then measure quality
- C. Dependency first: build the foundations that everything else needs
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. Value first: show a verdict to the user as early as possible, then measure quality

## Q4. [Product owner] Are there hard deadlines tied to any capability?

Why we ask: a fixed date can force capabilities out of the first version.

- A. No deadline beyond the few days already stated
- B. Yes, a specific date for the whole first version
- C. Yes, a date for one particular capability
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. No deadline beyond the few days already stated

## Q5. [Quality] Who provides the sample of known-bad and known-good sites used to judge detection quality?

Why we ask: the success target (few false alarms) cannot be checked without a sample.

- A. I will assemble it myself
- B. Use public lists of known phishing and legitimate sites
- C. I need help finding or building one
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. Use public lists of known phishing and legitimate sites

## Q6. [Product owner] Follow-up to Q1 and Q2: how should the first version fit in "a few days"?

Why we ask: you chose four must-have capabilities and support for both hosted Jev and hosted OpenJev, while the time frame is a few days (feasibility Q8). Supporting two backends adds work to every capability, so the two may not both fit.

- A. Keep both backends and all four capabilities; the time frame can stretch if needed
- B. Keep all four capabilities, but build hosted Jev first and add OpenJev right after
- C. Keep both backends, but drop one or more of the four capabilities from the first version
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Keep both backends and all four capabilities; the time frame can stretch if needed

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
