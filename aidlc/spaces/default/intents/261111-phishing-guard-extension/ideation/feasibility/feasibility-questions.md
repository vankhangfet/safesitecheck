# Feasibility & Constraints — Questions

## Sources

- [desc] Initial description: "i want to implement a web extension for Edge or Chrome by integration with jev/open jev to jud website is hamfull or phishing, or containt security risk or not. For jev/openjev please refer: https://docs.typesafe.ai/introduction"
- [scope] Workflow-selected scope: `mvp`.

## Q1. [Developer] What languages and tools are you comfortable building with?

Why we ask: it decides what is realistic to build and maintain for a browser extension.

- A. JavaScript / TypeScript
- B. Python (for any supporting service)
- C. Both JavaScript / TypeScript and Python
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. JavaScript / TypeScript

## Q2. [Product owner] What access do you have to Jev / OpenJev today?

Why we ask: the whole idea depends on being able to call Jev (hosted by TypeSafe) or run OpenJev on the device.

- A. I already have an API key for the hosted TypeSafe Jev
- B. I plan to use OpenJev on the device instead of a hosted service
- C. I have no access yet and still need to sign up or check availability
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. I already have an API key for the hosted TypeSafe Jev

## Q3. [Security] What may leave the browser when a page is checked?

Why we ask: the extension would send information about visited sites to a third-party service, which an organisation may restrict.

- A. The website address only (with query strings removed)
- B. The website address and some page content
- C. Nothing may leave the device or the organisation
- D. Not yet defined; this needs to be checked with the organisation's security or privacy owner
- X. Other (please specify)

[Answer]: A. The website address only (with query strings removed)

## Q4. [Compliance] Which rules or policies must the extension follow? (select all that apply)

Why we ask: employees' browsing data is sensitive and may be covered by privacy law or company policy.

- A. None known
- B. Privacy law (for example GDPR or local data protection law)
- C. The organisation's own security or acceptable-use policy
- D. Not yet defined
- X. Other (please specify)

[Answer]: A

## Q5. [Product owner] What are the timeline and budget limits for the first version?

Why we ask: it sets how much we can build and whether paid Jev usage is acceptable.

- A. A few days, free usage only
- B. A few weeks, free usage only
- C. A few weeks, with a small budget for paid Jev usage
- D. Not yet defined
- X. Other (please specify)

[Answer]: X. Other: can use with Jev or I can host OpenJev on-prem

## Q6. [Operations] How would the extension reach employees, and what must it work with?

Why we ask: managed deployment to a whole organisation has different constraints than a personal install.

- A. Installed by each person from the public Edge or Chrome store
- B. Pushed by IT through managed browser policy
- C. Loaded by hand for a small pilot first
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Installed by each person from the public Edge or Chrome store

## Q7. [Product owner] Are there organisational blockers or approvals needed?

Why we ask: surfacing blockers early avoids late surprises.

- A. None known
- B. Needs security or IT approval before any rollout
- C. A change freeze or competing priority exists
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. None known

## Q8. [Product owner] Follow-up to Q5: how much time do you have for the first version?

Why we ask: your Q5 answer covered the Jev options (hosted Jev, or OpenJev hosted on-prem) but not the timeline.

- A. A few days
- B. A few weeks
- C. No fixed deadline
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. A few days

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
