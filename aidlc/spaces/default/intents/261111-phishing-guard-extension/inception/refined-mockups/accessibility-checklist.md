# Accessibility Checklist

Target: WCAG 2.1 AA for every screen. [rough mockups Q4, NFR4] Based on `mockups.md` and `interaction-spec.md`. Boxes are checked in Build and Test, not now.

## Perceivable

- [ ] Every verdict has a symbol, a word and an accessible name; colour is never the only signal (icon, popup, banner, overlay).
- [ ] Normal text has at least 4.5:1 contrast and icons or borders at least 3:1, in both light and dark themes.
- [ ] Icons that carry meaning have text alternatives; decorative parts are hidden from screen readers.
- [ ] Text can be zoomed to 200% in the popup, banner, overlay and settings without loss of content.

## Operable

- [ ] Everything can be done with the keyboard: icon, popup actions, banner buttons, overlay buttons, settings fields.
- [ ] Visible focus indicator on every interactive element, with at least 3:1 contrast.
- [ ] No keyboard traps: the overlay traps focus while open but can always be closed with Escape.
- [ ] Overlay: focus starts on "Go back" and returns to the previous element when it closes.
- [ ] Targets are at least 44 by 44 CSS pixels where space allows.
- [ ] No time limits on reading a warning; nothing flashes.

## Understandable

- [ ] Plain-language labels and reasons (no security jargon); one short sentence first, more on request.
- [ ] Settings fields have visible labels; errors name the field and the fix in text and keep typed values.
- [ ] No unexpected context change on focus; actions need an explicit click or key press.
- [ ] The notice about what is sent to Jev is visible on the settings page.

## Robust

- [ ] Native elements are used where possible; ARIA only where needed (dialog for the overlay, status for the banner and live regions).
- [ ] Overlay is a modal dialog with an accessible name; the page behind it is hidden from assistive technology while it is open.
- [ ] Verdict changes are announced through polite live regions.
- [ ] Headings are in order (h1 then h2) in the popup, overlay and settings.

## How to Test

1. Automated scan of popup, settings and the injected banner and overlay.
2. Keyboard-only run through the main flows (visit, warning, setup).
3. Screen reader run (NVDA on Windows) for the popup, overlay and settings.
4. Zoom to 200% and 400%.
5. Contrast check of every token in light and dark themes.

## Assumptions & Open Questions

- A real screen reader pass happens in Build and Test, not before. [assumption]
- Behaviour of the banner and overlay on pages with unusual layouts is not yet checked. [assumption]
