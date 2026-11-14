# Security Requirements — u1-core-check

Detailed security and privacy requirements for the first thin slice. Each carries its inception NFR ID with a sub-number. Based on `functional-spec.md`, `rules.md`, `requirements.md` and `contract-summary.md`, and the answers in `nfr-requirements-questions.md`.

| ID | Requirement | Source |
|----|-------------|--------|
| NFR2.1 | The only things sent to a verdict source are the stripped website address (no query string, fragment or login details) and the three yes/no page signals. Page text, field values and form contents are never sent. | NFR2, BR1.3, BR7.4, contract C5 |
| NFR2.2 | The Jev key is stored on the person's device only, is read only by the settings manager, is passed to an adapter for a single request and is never written to code, committed files, logs, error messages or events between components. | NFR2, BR6.3, project rule |
| NFR2.3 | The key is only ever sent to the saved server address over a secure (https) connection; an address that is not https is rejected when saved. The settings page shows the address the key will be sent to. | NFR2, BR6.2, BR6.8 |
| NFR2.4 | Nothing written to a log, console message or error text contains the key, a page address, the signals or page content. Only error kinds and timings are logged. | NFR2, observability answer Q4 |
| NFR2.5 | The extension asks the browser for no more permissions than it needs: the hosted Jev address, reading the page address of tabs, and running on all websites only to collect the three signals. Each permission is listed with its reason in the store listing. | NFR2, review of Contract Design (permissions) |
| NFR2.6 | A search of the built extension, its tests and its logs for any real key value finds nothing; tests use made-up keys only. | NFR2 |
| NFR2.7 | All input from the outside (the Jev answer, a page's address, saved settings) is checked before use: an answer that is not the expected shape is treated as unreadable. | NFR2, BR5.7, construction security rules |

## Threat Considerations

| Threat | Mitigation |
|--------|------------|
| The key is read by another extension or website | Stored in the extension's own storage, never put into a page, never sent to a page-side script |
| The key is sent to a look-alike address | Only the saved https address receives it; the address is shown on the settings page |
| Page content leaks to the verdict source | Only three yes/no signals leave the page (NFR2.1) |
| A hostile page tries to fake a verdict or a warning | Verdict events carry a visit identifier and are accepted only from the extension itself |
| Logs reveal browsing | NFR2.4 |
| The service returns a malformed answer to cause misbehaviour | NFR2.7 |

## Compliance

No regulatory or policy rules were identified (feasibility Q4). The collection of browsing addresses by a third-party service should be confirmed with the organisation before any rollout beyond the builder. [assumption]

## Authentication and Authorization

The extension has no accounts of its own. The only credential is the Jev key, covered above. There is no per-user authorization inside the extension.

## Assumptions & Open Questions

- The store's rules on extension permissions may require different wording for NFR2.5. [assumption]
- Whether the browser lets the extension call the Jev address directly is tested in this Bolt. [assumption]
