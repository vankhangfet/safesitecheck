# Design System Mapping

There is no organisation design system. The screens match the native look of Edge and Chrome and follow the browser's light or dark theme. [rough mockups Q5, refined Q2] Based on `mockups.md` and `interaction-spec.md`.

## Principles

- Use the browser's own controls (buttons, radio buttons, text inputs) wherever possible, so they look native and are accessible by default.
- Use the system font and the browser's default text sizes; no custom fonts.
- Colour supports meaning but never carries it alone: every verdict also has a symbol and a word.

## Component Mapping

| Extension component | Native element or pattern | Notes |
|---|---|---|
| Toolbar icon | Browser action icon with badge text | Shield with symbol; badge repeats the symbol |
| Popup | Browser action popup | Headings h1 and h2; native buttons |
| Banner | Inline status region at the top of the page | Not modal; does not take focus |
| Overlay | Modal dialog over the page | Focus trap, accessible name |
| Settings page | Browser options page | Native form controls |

## Design Tokens (names only)

Values are chosen in Code Generation and must pass the contrast rules in `accessibility-checklist.md` in both themes.

| Token | Use |
|---|---|
| verdict-safe | Safe symbol and accent |
| verdict-suspicious | Suspicious symbol and accent |
| verdict-dangerous | Dangerous symbol and accent |
| verdict-unknown | Could not check symbol and accent |
| surface, surface-dim | Backgrounds of popup, banner, overlay and dimmed page |
| text, text-muted | Body and secondary text |
| focus-ring | Keyboard focus indicator |

## Spacing and Targets

- Interactive targets are at least 44 by 44 CSS pixels where the surface allows it (overlay buttons, banner buttons).
- Use a consistent spacing scale of 4, 8, 16, 24 and 32 pixels.

## Light and Dark Themes

- Each token has a light and a dark value, selected by the browser's theme.
- Every verdict symbol is checked for contrast in both themes.

## Assumptions & Open Questions

- Exact colour values and icon artwork are not chosen in this stage. [assumption]
- Browser toolbars differ slightly between Edge and Chrome; the icon is tested in both. [assumption]
