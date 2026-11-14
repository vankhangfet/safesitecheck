# NFR Requirements — u1-core-check — Questions

The quality targets for this unit already exist in the requirements: a verdict or "Could not check" within 5 seconds (NFR3), only the allowed data leaves the browser and the key never appears in code or logs (NFR2), screens meet WCAG 2.1 AA (NFR4), the page keeps working if Jev fails (NFR6), and tests, 80% line coverage and the linter (NFR7, NFR8). Scalability does not apply: one person's own browsing, no shared service. These questions cover the technology choices you left open earlier, and what may be logged.

## Q1. [Developer] How should the extension be built into the files the browser loads?

Why we ask: browsers load an extension from a folder of built files, so a build step is needed for TypeScript. You have not chosen a bundler yet.

- A. esbuild with a small build script: fast, few moving parts, no plugin to learn (suggested)
- B. Vite with a web-extension plugin
- C. webpack
- D. Only the TypeScript compiler, with no bundler
- E. Not yet defined
- X. Other (please specify)

[Answer]: A. esbuild with a small build script

## Q2. [Quality] Which test runner should be used?

Why we ask: the testing rules need a runner that works with TypeScript, mocks calls to Jev and reports line coverage against the 80% floor.

- A. Vitest (suggested): TypeScript works out of the box, includes mocking and coverage
- B. Jest
- C. Node's built-in test runner
- D. Not yet defined
- X. Other (please specify)

[Answer]: B. Jest

## Q3. [Developer] Which package manager should the project use?

Why we ask: it decides the lock file and the commands used to install, build and test.

- A. npm (suggested): installed with Node, nothing extra to set up
- B. pnpm
- C. yarn
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. npm

## Q4. [Security] What may the extension write to its logs?

Why we ask: your rule is that the Jev key never appears in logs, and the website address of every page visited is sensitive too.

- A. Only error kinds and timings; never the key, never page addresses, never signals; extra detail only when you switch on a debug setting, and even then never the key (suggested)
- B. Also keep a short local list of recent checks (address and verdict) that you can view in the popup
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Only error kinds and timings; never the key, never page addresses, never signals

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
