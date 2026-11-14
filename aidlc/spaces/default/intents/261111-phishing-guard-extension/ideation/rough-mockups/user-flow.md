# User Flow

Core flows for the extension, based on `intent-statement`, `scope-document` and `intent-backlog`, and the wireframes in `wireframes.md`.

## Flow 1: Visit a site and get a verdict (happy path)

```
Flow: Visit a site
Persona: Employee of an organisation that wants safer browsing
Trigger: The employee opens or switches to a web page
Steps:
  1. Page loads -> extension checks the page address with Jev -> toolbar icon shows "Checking"
  2. Verdict returns -> icon changes to Safe, Suspicious, Dangerous or Could not check
  3. Employee optionally opens the popup -> sees verdict and short reason
  4. If verdict is risky -> warning overlay appears on the page
Success outcome: The employee knows whether the page looks safe and why
Error paths:
  - Jev unreachable or key missing -> icon shows "Could not check" -> popup offers "Check again" and "Settings"
```

```
 Open page -> [Checking] -> verdict?
                              |-- Safe ---------> icon: Safe
                              |-- Suspicious ---> icon: ?  -> overlay
                              |-- Dangerous ----> icon: !  -> overlay
                              '-- Could not check -> icon: -  -> popup hint
```

## Flow 2: Respond to the warning overlay

```
Flow: Respond to a warning
Persona: Employee
Trigger: Overlay appears on a risky page
Steps:
  1. Overlay shows verdict and reason, focus on "Go back"
  2a. Employee chooses "Go back" -> returns to the previous page
  2b. Employee chooses "Continue anyway" -> overlay closes, page stays usable
Success outcome: The employee made an informed choice; the extension never blocked the page
Error paths:
  - Overlay cannot be shown on the page -> the toolbar icon still shows the verdict
```

## Flow 3: First-time setup

```
Flow: Set up the connection
Persona: Employee or the person setting it up
Trigger: First run, or "Could not check" because the key is missing
Steps:
  1. Open Settings -> choose hosted Jev or hosted OpenJev
  2. Enter key and server address -> choose "Save"
  3. Choose "Test connection" -> status shows saved or the reason it failed
Success outcome: Checks start working on the next page
Error paths:
  - Invalid key or address -> error names the field and the fix -> typed values are kept
```

## Information Architecture

- Toolbar icon (always visible) -> Popup -> Settings
- Overlay appears only on risky pages and is dismissed by the person

## Assumptions & Open Questions

- Whether the same employee sets up the connection or an administrator does is not defined. [assumption]
- Behaviour when the person switches tabs quickly (older results arriving late) is not defined at this level. [assumption]
