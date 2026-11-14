# NFR Design — u1-core-check — Questions

The patterns follow from the NFR requirements and the functional design, so most of this stage needs no choice from you. Two security choices remain that change what the person experiences.

## Q1. [Security] How long should the Jev key be kept on the device?

Why we ask: the key must stay on the device and never in code or logs. Keeping it in the extension's own storage makes it survive restarts; keeping it only for the browser session means the person types it again each time the browser starts.

- A. Keep it in the extension's own storage until the person removes it (suggested): convenient, readable only by the extension
- B. Keep it only for the browser session and ask again after the browser restarts: the key does not stay on disk
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Keep it in the extension's own storage until the person removes it

## Q2. [Security] When should the extension ask the browser for permission to call the verdict server?

Why we ask: calling a server from an extension needs the browser's permission for that address. Asking at install shows employees a long permission list at the start; asking when the person saves the settings shows only the address they chose.

- A. Ask for the permission when the person saves the server address, for that address only (suggested)
- B. Ask at install for the hosted Jev address and any address the person might enter
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Ask for the permission when the person saves the server address, for that address only

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
