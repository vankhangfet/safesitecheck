# Refined Mockups

Mid-fidelity text mockups that refine `wireframes.md` and `user-flow.md` using `stories.md` and `requirements.md`. Look and feel match the native Edge and Chrome look; screens follow the browser's light or dark theme; text is English only. [rough mockups Q5, refined Q2, Q3]

Verdict labels: Safe, Suspicious, Dangerous, Could not check. Story and requirement references are in brackets.

## Screen 1: Toolbar icon (US2.1, FR2.1)

A shield in every state. Shape differs by symbol, and a text badge repeats it, so colour is never the only signal. [Q1]

```
 Safe             Suspicious        Dangerous         Could not check     Checking
 [ shield  v  ]   [ shield  ?  ]    [ shield  !  ]    [ shield  -  ]      [ shield  ... ]
```

- Accessible name examples: "Phishing Guard: Safe", "Phishing Guard: Dangerous", "Phishing Guard: Could not check, no answer in time".
- Opens the popup with Enter or Space.

## Screen 2: Popup (US2.2, FR2.2, FR2.3)

```
 +------------------------------------------+
 | h1  Phishing Guard                       |
 +------------------------------------------+
 | h2  [ ! ] Dangerous                      |
 |                                          |
 | Page:   example.com                      |
 | Why:    <one short sentence>             |
 |         [ Show more v ]                  |
 |                                          |
 | [ Check again ]            [ Settings ]  |
 +------------------------------------------+
```

States:

```
 Checking                 Safe                        Could not check
 +--------------------+   +----------------------+   +-----------------------------+
 | [ ... ] Checking   |   | [ v ] Safe           |   | [ - ] Could not check       |
 | (progress, live    |   | Why: <one sentence>  |   | Why: no answer in time /    |
 |  status message)   |   | [ Check again ]      |   | key missing / no connection |
 +--------------------+   +----------------------+   | / rate limit / cannot check |
                                                      | [ Check again ] [ Settings ]|
                                                      +-----------------------------+
```

- The reason is one short sentence. "Show more" reveals a few more sentences. [Q5]
- When Jev gives no reason, a default sentence for the label is shown. [AC2.2.3]
- "Check again" ignores the remembered verdict. [AC2.2.2]

## Screen 3: Slim banner for Suspicious pages (US3.2, FR3.2)

```
 +--------------------------------------------------------------+
 | [ ? ] Suspicious: <one short sentence>   [ Show more ] [ x ] |
 +--------------------------------------------------------------+
 | (the page continues below and stays fully usable)            |
```

- Dismiss with the "x" button or Escape while focus is in the banner.
- The banner returns when the page is reloaded. [FR3.3]

## Screen 4: Overlay for Dangerous pages (US3.1, FR3.1, FR3.5)

```
 +------------------------------------------------------------+
 |  (page dimmed behind and hidden from assistive technology) |
 |   +----------------------------------------------------+   |
 |   | h1  Warning: this site may be dangerous            |   |
 |   | [ ! ] Dangerous                                    |   |
 |   | Why: <one short sentence>   [ Show more v ]        |   |
 |   |                                                    |   |
 |   | [ Go back ]                  [ Continue anyway ]   |   |
 |   +----------------------------------------------------+   |
 +------------------------------------------------------------+
```

- Focus starts on "Go back". Escape acts as "Go back". Focus is trapped inside the overlay while open and returns to the previously focused element when it closes.
- "Go back" returns to the previous page. If the tab has no earlier page, the overlay just closes and the person stays on the page. [Q4]
- "Continue anyway" closes the overlay for this page load only. The toolbar icon keeps showing Dangerous. [FR3.3, FR3.4]

## Screen 5: Settings (US5.1, US5.2, FR5)

```
 +-------------------------------------------------------+
 | h1  Settings                                          |
 +-------------------------------------------------------+
 | h2  Verdict source                                    |
 |   ( ) Hosted Jev                                      |
 |   ( ) Hosted OpenJev                                  |
 |                                                       |
 | h2  Connection                                        |
 |   Jev key:          [ **************** ]  (show/hide) |
 |   Server address:   [ https://...        ]            |
 |   Only the website address, without query strings,    |
 |   is sent for each check.                             |
 |                                                       |
 |   [ Save ]   [ Test connection ]                      |
 |   Status: <saved / error message>                     |
 +-------------------------------------------------------+
```

- The one-line notice about what is sent is always visible near the connection fields. [Q6]
- The key is stored on the device only. [FR5.2]
- Empty state (first run): a short hint explains what to enter.
- Error state: names the field and the fix, keeps what was typed. [FR5.3]

## Screen State Coverage

| Screen | Empty / first run | Loading | Success | Error | Partial / edge |
|--------|-------------------|---------|---------|-------|----------------|
| Toolbar icon | n/a | Checking | Verdict icon | Could not check | page that cannot be checked |
| Popup | no page yet: hint | Checking | Verdict and reason | Could not check with reason | no reason from Jev: default sentence |
| Banner | n/a | n/a | Suspicious banner | n/a | very long reason: "Show more" |
| Overlay | n/a | n/a | Dangerous overlay | n/a | no earlier page: overlay just closes |
| Settings | first-run hint | Saving, Testing | Saved | field error | rejected key, bad address |

## Assumptions & Open Questions

- The exact text of the default sentences per verdict is to be written in Code Generation. [assumption]
- A rejected key shows "Could not check" with its own reason; the requirements review noted this case and it is not yet a numbered requirement. [assumption]
- Single-page address changes (a page that changes its address without reloading) are not drawn; their behaviour is open in the requirements. [assumption]
