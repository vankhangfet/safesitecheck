# Security Design — u1-core-check

How the security requirements are met. Based on `security-requirements.md`, `functional-spec.md`, `rules.md`, `contract-summary.md` and the answers in `nfr-design-questions.md`. Design level only; no code.

## Patterns

| Requirement | Design |
|-------------|--------|
| NFR2.1 Only the address and three signals leave | One function builds the outgoing request from a typed `CheckSubject` holding exactly the stripped address and the three yes/no signals; nothing else can be put in it. The address is cleaned (query, fragment, login details removed) in PageWatcher before it enters any other component, so no later component ever holds the original. |
| NFR2.2 The key stays on the device and is not copied around | Only SettingsManager reads the key. It lives in the extension's own storage until the person removes it (Q1). It is handed to the adapter only through a function call for one request and is not kept in a variable that outlives that call. It is never put in an event, a message to a page, an error object or a log line. |
| NFR2.3 Key only to the saved https address | The adapter receives the address and key together and sends to that address only. Saving an address checks it is https; plain http is refused. The settings page shows the address the key will go to. |
| NFR2.4, NFR2.8, NFR2.9 Safe logging | All logging goes through one small logger that accepts only an error kind and a timing, not free text. It has no way to take an address or a key. A debug switch adds step names only. |
| NFR2.5 Least permissions | The permission for the verdict server's address is requested when the person saves the address, for that address only (Q2), as an optional permission. Reading tab addresses and running the signal collector on web pages are the only other permissions. Each is listed with its reason in the store listing. |
| NFR2.6 No key in the build | A check script searches the built folder and the test files, and the debug output of a test run, for key-shaped strings; tests use obviously fake keys. The check runs with the tests. |
| NFR2.7 Input is validated | Every answer from a source is parsed into a closed set of fields; any other shape is an unreadable answer (BR5.7). Addresses from the browser are parsed with the browser's own address parser. Settings are validated on save and again on load. |

## Signal Collector: Mechanism and Limits

- **Mechanism**: the signal collector is a declared content script that runs on http and https pages. This needs the browser's "run on all websites" permission at install, which employees and store reviewers will see; it is listed with its reason in the store listing (NFR2.5). This replaces the earlier open choice between declared and on-demand injection.
- **What it can reach**: the collector is the extension's own code. It imports no settings or storage code and holds no key; a build check fails if the collector bundle contains the settings module. A hostile page cannot reach extension storage.
- **When it reports**: at the start of each visit, once the page is ready or after 1 second, whichever comes first. An address change without a reload starts a new visit and therefore a new report (BR1.5). A password or card field that a page adds later than that moment is not seen; this is a known limit of the first version, recorded in `unit-of-work.md` open questions for later.
- **Permission for the server address**: requested when the person saves the address, for that address only (Q2). If the browser denies it, the address is not made active, an error is shown beside the field, and checks end in Could not check with failure kind `permission-denied` (see reliability design).

## Trust Boundaries

| Boundary | Rule |
|----------|------|
| Page (untrusted) to extension | Only the three signals cross, as yes/no values, through a message that carries the visit identifier. The extension ignores any other field. |
| Extension to page (warnings, later unit) | Only the label and short sentences cross; never the key, the address of other tabs or any setting. |
| Extension to verdict server | https only, key as bearer value, body limited to the contract. |
| Background process to popup and settings | Messages are accepted only from the extension's own pages. |

## Key Protection

- The key is held in extension-private storage; no page or other extension can read it.
- The key is shown hidden by default on the settings page, with a show/hide control.
- Removing the key from settings deletes it and clears remembered verdicts (when memory exists).
- A key stored in browser storage can be read by software with access to the person's browser profile; this is accepted by choosing to keep it until removed (Q1) and is noted for the store listing and the person.

## Threats and Mitigations

| Threat | Mitigation |
|--------|------------|
| Hostile page spoofs signals | Signals are only hints; a lie changes at most one input, never the key or the permissions |
| Hostile page spoofs a verdict message | Verdict messages are accepted from the extension's own background process only |
| The address text itself carries an attack (very long, odd characters) | The address is built by the browser's parser, cut to a maximum length for the request, and sent as data in a structured field, never as an instruction |
| Look-alike server address | The person sees the address on the settings page; https only |
| Dependency compromise | Few dependencies, exact versions, lock file committed (NFR5.2) |

## Assumptions & Open Questions

- The maximum length for the address field in the request is set in Code Generation (a few thousand characters). [assumption]
- The store listing text for permissions is written at release time. [assumption]
