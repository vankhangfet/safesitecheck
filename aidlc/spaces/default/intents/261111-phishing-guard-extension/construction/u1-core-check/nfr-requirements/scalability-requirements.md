# Scalability Requirements — u1-core-check

This unit does not need to scale. It runs inside one person's browser for that person's own browsing, with no shared service, no data store of its own and no concurrent users. Based on `functional-spec.md` and `requirements.md`.

| Topic | Requirement |
|-------|-------------|
| Load | One browser; at most one check at a time per tab. A person with many tabs open sends at most one request per page visit; there is no batching or background work. |
| Growth | No growth projection applies. |
| Data growth | No history is stored; only the current state of each open tab is kept in short-lived session storage and is discarded when the tab or the browser session ends. |
| Scaling triggers | None. The only scaling concern is the hosted service's own rate limit, which the extension handles by showing Could not check (BR5.6) and not retrying. |
| Concurrency | Several tabs may be checked at once; each visit and attempt is independent (BR3.3). |

## Assumptions & Open Questions

- Rate limits on the person's Jev key could be hit by someone who opens very many pages quickly; the extension does not queue or throttle requests in this version. [assumption]
- No NFR from the requirements applies here, so none is traced to this file.
