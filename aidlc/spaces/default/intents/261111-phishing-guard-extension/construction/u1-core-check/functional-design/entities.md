# Entities — u1-core-check

The data this unit owns, at design level (no code). Based on `unit-of-work.md` (the unit's boundaries), `components.md` (PageVisit, Verdict, Settings), `contract-summary.md` (C1, C3, C5, C6) and the answers in `functional-design-questions.md`.

```yaml
entities:
  - name: PageVisit
    description: One top-level page, or one address change within a page, that the extension checks. Owned by PageWatcher.
    attributes:
      - { name: visitId, type: text, required: true, unique: true, constraints: "new for every page open and for every in-page address change" }
      - { name: tabId, type: whole number, required: true }
      - { name: strippedAddress, type: text, required: true, constraints: "no query string, no fragment, no user name or password" }
      - { name: checkable, type: yes/no, required: true, default: "no", constraints: "yes only for http and https addresses outside the store sites" }
      - { name: signals, type: PageSignals, required: false, constraints: "present only when checkable" }
      - { name: attemptId, type: text, required: true, constraints: "changes with every check, including Check again; only the answer to the latest attempt is shown" }
      - { name: state, type: text, required: true, allowed_values: [checking, answered, timed-out, ended], default: checking }
    constraints:
      - "A visit that has ended never receives a verdict that is shown."
      - "A superseded attempt never produces a shown verdict."
    relationships:
      - { to: Verdict, cardinality: "one visit has zero or one shown verdict", direction: "PageVisit to Verdict" }

  - name: PageSignals
    description: Three simple yes/no facts worked out on the device. No page text, no field values.
    attributes:
      - { name: asksForPassword, type: yes/no, required: true, default: "no" }
      - { name: asksForPaymentCard, type: yes/no, required: true, default: "no" }
      - { name: formSendsToOtherSite, type: yes/no, required: true, default: "no" }
    constraints:
      - "Only these three fields may be sent to a verdict source."

  - name: Verdict
    description: The one result shown for a page visit. Owned by VerdictService.
    attributes:
      - { name: verdictId, type: text, required: true, unique: true }
      - { name: visitId, type: text, required: true, references: "PageVisit.visitId" }
      - { name: attemptId, type: text, required: true, references: "PageVisit.attemptId" }
      - { name: strippedAddress, type: text, required: true }
      - { name: label, type: text, required: true, allowed_values: [safe, suspicious, dangerous, could-not-check] }
      - { name: reasonShort, type: text, required: true, constraints: "one short sentence" }
      - { name: reasonMore, type: text, required: false, constraints: "lists the signals seen; absent when none" }
      - { name: failureKind, type: text, required: false, allowed_values: [missing-key, missing-address, rejected-key, no-connection, rate-limited, overloaded, timeout, unreadable-answer, unsupported-request, unsupported-page], constraints: "present only when label is could-not-check" }
      - { name: source, type: text, required: true, allowed_values: [jev, openjev, none] }
      - { name: checkedAt, type: date and time, required: true }
    constraints:
      - "label could-not-check requires a failureKind; any other label has none."
      - "Several verdict records may exist for one visit over time (one for each attempt); at most one is the one currently shown, the one for the latest attempt."
    relationships:
      - { to: PageVisit, cardinality: "many verdict records for a visit over time, one shown", direction: "Verdict to PageVisit" }

  - name: Settings
    description: The person's source choice and connection details, stored on the device only. Owned by SettingsManager.
    attributes:
      - { name: settingsId, type: text, required: true, unique: true, default: "the single settings record" }
      - { name: source, type: text, required: false, allowed_values: [jev, openjev], constraints: "unset until the person chooses" }
      - { name: serverAddress, type: text, required: false, constraints: "must be a valid secure (https) web address; hosted Jev starts with https://api.typesafe.ai when none is saved; hosted OpenJev needs one" }
      - { name: modelName, type: text, required: true, default: "jev-latest", constraints: "the model name sent to the service" }
      - { name: keyPresent, type: yes/no, required: true, default: "no", constraints: "the key itself is kept only by SettingsManager, never in this record's visible fields" }
    constraints:
      - "The key is never written to logs, committed files or any message other than the single request it is passed to."
```

## Summary

Four things are modelled. A page visit is created for every top-level page open or in-page address change, and carries the stripped address and the three yes/no signals. Each visit ends in at most one shown verdict with one of four labels, a short reason and, when the label is Could not check, the reason for failing. The settings record holds the source, the server address and whether a key exists; the key itself stays inside SettingsManager.
