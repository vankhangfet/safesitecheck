# Functional Design — u1-core-check — Questions

Most behaviour of this unit is already settled in the requirements, stories, mockups and contracts. These questions cover the points those left open and that the design cannot guess.

## Q1. [Architect] Where should the short reason shown with each verdict come from?

Why we ask: Jev's answer holds only the chosen option (safe, phishing, scam, malware or other risk), its confidence and a probability for each option. It contains no sentence of its own, yet every verdict needs a short reason (FR2.3).

- A. The extension writes the reason: one fixed plain sentence for each chosen option, and "Show more" lists the simple signals seen (for example "the page asks for a password") (suggested)
- B. No reason beyond the label; drop "Show more" for the first version
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. The extension writes the reason: one fixed plain sentence for each chosen option, and "Show more" lists the simple signals seen

## Q2. [Architect] Which starting thresholds turn Jev's probabilities into Safe, Suspicious or Dangerous?

Why we ask: the four labels are the extension's own, so it must decide how much probability makes a page Suspicious or Dangerous. The numbers can be tuned after the quality measurement (the next Bolt).

- A. Dangerous when the probabilities for phishing, scam and malware together reach 70% or more and Jev is confident; Suspicious when they reach 40% or more, when "other risk" is the top option, or when Jev's confidence is low; otherwise Safe (suggested)
- B. Stricter: Dangerous at 50% or more, Suspicious at 25% or more
- C. More relaxed: Dangerous at 85% or more, Suspicious at 55% or more
- D. Not yet defined
- X. Other (please specify)

[Answer]: A. Dangerous at 70% or more with confident Jev; Suspicious at 40% or more, when other risk is the top option, or when confidence is low; otherwise Safe

## Q3. [Architect] What should happen when a page changes its address without reloading (common on modern websites)?

Why we ask: this gap has been raised in every review since the requirements. Without a rule, the toolbar could keep showing the verdict of the old address.

- A. Treat the new address as a new page visit and check it again (suggested)
- B. Not covered in the first version; record it as a known limit
- C. Not yet defined
- X. Other (please specify)

[Answer]: A. Treat the new address as a new page visit and check it again

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
