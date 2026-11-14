# Reliability Requirements — u1-core-check

Based on `functional-spec.md`, `rules.md`, `requirements.md` and `contract-summary.md`. Each requirement carries its inception NFR ID with a sub-number.

| ID | Requirement | Source |
|----|-------------|--------|
| NFR6.1 | A failure of Jev, the network, the browser's background process or any part of the extension never stops a page from loading or being used. The worst result is Could not check or no warning. | NFR6, BR5.5 |
| NFR6.2 | Every failure of a verdict source ends in Could not check with one of the named reasons; none ends in a silent failure or an unhandled error. | NFR6, BR5.4 to BR5.9 |
| NFR6.3 | If the browser stops and restarts the extension's background process, the current state of each open tab is restored, or, if it cannot be, the tab is treated as a new visit and checked again. | NFR6, BR8.2 |
| NFR6.4 | A late, repeated or out-of-order answer never changes what is shown for a visit that has ended, timed out or moved to a newer attempt. | NFR6, BR3.1 to BR3.3, BR5.2 |
| NFR6.5 | No automatic retry is made against a busy or rate-limited service; the person can press Check again. | NFR6, BR5.6, contract Q4 |

## Availability and Recovery

- There is no availability target for the extension itself beyond not breaking pages; the hosted service's availability is outside this project's control.
- There is nothing to back up: settings live on the device and can be entered again; no history is kept.
- Graceful degradation: if Jev is unreachable, the icon shows Could not check and the popup offers Check again and Settings.

## Assumptions & Open Questions

- The behaviour when the browser's own storage is full or unavailable (settings cannot be saved) is shown as an error beside the field; its exact wording is decided in Code Generation. [assumption]
