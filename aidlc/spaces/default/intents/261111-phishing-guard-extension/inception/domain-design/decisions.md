# Architecture Decisions

Architecture Decision Records for the Domain Design stage. Based on `components.md`, `requirements.md` and the answers in `domain-design-questions.md`.

## ADR-001: One adapter per verdict source

- **Context**: Verdicts come from hosted Jev or hosted OpenJev. They may differ in address, key use and answer format, and a third source may be added. Requirements FR6.1 and FR6.2.
- **Decision**: Build JevAdapter and OpenJevAdapter as separate components behind one shared contract. The rest of the extension does not know which source is used. [Q1]
- **Consequences**:
  - Positive: a source can change or be added without touching the rest; each adapter is easy to test with mocked calls.
  - Negative: two small components to maintain, and some code may look alike.
  - Security and compliance: both adapters send only the stripped address (NFR2) and never read or log the key.
- **Alternatives Rejected**:
  - One client with a switch inside: fewer pieces, but it mixes two sources' differences in one place and grows harder to change.

## ADR-002: Verdict memory is its own component

- **Context**: Verdicts are remembered for about an hour (FR1.4). Reviews found that memory must be cleared when the source, key or server changes, and that Could not check handling is open.
- **Decision**: VerdictMemory owns remembered verdicts, their time limit and clearing. [Q2]
- **Consequences**:
  - Positive: expiry and clearing sit in one place; the rule is easy to test.
  - Negative: one more component for VerdictService to call.
  - Security and compliance: it never stores the key and holds only stripped addresses.
- **Alternatives Rejected**:
  - Memory inside VerdictService: fewer pieces, but ties the time rules to the check logic and makes clearing on settings change easy to miss.

## ADR-003: Two presentation components

- **Context**: The icon and popup live in the browser's own surfaces, while the banner and overlay are placed inside other websites' pages. They run in different places with different limits and risks (page styles and scripts).
- **Decision**: BrowserPresenter handles the icon and popup; PageWarningPresenter handles the banner and overlay. [Q3]
- **Consequences**:
  - Positive: the riskier on-page code is isolated; each can meet its own accessibility rules (NFR4).
  - Negative: both need the same verdict wording, so the wording must come from VerdictService.
- **Alternatives Rejected**:
  - One presentation component: simpler to describe, but mixes browser-surface code with code that runs inside untrusted pages.

## ADR-004: Only SettingsManager touches the key

- **Context**: The project rule is that the Jev key is never in code, committed files or logs, and each person keeps their own key on their device (FR5.2, NFR2).
- **Decision**: SettingsManager is the only component that reads or writes the key, and it hands the key out only for a single request. [Q4]
- **Consequences**:
  - Positive: one place to protect and to test against logging; adapters stay free of storage.
  - Negative: every request needs a call to SettingsManager.
  - Security and compliance: a key stored in browser storage can be read by software with access to the device profile; this risk is accepted by the "own key on own device" choice and noted for later stages.
- **Alternatives Rejected**:
  - Each adapter reads the key from storage: fewer calls, but spreads key handling across components and raises the chance of it reaching logs.

## ADR-005: Quality measurement reuses the real check

- **Context**: The success target (NFR1) must describe what people experience, so the measurement must use the same logic.
- **Decision**: QualityMeasurement is a separate on-demand component that runs addresses through VerdictService, which uses the same source adapters. [Q5]
- **Consequences**:
  - Positive: the numbers match real behaviour; the extension itself stays free of test-only code.
  - Negative: the measurement needs a key or server, as the extension does.
- **Alternatives Rejected**:
  - Measurement inside the extension, reached from the settings page: easy to run, but adds non-user code to the shipped extension.

## ADR-006: VerdictService owns the late-answer guard and the time limit

- **Context**: Reviews raised that a late answer must never show on the wrong page (FR1.5) and that checks stop after 5 seconds (FR4.1).
- **Decision**: VerdictService ties each check to a PageVisit and ignores answers for visits that have ended; it also applies the time limit. This follows from the component boundaries above rather than from a person's choice.
- **Consequences**:
  - Positive: presenters and adapters need no timing logic; one place to test.
  - Negative: VerdictService carries more rules than other components.
- **Alternatives Rejected**:
  - Each presenter checks for itself whether an answer is stale: duplicates the rule and risks one presenter getting it wrong.

## Assumptions & Open Questions

- ADR-006 was decided by the architect, not chosen in a question; it can be changed at the gate. [assumption]
