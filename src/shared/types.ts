/**
 * Data model of u1-core-check (entities.md): the closed lists and the shapes that every
 * other component shares. Nothing in here touches the browser.
 */

export const VERDICT_LABELS = ['safe', 'suspicious', 'dangerous', 'could-not-check'] as const;
export type VerdictLabel = (typeof VERDICT_LABELS)[number];

/** Closed list of reasons a check can end in Could not check (functional design error catalog). */
export const FAILURE_KINDS = [
  'missing-key',
  'missing-address',
  'rejected-key',
  'no-connection',
  'rate-limited',
  'overloaded',
  'timeout',
  'unreadable-answer',
  'unsupported-request',
  'unsupported-page',
  'permission-denied',
  'internal-error',
] as const;
export type FailureKind = (typeof FAILURE_KINDS)[number];

export const SOURCE_NAMES = ['jev', 'openjev'] as const;
export type SourceName = (typeof SOURCE_NAMES)[number];
export type VerdictSource = SourceName | 'none';

export const RISK_OPTIONS = ['safe', 'phishing', 'scam', 'malware', 'other_risk'] as const;
export type RiskOption = (typeof RISK_OPTIONS)[number];
export type RiskProbabilities = Record<RiskOption, number>;

/** What a verdict source says about a page: the chosen option and how sure it is. */
export interface RiskAnswer {
  choice: RiskOption;
  confidence: number;
  probabilities: RiskProbabilities;
}

/** Three yes/no facts worked out on the device. No page text, no field values (contract C5). */
export interface PageSignals {
  asksForPassword: boolean;
  asksForPaymentCard: boolean;
  formSendsToOtherSite: boolean;
}

export const NO_SIGNALS: Readonly<PageSignals> = Object.freeze({
  asksForPassword: false,
  asksForPaymentCard: false,
  formSendsToOtherSite: false,
});

/** The only things that may be sent to a verdict source (NFR2.1). */
export interface CheckSubject {
  address: string;
  signals: PageSignals;
}

export const VISIT_STATES = ['checking', 'answered', 'timed-out', 'ended'] as const;
export type VisitState = (typeof VISIT_STATES)[number];

export interface PageVisit {
  visitId: string;
  tabId: number;
  /** No query string, fragment or login details (BR1.3). */
  strippedAddress: string;
  checkable: boolean;
  signals?: PageSignals;
  /** Changes with every check, including Check again (BR3.3). */
  attemptId: string;
  state: VisitState;
  /** Start of the current checking period: the visit start, reset by Check again (BR5.1). */
  startedAt: number;
}

export interface Verdict {
  verdictId: string;
  visitId: string;
  attemptId: string;
  strippedAddress: string;
  label: VerdictLabel;
  reasonShort: string;
  reasonMore?: string;
  failureKind?: FailureKind;
  source: VerdictSource;
  checkedAt: number;
}

export interface Settings {
  source?: SourceName;
  serverAddress?: string;
  modelName: string;
  /** The key itself is never part of this record (BR6.3). */
  keyPresent: boolean;
  debug: boolean;
}

export const DEFAULT_MODEL_NAME = 'jev-latest';
export const DEFAULT_JEV_ADDRESS = 'https://api.typesafe.ai';

/** The 5-second limit for a whole visit (BR5.1) and the 1-second wait for signals (BR7.5). */
export const VISIT_TIME_LIMIT_MS = 5000;
export const SIGNAL_WAIT_MS = 1000;
/** The address is cut to this length in the request (security design). */
export const MAX_ADDRESS_LENGTH = 2048;

export function isVerdictLabel(value: unknown): value is VerdictLabel {
  return typeof value === 'string' && (VERDICT_LABELS as readonly string[]).includes(value);
}

export function isFailureKind(value: unknown): value is FailureKind {
  return typeof value === 'string' && (FAILURE_KINDS as readonly string[]).includes(value);
}

export function isSourceName(value: unknown): value is SourceName {
  return typeof value === 'string' && (SOURCE_NAMES as readonly string[]).includes(value);
}

export function isVisitState(value: unknown): value is VisitState {
  return typeof value === 'string' && (VISIT_STATES as readonly string[]).includes(value);
}

/** Accepts only an object holding exactly three booleans; anything else is rejected (NFR2.7). */
export function parseSignals(value: unknown): PageSignals | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const { asksForPassword, asksForPaymentCard, formSendsToOtherSite } = record;
  if (
    typeof asksForPassword !== 'boolean' ||
    typeof asksForPaymentCard !== 'boolean' ||
    typeof formSendsToOtherSite !== 'boolean'
  ) {
    return null;
  }
  return { asksForPassword, asksForPaymentCard, formSendsToOtherSite };
}

/**
 * Verdict constraint (BR2.1): Could not check always carries a failure kind and any other
 * label never does. Throws so a broken verdict is never shown.
 */
export function assertValidVerdict(verdict: Verdict): Verdict {
  if (!isVerdictLabel(verdict.label)) {
    throw new Error('verdict label is not one of the four allowed values');
  }
  if (verdict.label === 'could-not-check' && !isFailureKind(verdict.failureKind)) {
    throw new Error('a Could not check verdict needs a failure kind');
  }
  if (verdict.label !== 'could-not-check' && verdict.failureKind !== undefined) {
    throw new Error('only a Could not check verdict may carry a failure kind');
  }
  if (verdict.reasonShort.length === 0) {
    throw new Error('every verdict needs a short reason');
  }
  return verdict;
}
