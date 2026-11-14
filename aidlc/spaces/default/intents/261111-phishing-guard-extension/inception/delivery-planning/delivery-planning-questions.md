# Delivery Planning — Questions

A Bolt is one build pass over a piece of the work, ending in something that runs. The five units from Units Generation are the pieces: u1-core-check, u2-page-warnings, u3-verdict-memory, u4-openjev-source and u5-quality-measurement. Your practice is to build a thin end-to-end slice first (a walking skeleton: a minimal version that runs the whole way through, built first to prove the pieces connect). That is u1-core-check, so it comes first. These questions settle what comes after it and how the plan is run.

## Q1. [Delivery] After the first thin slice, what should come next?

Why we ask: u2 to u5 do not depend on each other, so the order is your choice. Each option proves something different.

- A. Quality measurement next, to find out early whether Jev's judgment reaches the 90% and 1% targets; then warnings, then OpenJev, then verdict memory (risk first, suggested)
- B. Warnings next, so people see on-page protection sooner; then quality measurement, OpenJev, verdict memory (value first)
- C. OpenJev next, so both verdict sources work early; then quality measurement, warnings, verdict memory
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Quality measurement next, to find out early whether Jev's judgment reaches the 90% and 1% targets; then warnings, then OpenJev, then verdict memory

## Q2. [Delivery] Do you want a formal scoring model to rank the work?

Why we ask: WSJF is a scoring model that ranks work by value, urgency and risk reduction against size. With five units a plain judgment may be enough.

- A. No, use plain judgment (suggested)
- B. Yes, score each unit with a WSJF-style model
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. No, use plain judgment

## Q3. [Delivery] How big should one Bolt be?

Why we ask: it decides how often you get a working result to check.

- A. One Bolt per unit, so five Bolts (suggested)
- B. Bundle the two small units (u3-verdict-memory and u4-openjev-source) into one Bolt, so four Bolts
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. One Bolt per unit, so five Bolts

## Q4. [Delivery] Can more than one Bolt be built at the same time?

Why we ask: after u1, the other units could be built at the same time, but you are a solo builder.

- A. No, one at a time (suggested)
- B. Yes, where units do not depend on each other
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. No, one at a time

## Q5. [Delivery] Which outside things are already in place? (select all that apply)

Why we ask: anything not in place can hold up a Bolt, so each needs an owner and a plan.

- A. A TypeSafe Jev key that works for this use
- B. A developer account for the Edge Add-ons store
- C. A developer account for the Chrome Web Store
- D. A hosted OpenJev server I can use
- E. The public lists of known phishing and legitimate sites chosen
- F. None of these yet
- X. Other (please specify)

[Answer]: F. None of these yet

## Q6. [Delivery] What worries you most about this build, so we tackle it early? (select all that apply)

Why we ask: worries become the first things each Bolt tries to prove or disprove.

- A. Whether Jev can judge well from the address and a few signals
- B. Whether the browser lets the extension call Jev directly and run on all websites
- C. Store review and the broad permission employees will see
- D. Keeping the Jev key safe on each person's device
- E. Showing warnings correctly on any website
- F. Nothing in particular
- X. Other (please specify)

[Answer]: A

## Q7. [Delivery] When should the project check that verifies each finished unit be chosen?

Why we ask: Construction runs one check after each unit to prove it works. No test runner has been chosen and there is no code yet, so no check exists to approve today.

- A. Decide at the first checkpoint, once the first unit exists and a test runner is chosen (suggested)
- B. Choose one now
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Decide at the first checkpoint, once the first unit exists and a test runner is chosen

## Q8. [Delivery] Follow-up to Q5: what is the situation with the Jev key?

Why we ask: Q5 said none of the outside things are in place, but in Feasibility you said you already have an API key for the hosted TypeSafe Jev. The first Bolt needs a working key.

- A. My earlier answer stands: I have a TypeSafe Jev key, and the other items in Q5 are not in place yet
- B. I do not have a working key yet
- C. I have a key but am not sure it works for this use
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. My earlier answer stands: I have a TypeSafe Jev key, and the other items in Q5 are not in place yet

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
