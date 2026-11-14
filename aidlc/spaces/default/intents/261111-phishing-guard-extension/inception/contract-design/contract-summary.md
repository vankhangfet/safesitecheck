# Contract Summary

Every formal contract between units and with outside services. Based on `unit-of-work.md`, `unit-of-work-dependency.md`, `components.md`, `requirements.md`, the confirmed answers in `contract-design-questions.md` (Q1 to Q7) and TypeSafe's public Jev documentation (docs.typesafe.ai and https://api.typesafe.ai/openapi.json), which I read for this stage.

## Change to an Earlier Rule

Earlier stages said only the website address (without query strings) is sent to Jev (feasibility Q3, requirement FR1.2, NFR2, constraint C5, and the notice on the settings page). By your answers to Q1, Q5 and Q7, Jev now receives the website address plus a few simple signals worked out on the device, but no page text. The rule applies to every page, with no exceptions for private windows or internal addresses (Q6). The earlier documents are not revised now; they will be revised when each stage is next revisited (Q7). Until then, this summary is the rule that applies.

## Contracts Table

| # | Provider Unit | Consumer | Mechanism | Owner |
|---|---------------|----------|-----------|-------|
| C1 | u1-core-check (JevAdapter), u4-openjev-source (OpenJevAdapter) | u1-core-check (VerdictService) | In-process interface: source adapter | u1-core-check |
| C2 | u3-verdict-memory (VerdictMemory) | u1-core-check (VerdictService) | In-process interface: verdict memory | u1-core-check |
| C3 | u1-core-check (VerdictService) | u1-core-check (BrowserPresenter), u2-page-warnings (PageWarningPresenter) | Event message across the extension and page boundary | u1-core-check |
| C4 | u1-core-check (VerdictService) | u5-quality-measurement (QualityMeasurement) | In-process function, runnable outside the browser | u1-core-check |
| C5 | u1-core-check (page-side signal collection) | u1-core-check (PageWatcher) | Message from the page to the extension | u1-core-check |
| C6 | u1-core-check (SettingsManager) | u1-core-check (VerdictService) | In-process interface: connection details for one request | u1-core-check |
| C7 | External: TypeSafe hosted Jev API | u1-core-check (JevAdapter) | HTTPS REST, JSON | TypeSafe (excerpt pinned here) |
| C8 | External: hosted OpenJev server | u4-openjev-source (OpenJevAdapter) | HTTPS REST, JSON, assumed same shape as C7 | The OpenJev server's owner (to be confirmed) |

## C1. Source adapter (in-process)

Both adapters implement one contract so VerdictService does not know which source is used. [ADR-001, Q1 domain design]

```yaml shared-schema
contract: SourceAdapter
owner: u1-core-check
operations:
  check:
    input:
      subject:                      # what is judged; see C5 for signals
        address: string             # stripped website address, no query string or fragment
        signals: PageSignals        # simple signals worked out on the device; no page text
      connection:                   # from C6, for this request only
        serverAddress: string
        key: string                 # never logged, never stored by the adapter
      timeoutMs: integer            # the caller passes the remaining time; 5000 at most
    output:
      oneOf:
        - ok:
            label: [safe, suspicious, dangerous]
            reasonShort: string     # one short sentence
            reasonMore: string      # optional, a few sentences for "Show more"
            probabilities: object   # optional, per option, as returned by the source
            confidence: number      # optional, as returned by the source
        - failure:
            kind: [missing-key, rejected-key, no-connection, rate-limited, overloaded, timeout, unreadable-answer, unsupported-request]
            detail: string          # plain words, never contains the key
  testConnection:
    input: { connection: Connection }
    output: { ok: boolean, failure: optional FailureKind and field name }
rules:
  - An adapter never reads or stores the key itself; it uses only what the caller passes. [ADR-004]
  - An adapter never retries on its own. [Q4]
  - Consumers ignore unknown fields; providers may add optional fields.
```

## C2. Verdict memory (in-process)

```yaml shared-schema
contract: VerdictMemory
owner: u1-core-check
operations:
  get:  { input: { source: string, address: string }, output: optional RememberedVerdict }
  put:  { input: { source: string, address: string, verdict: Verdict }, output: void }
  clear: { input: {}, output: void }   # called when the source, key or server address changes
rules:
  - Entries expire after one hour unless changed.
  - Two addresses that differ only by query string share one entry.
  - The key and page signals are never stored.
  - Whether Could not check results are stored is not part of this contract; the default is that they are not stored. [open, see table below]
```

## C3. Verdict event (extension to presenters, across the page boundary)

```yaml asyncapi
asyncapi: 2.6.0
info: { title: Verdict events, version: 1.0.0 }
channels:
  verdict/updated:
    description: Sent by VerdictService when a check for a page visit ends, or a recheck is asked for.
    publish:
      message:
        payload:
          visitId: string          # ties the verdict to one page visit; presenters drop events for other visits
          tabId: integer
          address: string         # stripped website address
          label: [safe, suspicious, dangerous, could-not-check]
          reasonShort: string
          reasonMore: string       # optional
          failureKind: string      # optional, present when label is could-not-check
  verdict/recheck:
    description: Sent by a presenter when the person chooses "Check again".
    subscribe:
      message:
        payload: { visitId: string, tabId: integer }
rules:
  - Presenters pull the current verdict for a visit when they start, and are pushed updates afterwards.
  - A message for a visit that is no longer current is ignored by presenters.
  - Consumers ignore unknown fields.
```

## C4. Headless check (for the quality measurement)

