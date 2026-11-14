# Logical Components — u1-core-check

The logical building blocks that carry the NFR patterns, with their failure domains. Based on `components.md`, `functional-spec.md` and the other NFR design documents of this unit. There is no deployed infrastructure: everything runs inside the browser.

## Where the Patterns Sit

| Logical component | Runs in | NFR patterns it carries | Failure domain |
|-------------------|---------|-------------------------|----------------|
| PageWatcher (background part) | Extension background process | Address cleaning (NFR2.1), visit creation, 1-second signal wait (NFR3.2), restart recovery (NFR6.3) | A failure ends in Could not check for that visit only |
| Signal collector | Page, as an extension content script | 50 ms budget (NFR3.3), only three yes/no values leave (NFR2.1) | A failure gives all three signals as no; the page is unaffected |
| VerdictService | Extension background process | 5-second visit timer (NFR3.1), attempt identity and late-answer guard (NFR6.4), pure mapping (NFR1.1), per-tab state kept in session storage (NFR6.3), one request per attempt (NFR6.5) | One visit at a time; failure is contained in that visit |
| JevAdapter | Extension background process | Key only to the saved https address (NFR2.3), validated answers (NFR2.7), named failure kinds (NFR6.2) | One request; no shared resource |
| SettingsManager | Extension background process and settings page | Sole holder of the key (NFR2.2), address validation, permission request on save (NFR2.5), debug switch (NFR2.9) | A failure shows an error beside the field and keeps typed values |
| BrowserPresenter | Toolbar icon and popup | Accessible names and live regions (NFR4.1, NFR4.2) | A failure leaves the previous icon state; the page is unaffected |
| Logger | Extension background process | Error kinds and timings only (NFR2.4, NFR2.8) | None |

## Shared Resources

| Resource | Used by | Notes |
|----------|---------|-------|
| Extension local storage | SettingsManager | Holds the source, address, model name, debug switch and the key; extension-private |
| Short-lived session storage | VerdictService | Holds per-tab visit and attempt state; discarded when the browser session ends |
| The hosted verdict server | JevAdapter | The only outside dependency; its limits appear as rate-limited or overloaded |

## Blast Radius

| Failure | Affected |
|---------|----------|
| The verdict server is unreachable or slow | Verdicts show Could not check; pages are unaffected |
| The background process is restarted | Per-tab state is restored or the tab is treated as a new visit; one extra check may happen |
| Settings storage is unavailable | The settings page shows an error; checks show Could not check with a missing key |
| The page blocks the signal collector | Signals count as no; verdicts are less informed but still produced |

## Component Isolation

- The page-side collector is the only code that runs inside other websites' pages in this unit, and it has no access to the key or settings.
- The popup and settings pages are extension pages and talk to the background process through messages that are accepted only from the extension itself.

## Assumptions & Open Questions

- The signal collector is a declared content script on web pages, as decided in the security design; the permission is shown to employees and store reviewers. [assumption]
