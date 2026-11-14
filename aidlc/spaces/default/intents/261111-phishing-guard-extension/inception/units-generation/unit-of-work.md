# Units of Work

Five units, grouped by capability, following the scope backlog. Based on `components.md`, `decisions.md`, `requirements.md` and `stories.md`, and the answers in `units-generation-questions.md` (Q1 to Q5).

## Unit Table

| Unit ID | Directory | Kind | Complexity | Building blocks |
|---------|-----------|------|------------|-----------------|
| U1 | u1-core-check | service | L | PageWatcher, VerdictService, JevAdapter, SettingsManager, BrowserPresenter |
| U2 | u2-page-warnings | ui | M | PageWarningPresenter |
| U3 | u3-verdict-memory | library | S | VerdictMemory |
| U4 | u4-openjev-source | service | S | OpenJevAdapter |
| U5 | u5-quality-measurement | service | M | QualityMeasurement |

## U1. u1-core-check (first thin slice)

- **Description**: Open a page, ask hosted Jev, and show the verdict on the toolbar icon and popup, with the key and server entered in the settings page. [Q3]
- **Boundaries**: owns PageWatcher, VerdictService, JevAdapter, SettingsManager and BrowserPresenter, and their entities PageVisit, Verdict and Settings.
- **Responsibilities**: top-level page detection, address stripping, unsupported-page handling, the 5-second limit, the stale-answer guard, source and key settings, the icon and popup states.
- **Deployment model**: embedded in the single extension package. [Q5]
- **Implementation notes**: VerdictService must work without VerdictMemory (every check is a fresh check) until U3 adds memory, and must accept a second adapter later (U4). The settings page offers the source choice from the start.

## U2. u2-page-warnings

- **Description**: The slim banner for Suspicious pages and the overlay for Dangerous pages shown inside the visited page.
- **Boundaries**: owns PageWarningPresenter.
- **Responsibilities**: banner, overlay, Go back, Continue anyway, Escape and focus handling, isolation from page styles.
- **Deployment model**: embedded in the single extension package.
- **Implementation notes**: depends on U1 for verdicts. The rendering must not be broken by page styles or scripts.

## U3. u3-verdict-memory

- **Description**: Remembers recent verdicts for about an hour and clears them when the source, key or server changes.
- **Boundaries**: owns VerdictMemory and the RememberedVerdict entity.
- **Responsibilities**: store, expire and clear verdicts; never store the key.
- **Deployment model**: embedded in the single extension package.
- **Implementation notes**: depends on U1 so VerdictService can call it. Whether Could not check results are remembered is decided in Functional Design.

## U4. u4-openjev-source

- **Description**: Adds hosted OpenJev as a second verdict source.
- **Boundaries**: owns OpenJevAdapter.
- **Responsibilities**: call hosted OpenJev, translate answers to the shared form, report distinct failures.
- **Deployment model**: embedded in the single extension package.
- **Implementation notes**: depends on U1 for the shared adapter contract and the settings page. Whether OpenJev needs a key is not confirmed.

## U5. u5-quality-measurement

- **Description**: A separate on-demand tool that runs the real check over public lists and reports the detection and false-alarm rates. [Q5]
- **Boundaries**: owns QualityMeasurement and the MeasurementReport entity.
- **Responsibilities**: run addresses through VerdictService, report both rates and the unchecked count.
- **Deployment model**: standalone tool, not shipped to the Edge and Chrome stores. [Q5]
- **Implementation notes**: depends on U1. It is more useful once U4 exists, but does not require it.

## Assumptions & Open Questions

- All units except U5 ship in one extension package, so they share one release. [Q5]
- The `service` kind is used for U1, U4 and U5 as the closest fit for code that runs on its own; U3 is a `library` and U2 a `ui`. [assumption]
- Complexity ratings are rough estimates for planning, not commitments. [assumption]
