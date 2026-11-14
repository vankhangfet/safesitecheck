# Interaction Specification

Component-level specification in the format of `component-spec-template.md`, based on `mockups.md`, `stories.md` and `requirements.md`.

## Component: Toolbar icon

| Field | Value |
|---|---|
| Component | Toolbar icon |
| Description | Shows the verdict for the current page at a glance |
| Category | feedback |

### States

| State | Description | Trigger |
|---|---|---|
| checking | Shield with "..." | A check has started |
| safe | Shield with check mark | Verdict Safe |
| suspicious | Shield with question mark | Verdict Suspicious |
| dangerous | Shield with exclamation mark | Verdict Dangerous |
| could-not-check | Shield with dash | Verdict Could not check |
| focus | Visible focus ring | Keyboard focus |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | button |
| Keyboard interaction | Enter or Space opens the popup |
| Label | "Phishing Guard: <verdict>[, <reason>]" |
| Contrast ratio | WCAG AA: 3:1 for the icon against the toolbar in light and dark themes |
| Screen reader | Verdict announced when it changes |
| Focus management | Focus stays on the icon after the popup closes |

## Component: Popup

| Field | Value |
|---|---|
| Component | Popup |
| Description | Shows verdict, one short reason, "Check again" and Settings |
| Category | display |

### States

| State | Description | Trigger |
|---|---|---|
| checking | Progress and a live status message | Check running |
| verdict | Label, page, reason, actions | Verdict available |
| could-not-check | Reason shown, Settings offered | Timeout, missing key, no connection, rate limit, unreadable answer, unsupported page |
| expanded | Extra sentences under the reason | "Show more" chosen |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | none beyond native elements; h1 title, h2 verdict, main region |
| Keyboard interaction | Tab through "Show more", "Check again", Settings; Enter or Space activates |
| Screen reader | Verdict text is in a polite live region and read when it changes |
| Focus management | Opens with focus on "Check again" |

## Component: Banner (Suspicious)

| Field | Value |
|---|---|
| Component | Slim banner |
| Description | Tells the person a page is Suspicious without taking over the page |
| Category | feedback |

### States

| State | Description | Trigger |
|---|---|---|
| shown | Verdict and one short sentence | Verdict Suspicious |
| expanded | A few more sentences | "Show more" |
| dismissed | Hidden until the page is reloaded | "x" or Escape in the banner |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | status (polite); not a dialog, so focus is not moved |
| Keyboard interaction | Tab reaches "Show more" and "x"; Escape dismisses while focus is inside |
| Contrast ratio | 4.5:1 text, 3:1 icon and border, in both themes; the "?" and the word "Suspicious" carry the meaning, not colour |

## Component: Overlay (Dangerous)

| Field | Value |
|---|---|
| Component | Warning overlay |
| Description | Large warning with "Go back" and "Continue anyway" |
| Category | feedback |

### States

| State | Description | Trigger |
|---|---|---|
| open | Dialog shown over the dimmed page | Verdict Dangerous |
| expanded | A few more sentences | "Show more" |
| closed | Overlay removed | "Go back", "Continue anyway" or Escape |

### Behaviour

| Action | Result |
|---|---|
| Go back | Return to the previous page; if there is none, close the overlay and stay on the page |
| Escape | Same as Go back |
| Continue anyway | Close the overlay for this page load only; the toolbar icon keeps showing Dangerous |
| Page reload | The overlay is shown again |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | dialog (modal) with an accessible name taken from its heading |
| Keyboard interaction | Focus starts on "Go back"; Tab cycles inside; Escape closes |
| Focus management | Focus is trapped inside while open and returns to the previously focused element on close |
| Screen reader | The page behind is hidden from assistive technology while the overlay is open; the verdict is announced on open |

## Component: Settings form

| Field | Value |
|---|---|
| Component | Settings form |
| Description | Choose the verdict source and enter the key and server address |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| empty | Nothing saved, a short hint | First run |
| editing | Fields hold typed values | Typing |
| testing | "Testing..." status | "Test connection" |
| saved | "Saved" status | "Save" succeeded |
| error | Message naming the field and the fix; typed values kept | Invalid address, rejected key, unreachable server |

### Props / Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| source | hosted Jev or hosted OpenJev | yes | none | Where verdicts come from |
| key | text (hidden by default) | yes for Jev | empty | The person's own key; stored on the device only |
| server address | text | yes | empty | Address of the chosen server |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | native form, radio group, text inputs |
| Keyboard interaction | Tab order follows the visual order; Enter on "Save" saves |
| Label | Every field has a visible label; errors are text next to the field and are not shown by colour alone |
| Screen reader | The status line is a polite live region |

## Responsive Behaviour

The extension surfaces are fixed-size browser surfaces and a settings tab. The overlay and banner scale with the page width.

| Breakpoint | Behaviour |
|---|---|
| narrow page (<768px) | Banner text wraps to two lines; overlay uses the full width minus a margin |
| wider page | Overlay is centred with a maximum width |

## Assumptions & Open Questions

- The popup is a fixed width that suits the browser's default; exact size is chosen in Code Generation. [assumption]
- Behaviour on single-page address changes is not specified here. [assumption]
