# Performance and Usability Requirements — u1-core-check

Targets for speed and for who can use the screens. Each carries its inception NFR ID with a sub-number. Based on `functional-spec.md`, `rules.md` and `requirements.md`.

| ID | Requirement | Measure | Source |
|----|-------------|---------|--------|
| NFR3.1 | A verdict or Could not check is shown within 5 seconds of a page visit starting. | 5,000 ms from the start of the visit to the shown result, in tests and in the manual check | NFR3, BR5.1 |
| NFR3.2 | Collecting the page signals waits at most 1 second and never delays the 5-second limit. | 1,000 ms maximum | NFR3, BR7.5 |
| NFR3.3 | The extension does not noticeably slow the page: its work on the page itself (collecting the three signals) completes in under 50 ms on a normal page. | 50 ms, measured in tests and on a real page | NFR3 |
| NFR4.1 | Every screen of this unit (icon, popup, settings) meets WCAG 2.1 AA: keyboard use, visible focus, text contrast of 4.5 to 1 and icon contrast of 3 to 1 in light and dark themes, and no meaning carried by colour alone. | The accessibility checklist for these screens passes | NFR4 |
| NFR4.2 | The popup and the settings page announce changes (verdict, status, errors) to screen readers. | A polite live region is used for each | NFR4, BR4.2, BR6.7 |
| NFR4.3 | All text works at 200% zoom without loss of content. | Checked by hand at 200% | NFR4 |
| NFR1.1 | The mapping from Jev's probabilities to labels is a pure function with named thresholds, so the quality measurement gets the same results as the extension and the thresholds can be tuned after measuring. | Same input always gives the same label; thresholds live in one place | NFR1, BR2.2 |

## Resource Limits

- Memory: the extension keeps only the current state of each open tab (a few small records). No history of addresses is kept. [observability answer Q4]
- Network: at most one request for each page visit or each Check again. There is no background polling.

## Assumptions & Open Questions

- The 50 ms page-work figure is a starting target, not tested on real pages yet. [assumption]
