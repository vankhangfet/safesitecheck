# Team-Level Rules

> This team's affirmed practices and corrections. Loaded after `org.md` as
> strict-additive guidance; contradictions with broader policy are rejected.
> Populated by the practices-discovery affirmation gate. Edit at the gate,
> not directly.

## Way of Working

- We work trunk-based: one `main` branch, and each finished piece of work lands on `main` as a single squashed commit.
- We are a solo builder, so no second-person pull-request review is assumed; the builder decides.
- We make a short-lived branch only when the builder asks for one.

## Walking Skeleton

- We build the thin end-to-end slice first: open a page, ask Jev, show a verdict. It proves the riskiest connection (extension to Jev) before the real features go in.

## Testing Posture

- **Methodology**: test-after
- **Ordering**: Implement each testable layer, then write and run that layer's tests.
- **Methodology evidence**: The person chose "write the code first, then the tests for it" (Q3), matching the framework default for this scope.
- Coverage: we keep an 80% line-coverage floor.
- Gate: tests run and pass before merge.
- Tooling: test runner not chosen yet; calls to Jev are mocked in tests.

## Guard Policy

<!-- Affirmed by the team. Mode: strict, relaxed, or off. Strict here holds for every intent, whatever one person asks in chat; relaxed or off here applies to every intent whose policy came from its scope, unless project.md or the person sets another; changing this line changes it. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

- We package a build automatically when work is merged.
- We submit to the Edge Add-ons and Chrome Web Store by hand, after a manual check by the builder.
- Store review is an external gate and there is no instant rollback; rolling back means re-publishing the previous version.
- CI platform and version scheme are not chosen yet.

## Code Style

- We write TypeScript, with a standard formatter and a linter.
- The linter must pass before merge.
- Naming: camelCase for variables and functions, PascalCase for types.
- Bundler not chosen yet.
## Forbidden

<!-- Team-specific forbidden patterns -->

## Mandated

<!-- Team-specific mandates -->

## Corrections

<!-- Self-learning loop appends here. -->
