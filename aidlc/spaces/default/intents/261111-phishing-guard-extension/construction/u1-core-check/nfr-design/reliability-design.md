# Reliability Design — u1-core-check

How the reliability requirements are met. Based on `reliability-requirements.md`, `functional-spec.md`, `rules.md` and `contract-summary.md`. Design level only.

| Requirement | Design |
|-------------|--------|
| NFR6.1 Never break a page | The extension only observes a page and adds a result outside it. Every call into the extension is wrapped so an error ends in Could not check for that visit, never in an error thrown into the page. |
| NFR6.2 Every failure has a named reason | The adapter returns either an answer or one of the named failure kinds; there is no third path. A catch-all turns any unexpected error into `unreadable-answer` with an internal marker in the debug log. |
| NFR6.3 Survive restarts of the background process | The current visit (with its start time and latest attempt) for each tab is saved to short-lived session storage whenever it changes. On start, the process reads them back. A restored visit that was waiting gets a new attempt, because its earlier request died with the process; the 5-second timer is re-created from the visit's start time, and if 5 seconds have already passed the visit ends as timed-out at once. If nothing can be read for an open tab, that tab is treated as a new visit and checked again. |
| NFR6.4 Late and out-of-order answers | Every answer carries the visit and attempt it was asked for. The result is applied only if both are still current. Because a restart gives a waiting visit a new attempt, an answer that somehow arrives from before the restart is for an older attempt and is discarded; this does not conflict with NFR6.3. |
| NFR6.5 No automatic retry | The adapter makes exactly one request per attempt. |

## Resilience Patterns Considered

| Pattern | Decision |
|---------|----------|
| Timeout | Yes: 5 seconds for the whole visit. |
| Retry with backoff | No: the person presses Check again (decision in Contract Design Q4). |
| Circuit breaker | Not for this version: with one request per page and no retry, a broken service costs one failed request per page. If the service is down for long, every page shows Could not check, which is the correct message. |
| Bulkhead | Not needed; there are no shared resources between visits. |
| Fallback | Could not check with its reason is the fallback. |
| Graceful degradation | The page is never touched when anything fails. |

## Other Failure Handling Added After Review

- **Unexpected internal error**: the catch-all that turns any unexpected error into Could not check uses its own failure kind, `internal-error` ("Something went wrong inside the extension"), so it is not mistaken for an unreadable answer from the service. The contract summary and the Verdict entity gain this kind when they are next revised. [assumption]
- **Permission for the server address denied**: if the browser denies the permission for the saved address, the settings page shows an error beside the address ("The browser needs your permission to contact this address"), the address is not made active, and checks show Could not check with the new failure kind `permission-denied`. A person who changes their mind is asked again the next time they save.

## Health Checks and Recovery

- Test connection on the settings page is the health check for the connection.
- Check again is the recovery action for a single page.
- There is no backup: settings can be entered again and no history is kept.

## Assumptions & Open Questions

- A circuit breaker may be added later if many pages in a row fail; that would sit inside VerdictService and would not change contracts. [assumption]
