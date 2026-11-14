# Evidence

## Project type
- Greenfield: no code yet, and the workspace is not a git repository (no commit history to inspect).

## Lead (aidlc-pipeline-deploy-agent) inspected
- `aidlc/spaces/default/memory/org.md`: Way of Working, Walking Skeleton, Testing Posture, Deployment, Code Style, used as suggested defaults only.
- `aidlc/spaces/default/memory/team.md` and `project.md`: placeholder comments only, no affirmed content.
- Active scope `mvp`: 80% line-coverage floor, tests before merge, test-after unless affirmed.
- Brief facts: solo builder, Edge and Chrome extension, public store distribution, calls hosted Jev.
- No support agents were dispatched, so there are no contribution files.

## Inferences
- Solo builder makes PR review and multi-person approval gates not applicable as written.
- Store distribution adds an external review gate and no instant rollback.
- A hosted-API dependency means tests need mocking and secrets must stay out of the shipped package.

## Interview decisions
- Q1 Way of Working: one main branch, each finished piece squashed into one commit.
- Q2 Walking Skeleton: yes, build the thin slice first (open a page, ask Jev, show a verdict).
- Q3 Testing: write the code first, then the tests (test-after); 80% line coverage and tests before merge kept from the default.
- Q4 Deployment: package automatically on merge; submit to the stores by hand after a manual check.
- Q5 Code Style: TypeScript with a standard formatter and a linter that must pass before merge.
- Q6 Hard rules: only "NEVER put the Jev key in code, committed files or logs". The URL-only-to-Jev and WCAG 2.1 AA options were not selected, so they are not recorded as rules.
- Summary confirmation: "Looks correct".

## Unresolved uncertainty
- Git host and CI platform are not named.
- Test runner and bundler are not chosen.
- The workspace is not a git repository, so there is no commit and no branch protection to verify.
- Version scheme and release cadence are not defined.
