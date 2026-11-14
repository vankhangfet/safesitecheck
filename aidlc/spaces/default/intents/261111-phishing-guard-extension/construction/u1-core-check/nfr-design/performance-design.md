# Performance Design — u1-core-check

How the performance and usability requirements are met. Based on `performance-requirements.md`, `functional-spec.md`, `rules.md` and `tech-stack-decisions.md` (the page script and the background process are built into small bundles with esbuild, which keeps the page-side code small). Design level only.

| Requirement | Design |
|-------------|--------|
| NFR3.1 Result within 5 s of the visit starting | One timer starts when the visit is created, not when the request is sent. At 5 seconds the visit becomes timed-out with Could not check. Collecting signals and building the request count against it. |
| NFR3.2 Signals within 1 s | The page-side collector reads the three signals once the page is ready and answers once; the background process waits at most 1 second, then uses all three as no. |
| NFR3.3 Under 50 ms on the page | The collector reads only the presence of three kinds of fields and one form attribute; it does not copy text, walk the whole page repeatedly or watch for changes. It runs once per visit. |
| NFR3.4 Timing recorded | The background process records the milliseconds from visit start to the shown result in debug output only. |
| NFR1.1 Mapping is a pure function | The mapping from probabilities to labels is a standalone function with the thresholds as named constants in one place; it takes the answer and returns a label with no other input. |
| NFR4.1 Accessible screens | Native HTML controls, visible focus, labelled fields, text for every state, and contrast checked in light and dark themes against the checklist from Refined Mockups. |
| NFR4.2 Changes announced | The popup's verdict and the settings page's status use a polite live region. |
| NFR4.3 200% zoom | Fluid layouts in the popup and settings page; no fixed-height text boxes. |

## Budgets

| Step | Budget |
|------|--------|
| Signal collection (page side) | 50 ms of work, 1,000 ms maximum wait |
| Building and sending the request | Within the 5-second visit limit |
| Waiting for the service | Whatever remains of the 5 seconds |
| Mapping and showing the result | Under 50 ms |

## Resource Use

- One request for each visit or Check again; no polling and no background work when no page is opening.
- Per-tab state is a few small records in short-lived session storage.
- No caching in this unit: reuse of verdicts is delivered by u3-verdict-memory.

## Assumptions & Open Questions

- The 50 ms page budget is checked on a few real pages in Build and Test. [assumption]
