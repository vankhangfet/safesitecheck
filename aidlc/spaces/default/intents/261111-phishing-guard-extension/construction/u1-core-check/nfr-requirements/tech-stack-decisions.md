# Technology Stack Decisions — u1-core-check

Choices and the reason for each. Each requirement carries its inception NFR ID with a sub-number. Based on the practices in `team-practices.md`, the answers in `nfr-requirements-questions.md` (Q1 to Q3), `contract-summary.md` and `requirements.md`.

| ID | Decision | Reason | Source |
|----|----------|--------|--------|
| NFR8.1 | Language: TypeScript. | Your practice; catches mistakes in the contracts between components at build time. | NFR8, team practices |
| NFR8.2 | Formatter and linter: a standard formatter and a linter that must pass before merge; camelCase for variables and functions, PascalCase for types. | Your code style practice. | NFR8, team practices |
| NFR8.3 | Build: esbuild, driven by a small build script, producing the folder the browser loads. | Fast and simple; a small build script is easy to read and review. (Q1) | NFR8, Q1 |
| NFR7.1 | Tests: Jest, written after the code for each layer, with every call to Jev mocked. | Your chosen runner (Q2) and testing practice. | NFR7, Q2 |
| NFR7.2 | Coverage: at least 80% of lines for this unit, checked by Jest's coverage report and enforced before merge. | Your coverage floor. | NFR7 |
| NFR7.3 | Tests run without manual setup beyond installing the project's packages, and no test needs a real key or a network. | Construction rules, BR7.2. | NFR7 |
| NFR5.1 | Platform: Manifest V3 extension for current Edge and Chrome from one code base; browser differences are handled in one small compatibility layer. | Both browsers share the extension format; one code base avoids drift. | NFR5 |
| NFR5.2 | Package manager: npm, with a committed lock file and exact versions for every dependency. | Your choice (Q3); exact versions per the project's safety rules. | NFR5, Q3 |

## Dependencies

A minimal set is planned: TypeScript, esbuild, Jest with a TypeScript transform, the linter and formatter, and a small types package for the browser's extension API. No runtime library is planned beyond what the browser provides. Every dependency is pinned to an exact version and checked for a well-known, actively maintained name before use. [project safety rules]

## Not Needed

- No database, server, cache or queue: the unit has none.
- No framework for the popup or settings page is planned; plain browser pages keep the extension small and easier to review for accessibility. [assumption]

## Assumptions & Open Questions

- The choice of linter and formatter (for example ESLint and Prettier) is made when the project is set up in Code Generation. [assumption]
- The extension API types package and Jest's TypeScript transform are chosen when the project is set up. [assumption]
