# Rough Mockups & Concept Visualization — Questions

## Sources

- [desc] Initial description: "i want to implement a web extension for Edge or Chrome by integration with jev/open jev to jud website is hamfull or phishing, or containt security risk or not. For jev/openjev please refer: https://docs.typesafe.ai/introduction"
- [scope] Workflow-selected scope: `mvp`.

## Q1. [Design] Which screens or surfaces should the extension have? (select all that apply)

Why we ask: the scope has a verdict, a warning on risky pages, a reason, and a settings page. This decides where each one appears.

- A. A toolbar icon that changes its look to show the verdict for the current page
- B. A small popup opened from the toolbar icon, showing the verdict and the reason
- C. A warning shown on the page itself when a site is judged risky
- D. A settings page for the Jev key, the server address and which Jev option to use
- X. Other (please specify)

[Answer]: A, B, C, D

## Q2. [Design] How should the warning on a risky page look?

Why we ask: the first version warns only and never blocks, so the warning must be clear without taking over the page.

- A. A slim banner at the top of the page that the person can dismiss
- B. A large overlay over the page with "Go back" and "Continue anyway"
- C. A slim banner for suspicious sites and a large overlay for dangerous sites
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. A large overlay over the page with "Go back" and "Continue anyway"

## Q3. [Design] Which verdict labels should people see?

Why we ask: plain labels help employees who are not security experts act on them.

- A. Three labels: Safe, Suspicious, Dangerous
- B. The three labels plus "Could not check" for when Jev is unavailable or the page is not supported
- C. Not yet defined
- X. Other (please specify)

[Answer]: B. The three labels plus "Could not check"

## Q4. [Design] Which accessibility level should the screens meet?

Why we ask: warnings are only useful if everyone can see and operate them, including by keyboard and screen reader.

- A. Basic: readable contrast and full keyboard use
- B. WCAG 2.1 AA, including screen reader support and not relying on colour alone
- C. Not yet defined
- X. Other (please specify)

[Answer]: B. WCAG 2.1 AA, including screen reader support and not relying on colour alone

## Q5. [Design] Are there brand guidelines or a look to follow?

Why we ask: a consistent look builds trust, which matters for a security warning.

- A. None; keep it simple and neutral
- B. Match the native look of Edge and Chrome
- C. Follow the organisation's brand
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. Match the native look of Edge and Chrome

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
