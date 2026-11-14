# Wireframes

Low-fidelity concept wireframes for the browser extension. They build on `intent-statement`, `scope-document` (items S1 to S5) and `intent-backlog` (B1, B2, B3). Look and feel: match the native look of Edge and Chrome [Q5]. Accessibility target: WCAG 2.1 AA, including screen reader support and not relying on colour alone [Q4].

Verdict labels: Safe, Suspicious, Dangerous, and Could not check [Q3].

## Screen 1: Toolbar icon (scope item S1)

The icon shows the verdict for the current page [Q1]. Colour is never the only signal; each state also has a different shape and a text badge.

```
 Browser toolbar
 +--------------------------------------------+
 | [<] [>] [R]  https://example.com      [ICON] |
 +--------------------------------------------+

 ICON states (shape + badge text, not colour alone)
   Safe          [ shield  OK  ]
   Suspicious    [ shield  ?   ]
   Dangerous     [ shield  !   ]
   Could not check [ shield  -  ]
   Checking      [ shield  ... ]
```

Accessibility note: the icon has a text label announcing the verdict (for example "Dangerous"); it is reachable with the keyboard and opens the popup with Enter or Space.

## Screen 2: Popup (scope items S1, S3)

```
 +------------------------------------+
 | h1  Phishing Guard                 |
 +------------------------------------+
 | h2  Verdict: DANGEROUS   [ ! ]     |
 |                                    |
 | Page:  example.com                 |
 |                                    |
 | Why:   <short reason from Jev>     |
 |                                    |
 | [ Check again ]   [ Settings ]     |
 +------------------------------------+
```

States:

```
 Checking        Could not check              Safe
 +------------+  +-----------------------+   +----------------+
 | Checking...|  | Could not check       |   | Verdict: SAFE  |
 | (progress) |  | Reason: no connection |   | Why: <reason>  |
 |            |  | or key missing        |   |                |
 |            |  | [Check again][Settings]|  | [Check again]  |
 +------------+  +-----------------------+   +----------------+
```

Accessibility note: heading h1 for the popup title and h2 for the verdict; main region wraps the verdict and reason; keyboard entry point is the "Check again" button; the verdict text is announced when it changes (live status region).

## Screen 3: Warning overlay on a risky page (scope item S2)

Chosen style: a large overlay with "Go back" and "Continue anyway". The page is never blocked for good; the person can always continue [Q2].

```
 +------------------------------------------------+
 |  (page content dimmed behind)                  |
 |   +----------------------------------------+   |
 |   | h1  Warning: this site may be dangerous |   |
 |   |                                        |   |
 |   | Verdict: DANGEROUS   [ ! ]             |   |
 |   | Why: <short reason from Jev>           |   |
 |   |                                        |   |
 |   | [ Go back ]        [ Continue anyway ] |   |
 |   +----------------------------------------+   |
 +------------------------------------------------+
```

Accessibility note: h1 inside a dialog landmark; focus moves into the overlay and starts on "Go back"; Escape closes the overlay and returns focus to the page; focus is trapped while the overlay is open; the verdict is announced on open.

## Screen 4: Settings page (scope items S4, S5)

```
 +--------------------------------------------+
 | h1  Settings                               |
 +--------------------------------------------+
 | h2  Verdict source                         |
 |   ( ) Hosted Jev                           |
 |   ( ) Hosted OpenJev                       |
 |                                            |
 | h2  Connection                             |
 |   Jev key:         [ **************** ]     |
 |   Server address:  [ https://...      ]    |
 |                                            |
 |   [ Save ]   [ Test connection ]           |
 |   Status: <saved / error message>          |
 +--------------------------------------------+
```

States: empty (first run, nothing saved, a short hint explains what to enter), saving, saved, and error (names the field and the fix, keeps what was typed).

Accessibility note: h1 for the page, h2 for each group, a visible label for every field, a form landmark in main; keyboard entry point is the first radio option; errors are described in text, not colour alone.

## Assumptions & Open Questions

- The overlay appears for every risky verdict, including Suspicious, which may feel noisy against the goal of few false alarms. This follows the person's choice and is flagged for review. [assumption]
- Whether the settings page allows more than one saved connection is not defined. [assumption]
- The exact wording of the reason text depends on what Jev returns. [assumption]
