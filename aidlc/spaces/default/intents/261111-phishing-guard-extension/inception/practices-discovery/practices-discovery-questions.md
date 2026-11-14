# Practices Discovery — Questions

## Q1. [Release engineer] How do you want to organise your code changes?

Why we ask: it decides how branches and merges are set up. The suggested default is one main branch where each finished piece of work is squashed into a single commit.

- A. One main branch; each finished piece of work lands as one squashed commit (suggested)
- B. A separate branch per feature, merged through a pull request
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. One main branch; each finished piece of work lands as one squashed commit

## Q2. [Release engineer] Build a thin end-to-end slice first? A walking skeleton is a minimal version that runs the whole way through, built first to prove the pieces connect before the real features go in.

Why we ask: here the thin slice would be "open a page, ask Jev, show a verdict", which proves the riskiest connection early.

- A. Yes, build the thin slice first
- B. No, build the features directly
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Yes, build the thin slice first

## Q3. [Quality engineer] When do you want to write tests?

Why we ask: this fixes the testing approach for every later build. The default for this kind of project also asks for at least 80% of lines covered by tests and tests run before merge.

- A. Write the code first, then the tests for it (suggested default)
- B. Write each test first, then the code that passes it (test-driven)
- C. Describe the behaviour in plain scenarios first, then code and tests (behaviour-driven)
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Write the code first, then the tests for it

## Q4. [Release engineer] How should new versions be released?

Why we ask: the extension is installed from the public Edge and Chrome stores, which review each new version before it goes live, so there is no instant rollback.

- A. Package a build automatically when work is merged, and submit it to the stores by hand after a manual check (suggested)
- B. Build and submit everything by hand
- C. Publish to the stores automatically after every merge
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Package a build automatically when work is merged, and submit it to the stores by hand after a manual check

## Q5. [Developer] What code style and checks should the project follow?

Why we ask: a shared style keeps the code consistent, and tools can enforce it automatically.

- A. TypeScript with a standard formatter and a linter that must pass before merge
- B. Plain JavaScript with a standard formatter and a linter that must pass before merge
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. TypeScript with a standard formatter and a linter that must pass before merge

## Q6. [Security] Which hard rules must always hold? (select all that apply)

Why we ask: hard rules become permanent project rules. They come from your earlier answers about what may be sent to Jev and accessibility.

- A. NEVER put the Jev key in code, committed files or logs
- B. NEVER send anything more than the website address with query strings removed to Jev
- C. ALWAYS meet WCAG 2.1 AA for the extension's screens
- D. None of these
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
