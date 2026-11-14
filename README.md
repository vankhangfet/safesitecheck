# SafeSiteCheck

An Edge and Chrome (Manifest V3) extension that asks [TypeSafe Jev](https://docs.typesafe.ai/introduction) whether the page you opened is harmful, phishing or a security risk, and shows you a verdict.

> **Status: early walking skeleton (v0.1.0).** The core check is built and unit tested. It has not yet been loaded in a real browser or run against the real Jev service. Treat it as a work in progress.

## What it does

- Checks each page you visit and shows one of four results: **Safe**, **Suspicious**, **Dangerous** or **Could not check**.
- Warns only. The first version never blocks a page.
- Each person enters their own Jev key on the settings page. The key stays on that device, in extension storage, until you remove it.

## What is sent to Jev

Only these, and the same for every page:

- the page address with the query string, fragment and login details removed
- three yes/no signals: the page asks for a password, asks for a payment card, or has a form that sends to another site

No page text is sent. Logs hold only error kinds and timings. The key is never written to code, committed files or logs.

## How the verdict is decided

The extension turns Jev's answer into a verdict with these thresholds:

- **Dangerous**: 70% or more, with a confident Jev answer.
- **Suspicious**: 40% or more, or an "other risk" result on top, or Jev confidence below 0.6.
- **Safe**: anything lower.
- **Could not check**: no key, no permission for the server, a failure, or no answer within 5 seconds of the visit starting. There is no automatic retry.

Jev returns no reason text, so the extension writes the reason shown to you.

## Build and load

You need Node.js and npm.

```powershell
npm install
npm run build
```

Then load the `dist/` folder:

1. Open `edge://extensions` or `chrome://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked** and select `dist/`.
4. Open the extension's settings, enter your Jev key and save. The browser asks for permission to reach the server address when you save.

## Development

| Command                  | What it does                                            |
| ------------------------ | ------------------------------------------------------- |
| `npm run build`          | Bundles the extension into `dist/` with esbuild         |
| `npm test`               | Runs the Jest tests                                     |
| `npm run test:coverage`  | Runs the tests with coverage (floor: 80% line coverage) |
| `npm run lint`           | ESLint                                                  |
| `npm run format:check`   | Prettier check                                          |
| `npm run typecheck`      | TypeScript check                                        |
| `npm run check:key-scan` | Scans the project for key-shaped strings                |

Source layout under `src/`: `shared`, `core` (the check and verdict rules), `adapters` (Jev), `background`, `content` (page signals), `popup`, `options`, and `test-support`.

## Roadmap

- Page warnings in the page itself.
- An OpenJev source. Selecting it currently ends in an internal error.
- Remembering a verdict for 1 hour.
- A quality measurement of the verdicts.
- Rename the remaining user-visible "Phishing Guard" and "Jev Web Guard" labels to SafeSiteCheck.
- Store submission to the Edge Add-ons and Chrome Web Store (by hand).

## Known gaps

- Jev rate limits and terms are not yet checked.
- If the page-signal step is interrupted, a re-check can send all-no signals.
- `npm audit` reports findings in dev tooling only. Nothing that ships is affected.

## Project process

This project is built with AI-DLC. The decisions and design records are in `aidlc/`.

## License

Not licensed yet. All rights reserved.
