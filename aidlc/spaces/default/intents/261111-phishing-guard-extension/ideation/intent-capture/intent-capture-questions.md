# Intent Capture & Framing — Questions

## Sources

- [desc] Initial description: "i want to implement a web extension for Edge or Chrome by integration with jev/open jev to jud website is hamfull or phishing, or containt security risk or not. For jev/openjev please refer: https://docs.typesafe.ai/introduction"
- [scope] Workflow-selected scope: `mvp`.

## Q1. [Product owner] What problem is the extension mainly solving?

Why we ask: this sets the focus of everything that follows.

- A. Protect people from phishing and scam sites while they browse
- B. Help a security team spot risky sites for review
- C. Both of the above
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Protect people from phishing and scam sites while they browse

## Q2. [Product owner] Who will use the extension, and what pain do they have today?

Why we ask: it decides tone, warnings and how technical the verdicts can be.

- A. Individual consumers who cannot tell a fake site from a real one
- B. Employees of an organisation that wants safer browsing
- C. Security analysts or IT staff who triage suspicious links
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. Employees of an organisation that wants safer browsing

## Q3. [Product owner] What does success look like for this first version?

Why we ask: success must be measurable so we can tell when the first version is done.

- A. Most known phishing pages are flagged, with few false alarms on real sites (measured on a sample you provide)
- B. A clear verdict shows up in the browser within a few seconds of opening a page
- C. Both A and B
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Most known phishing pages are flagged, with few false alarms on real sites (measured on a sample you provide)

## Q4. [Product owner] What triggered this project now?

Why we ask: the trigger tells us how much urgency and polish to plan for.

- A. Personal or team interest in trying Jev / OpenJev for browser security
- B. Rising phishing incidents affecting me, my users or my company
- C. A learning or proof-of-value project
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. Rising phishing incidents affecting me, my users or my company

## Q5. [Product owner] Who decides what is in scope and priority, and who else has a say?

Why we ask: it tells us who must approve the plan and who should be kept informed.

- A. I decide alone
- B. I decide, with input from a small team or reviewer
- C. A manager or product owner decides, and I advise
- D. Not yet identified
- X. Other (please specify)

[Answer]: A. I decide alone

## Q6. [Security] Which kinds of risk should the extension judge? (select all that apply)

Why we ask: "harmful" can mean several things, and each needs different signals.

- A. Phishing pages (fake login or payment pages)
- B. Scam or fraud sites (fake shops, fake support)
- C. Malware or unwanted download sites
- D. Other general security risk (for example, suspicious or newly created domains)
- E. Not yet defined
- X. Other (please specify)

[Answer]: A, B, C, D

## Q7. [Product owner] What should this first version leave out? (select all that apply)

Why we ask: this fixes the edge of the first version so it stays small. The workflow plan (`mvp`) is already chosen; this asks only about the product.

- A. Automatically blocking pages (warn only)
- B. Central management, dashboards or reports for a team
- C. Browsers other than Edge and Chrome
- D. Scanning of downloaded files or email
- E. Nothing in particular
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct


## Assumption Confirmation

Assumptions recorded in the artifacts:

- Numeric targets for detection rate and false-alarm rate are not yet defined; they are to be set with the labeled sample later. [assumption]
- The reporting cadence and any communication needs for the organisation's employees have not been discussed. [assumption]

- A. Accept assumptions
- B. Convert to follow-up questions

[Answer]: A. Accept assumptions
