# Contract Design — Questions

I read TypeSafe's public documentation for Jev (docs.typesafe.ai and its OpenAPI description). Jev is called with a `POST` to `https://api.typesafe.ai/v1/systemone` carrying your key as a bearer token. The request holds a `state` (the content to judge) and named `questions` of type Choice, Score or Noul. The answer carries probabilities and a confidence. Errors use standard codes, with 401 for a bad key and 429 or 529 for rate limits or overload. These questions settle what the extension asks and how it behaves at each boundary.

## Q1. [Architect] What should the extension give Jev as the "state" to judge?

Why we ask: Jev judges only what it is sent. If it gets just the website address text, it cannot see the page itself, so its judgment rests on the address alone. That protects privacy (your earlier rule) but may limit detection quality against your 90% and 1% targets.

- A. The website address only, with query strings removed, as already agreed
- B. The website address plus the page title (this would change the earlier rule that nothing else is sent)
- C. Not yet defined
- X. Other (please specify)

[Answer]: X. Other: content page is ok to send

## Q2. [Architect] Which kind of question should the extension ask Jev?

Why we ask: Jev's Choice question returns a probability for each option, which fits the four-way verdict; a Noul yes/no returns one probability.

- A. One Choice question with options such as safe, phishing, scam, malware and other risk, using its probabilities and confidence (suggested)
- B. One yes/no Noul question: "Is this website dangerous?"
- C. Not yet defined; settle it in Functional Design
- X. Other (please specify)

[Answer]: A. One Choice question with options such as safe, phishing, scam, malware and other risk, using its probabilities and confidence

## Q3. [Architect] Does your hosted OpenJev server accept the same requests as TypeSafe's Jev?

Why we ask: I could not read OpenJev's own documentation (the project notes say it is separate from TypeSafe). If its requests and answers differ, it needs its own contract.

- A. Yes, the same request and answer shape as TypeSafe's Jev
- B. No, it differs; the shape will be defined when the server is available
- C. I do not know yet
- X. Other (please specify)

[Answer]: A. Yes, the same request and answer shape as TypeSafe's Jev

## Q4. [Architect] Should the extension retry when Jev says it is busy (a 429 or 529 answer)?

Why we ask: the documentation advises retrying with a short wait, but you set a 5-second limit for a verdict.

- A. No automatic retry; show "Could not check" and let the person press "Check again" (suggested)
- B. One quick retry within the 5-second limit
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. No automatic retry; show "Could not check" and let the person press "Check again"

## Q5. [Security] Follow-up to Q1: which page content may be sent to Jev?

Why we ask: sending page content reverses an earlier rule that only the website address is sent (feasibility Q3, requirement FR1.2 and NFR2). Pages can hold private information (email, banking, internal tools), and your hosted Jev is a third-party service, so "page content" needs to be pinned down.

- A. The website address plus a few simple signals worked out on the device, such as whether the page asks for a password or card number and whether a form sends data to a different website; no page text (suggested)
- B. The address plus the page title and a short excerpt of visible text, limited in size
- C. The address plus the full visible text of the page
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. The website address plus a few simple signals worked out on the device, such as whether the page asks for a password or card number and whether a form sends data to a different website; no page text

## Q6. [Security] Follow-up to Q1: are there pages whose content must never be sent?

Why we ask: the earlier review noted that internal addresses and private windows could leak confidential information.

- A. No exceptions; the same rule for every page
- B. Never send content from private or incognito windows, or from internal addresses (intranet, localhost, private network addresses); the address alone, or nothing, is sent there
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. No exceptions; the same rule for every page

## Q7. [Product owner] Follow-up to Q1: how should the earlier documents be updated?

Why we ask: the requirements (FR1.2, NFR2), the settings notice in the mockups and the constraint register all say only the address is sent. They will be out of date once Q5 is decided.

- A. Record the new rule in the contract summary now, and revise the earlier documents later when each stage is next revisited
- B. Go back and revise the requirements first, then continue Contract Design
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Record the new rule in the contract summary now, and revise the earlier documents later when each stage is next revisited

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
