# Scalability Design — u1-core-check

Based on `scalability-requirements.md`. This unit runs inside one person's browser, so no scaling design is needed.

| Topic | Design |
|-------|--------|
| Load distribution | None. Each tab's visit is independent; at most one request is in flight for each visit's latest attempt. |
| Partitioning | None. The only data is per-tab state and one settings record. |
| Statelessness | The background process may be stopped and restarted by the browser at any time, so it keeps no state that cannot be rebuilt: per-tab state is in short-lived session storage; anything lost is rebuilt by treating the tab as a new visit (BR8.2). |
| Capacity thresholds | None defined. The hosted service's own limits are the only ceiling; they appear as rate-limited or overloaded answers and are shown as Could not check. |
| Many tabs at once | Restoring many tabs at once can send many requests together. This version does not throttle them; if this becomes a problem a small limit on parallel requests can be added behind the adapter contract without changing other components. |

## Assumptions & Open Questions

- Whether to limit parallel requests is decided after real use or after the quality measurement shows rate limits. [assumption]
