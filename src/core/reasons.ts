import type { FailureKind, PageSignals, RiskOption, VerdictLabel } from '../shared/types';

/** Fixed sentence for each option Jev can choose (BR2.3). */
const OPTION_REASONS: Record<RiskOption, string> = {
  safe: 'This looks like a normal website.',
  phishing: 'This page may be trying to steal logins, card details or personal data.',
  scam: 'This page may be a fake shop, fake support or another kind of fraud.',
  malware: 'This page may spread malware or unwanted downloads.',
  other_risk: 'This page may carry another kind of security risk.',
};

/** Used when the label is not Safe although the chosen option is safe (low confidence). */
const UNSURE_REASON = 'The check was not sure about this page, so take care.';

/** One sentence per failure, in plain words (error catalog). */
const FAILURE_REASONS: Record<FailureKind, string> = {
  'missing-key': 'A key is missing. Add it in Settings.',
  'missing-address': 'A server address is missing. Add it in Settings.',
  'rejected-key': 'The key was not accepted. Check it in Settings.',
  'no-connection': 'There is no connection.',
  'rate-limited': 'The service is limiting requests.',
  overloaded: 'The service is busy.',
  timeout: 'No answer came in time.',
  'unreadable-answer': 'The answer could not be read.',
  'unsupported-request': 'The request was not accepted.',
  'unsupported-page': 'This page cannot be checked.',
  'permission-denied':
    'The browser has not allowed contact with the server address. Save it again in Settings.',
  'internal-error': 'Something went wrong inside the extension.',
};

export function failureReason(kind: FailureKind): string {
  return FAILURE_REASONS[kind];
}

export function optionReason(choice: RiskOption, label: VerdictLabel): string {
  return choice === 'safe' && label !== 'safe' ? UNSURE_REASON : OPTION_REASONS[choice];
}

/** The longer part lists each signal that is yes, in plain words; absent when none (BR2.3). */
export function signalReasons(signals: PageSignals): string | undefined {
  const parts: string[] = [];
  if (signals.asksForPassword) parts.push('The page asks for a password.');
  if (signals.asksForPaymentCard) parts.push('The page asks for a payment card number.');
  if (signals.formSendsToOtherSite)
    parts.push('A form on the page sends what you type to another website.');
  return parts.length > 0 ? parts.join(' ') : undefined;
}
