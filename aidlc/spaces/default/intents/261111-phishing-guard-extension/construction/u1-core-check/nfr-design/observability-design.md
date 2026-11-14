# Observability Design — u1-core-check

How the observability requirements are met. Based on `observability-requirements.md` and the logging answer in `nfr-requirements-questions.md` (Q4). Design level only.

| Requirement | Design |
|-------------|--------|
| NFR2.8 Log only error kinds and timings | One logger with three operations: record an error kind (from the closed list in the error catalogue), record a timing in milliseconds, and record a step name when debug is on. It accepts no free text, so an address or key cannot be passed in. |
| NFR2.9 Debug setting | A single yes/no setting, off by default, switchable on the settings page. When on, step names are added; the rules about the key, addresses, signals and page content still hold. |
| NFR3.4 Timing | The time from the start of the visit to the shown result is written as a number to the debug output. |

## Metrics, Logs and Traces

| Item | Decision |
|------|----------|
| Metrics | None kept. Timings are written to debug output only and not stored. |
| Logs | Console only, in the form `<error kind> <timing>`. Never stored. |
| Tracing | None. Visit and attempt identifiers are random strings used for matching, not for tracing, and are not logged with addresses. |
| Alerting | None; there is no server of ours. |
| Dashboards | None. The icon, popup and quality measurement tool are the signals. |
| Correlation identifiers | The visit identifier and attempt identifier tie an answer to its request, in memory and in messages between components only. |

## Service Level Indicators (for the person, measured by hand)

| Indicator | Target | Where it is checked |
|-----------|--------|---------------------|
| Share of checks that end in a verdict or Could not check within 5 seconds | 100% | Tests with a mocked service and the manual check in Build and Test |
| Share of checks that show Could not check because of a timeout or rate limit | Watch only; no target | The quality measurement report |

## Assumptions & Open Questions

- If support later needs diagnostics, a copyable text with error kinds and timings only could be added; it must never include addresses or the key. [assumption]
