# Domain Design — Questions

The requirements and stories point to these building blocks (code you write, not services you deploy): a page watcher, a verdict service, one adapter for each verdict source, a verdict memory, a place that shows results in the browser, a settings manager and a quality measurement tool. The questions below settle the boundaries that have more than one reasonable answer.

## Q1. [Architect] How should the two verdict sources (hosted Jev and hosted OpenJev) be built?

Why we ask: both answer the same question, but they may differ in address, key and answer format. The way they are built decides how easy it is to add a third source later.

- A. One adapter for each source behind a shared contract, so the rest of the extension does not know which source is used (suggested)
- B. One client with a switch inside it for the two sources
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. One adapter for each source behind a shared contract, so the rest of the extension does not know which source is used

## Q2. [Architect] Where should the short-lived memory of recent verdicts live?

Why we ask: remembered verdicts must be cleared when the source, key or server changes, a gap raised in the reviews.

- A. A building block of its own that owns verdict memory, so clearing it and its one-hour time limit sit in one place (suggested)
- B. Inside the verdict service
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. A building block of its own that owns verdict memory

## Q3. [Architect] How should the toolbar icon, popup, banner and overlay be divided?

Why we ask: the icon and popup live in the browser's own surface, while the banner and overlay are placed inside other websites' pages, which have different limits and risks.

- A. Two building blocks: one for the icon and popup, one for the warnings placed on the page (suggested)
- B. One building block for everything the person sees
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Two building blocks: one for the icon and popup, one for the warnings placed on the page

## Q4. [Security] Which building block may read the Jev key?

Why we ask: your rule is that the key never goes in code, committed files or logs, and each person keeps their own key on their device.

- A. Only the settings manager reads and stores the key, and hands it to the adapter only when a request is made (suggested)
- B. Each source adapter reads the key from storage itself
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Only the settings manager reads and stores the key, and hands it to the adapter only when a request is made

## Q5. [Architect] Where should the detection quality measurement live?

Why we ask: the measurement should use the same verdict logic as the real extension, or its numbers would not describe what people experience.

- A. A separate building block that reuses the verdict service and the source adapters, and runs on demand (suggested)
- B. Part of the extension, reachable from the settings page
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. A separate building block that reuses the verdict service and the source adapters, and runs on demand

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
