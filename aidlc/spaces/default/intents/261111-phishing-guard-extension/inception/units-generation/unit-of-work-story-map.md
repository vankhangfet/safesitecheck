# Unit Story Map

Each user story is assigned to the unit or units that implement it. Based on `stories.md`, `unit-of-work.md` and `components.md`.

| Story | Unit ID | Unit directory |
|-------|---------|----------------|
| US1.1 | U1 | u1-core-check |
| US1.2 | U1; U3 | u1-core-check; u3-verdict-memory |
| US1.3 | U1 | u1-core-check |
| US2.1 | U1 | u1-core-check |
| US2.2 | U1 | u1-core-check |
| US3.1 | U2 | u2-page-warnings |
| US3.2 | U2 | u2-page-warnings |
| US3.3 | U2 | u2-page-warnings |
| US4.1 | U1 | u1-core-check |
| US4.2 | U1 | u1-core-check |
| US4.3 | U1; U4 | u1-core-check; u4-openjev-source |
| US5.1 | U1 | u1-core-check |
| US5.2 | U1 | u1-core-check |
| US6.1 | U1 | u1-core-check |
| US6.2 | U4 | u4-openjev-source |
| US7.1 | U5 | u5-quality-measurement |

## Rows That Span Several Units

- **US1.2** (one clear verdict, reused briefly): U1 gives the single verdict; U3 gives the one-hour memory (AC1.2.2 to AC1.2.4).
- **US4.3** (clear reasons when checks fail): U1 handles the shared failure reasons for hosted Jev; U4 reports the same failure kinds for hosted OpenJev.

## Implementation Order Within Each Unit

- **U1**: page detection and address stripping, then the Jev check with the 5-second limit and stale-answer guard, then settings, then the icon and popup.
- **U2**: banner first, then overlay, then focus and isolation behaviour.
- **U3**: store and expire, then clearing on settings change.
- **U4**: adapter, then failure kinds, then Test connection support.
- **U5**: running a list, then the report.

This is the order inside one unit only; the order between units is decided in Delivery Planning.

## Coverage Check

- All 16 stories are assigned to at least one unit.
- Every unit has at least one row: U1 (11 rows), U2 (3), U3 (1), U4 (2), U5 (1).

## Assumptions & Open Questions

- The non-functional requirements NFR7 and NFR8 are build-process rules and are not assigned to a unit; they apply to every unit. [assumption]