```yaml shared-schema
contract: CheckAddress
owner: u1-core-check
operation:
  checkAddress:
    input: { address: string, signals: optional PageSignals, connection: Connection }
    output: Verdict                    # same as C3 label, plus failureKind when could-not-check
rules:
  - Must run outside the browser, so settings and storage are passed in rather than read from the browser.
  - Uses the same adapters and the same mapping as the extension.
```

## C5. Page signals (page to extension)

```yaml shared-schema
contract: PageSignals
owner: u1-core-check
fields:
  asksForPassword: boolean            # the page has a password field
  asksForPaymentCard: boolean         # the page has a card number field
  formSendsToOtherSite: boolean       # a form on the page sends data to a different website
rules:
  - Only these simple yes/no signals leave the page. No page text, no field values, no form contents.
  - New signals are added only by changing this contract and the notice shown on the settings page.
```

## C6. Connection details for one request

```yaml shared-schema
contract: ConnectionProvider
owner: u1-core-check
operation:
  getConnection: { input: {}, output: { source: [jev, openjev], serverAddress: string, key: optional string } }
rules:
  - Only SettingsManager implements this. It is the only component that reads the key. [ADR-004]
  - The key is passed for one request and is not kept by the caller.
  - A change of source, server address or key tells VerdictMemory to clear (C2).
```

## C7. External: TypeSafe hosted Jev API

Pinned from TypeSafe's published documentation. TypeSafe owns this contract; this excerpt lists only what the extension relies on.

```yaml
openapi: 3.1.0
info: { title: TypeSafe (excerpt), version: 0.2.0 }
servers: [ { url: https://api.typesafe.ai } ]
paths:
  /v1/systemone:
    post:
      summary: Answer typed questions about the content in `state`
      headers:
        Authorization: "Bearer <API_KEY>"
        Content-Type: application/json
      requestBody:
        model: "jev-latest"            # model name; the documentation says GET /v1/models lists the available names
        state: "<the website address and the page signals, as plain text or JSON>"
        questions:
          risk:
            type: choice
            instructions: "What kind of website is this?"
            criteria:
              safe: "A normal, legitimate website"
              phishing: "Tries to steal logins, card details or personal data by pretending to be another site"
              scam: "A fake shop, fake support or other fraud"
              malware: "Spreads malware or unwanted downloads"
              other_risk: "Some other security risk, such as a suspicious or newly made address"
      responses:
        "200":
          model: string
          answers:
            risk: { type: choice, choice: string, confidence: number, probabilities: { safe: number, phishing: number, scam: number, malware: number, other_risk: number } }
          usage: { input_tokens: integer, output_tokens: integer }
        "400": bad request body (for example too much nesting)
        "401": missing or invalid key
        "413": body over 32 MiB
        "415": unsupported content encoding
        "422": request failed validation; the body names the field
        "429": rate limit exceeded
        "529": temporarily overloaded
```

Failure mapping to C1: 401 maps to `rejected-key`, a missing key is `missing-key` before any request is made, 429 to `rate-limited`, 529 to `overloaded`, network failure to `no-connection`, the 5-second limit to `timeout`, a body that cannot be read or lacks the expected answer to `unreadable-answer`, and 400, 413, 415 and 422 to `unsupported-request`. No automatic retry on 429 or 529. [Q4]

How the probabilities and confidence become Safe, Suspicious or Dangerous is decided in Functional Design.

## C8. External: hosted OpenJev server

Assumed to accept the same request and return the same answer shape as C7 (Q3). I could not read OpenJev's own documentation, so this stays unconfirmed until the server is available.

```yaml
contract: OpenJevServer
shape: same as C7 at the server address the person enters
unconfirmed:
  - whether a key is required
  - whether the model name and question types match
```

## Contract Ownership Rules

- u1-core-check owns every internal contract (C1 to C6). u3, u4 and u5 implement or use them and do not change them without agreement in the next design pass. This also settles the dependency direction raised in the Units Generation review: u1 depends on the contracts, not on u3 or u4, which implement them.
- C7 is owned by TypeSafe. Changes there are detected by the "unreadable-answer" and "unsupported-request" failures and fixed in JevAdapter only.
- Breaking changes to an internal contract are made in one release because all units except u5 ship in one package. u5 runs from the same source and is rebuilt with it.
- Additive changes stay safe: consumers ignore unknown fields and providers add only optional fields.
- Anything sent to Jev is changed only by changing C5 or C7 here and updating the notice on the settings page.

## Open Questions

| Contract | Question | Blocks |
|----------|----------|--------|
| C5 | Which component collects the page signals inside the page is not in the domain design (PageWatcher uses browser events and cannot read the page). A page-side collector is needed, assigned here to u1-core-check; the domain design should be updated. | u1-core-check |
| C7 | Whether the extension can call api.typesafe.ai directly from the browser (permission and cross-origin rules) and how the key is sent were not tested. | u1-core-check |
| C7 | Judging from the address and three yes/no signals may not reach the 90% and 1% targets; the quality measurement (u5) will show this. | u5-quality-measurement |
| C8 | Whether OpenJev needs a key and matches C7 is unconfirmed. | u4-openjev-source |
| C2 | Whether Could not check results are remembered (default: no). | u3-verdict-memory |
| C3 | Pages that change address without reloading are not covered by any contract yet. | u1-core-check |
| C7 | The extension must be allowed to run on all websites to collect signals and show warnings; this permission will be visible to employees and to store reviewers. | u1-core-check, u2-page-warnings |

## Assumptions

- The Jev state is sent as simple text or JSON; the exact wording is decided in Functional Design. [assumption]
- `jev-latest` is the model name to use and can be changed in settings if needed. [assumption]
- The one-hour memory and the 5-second limit from the requirements apply to all adapters. [assumption]
