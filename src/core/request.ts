import { limitAddress } from './address';
import {
  RISK_OPTIONS,
  type CheckSubject,
  type RiskAnswer,
  type RiskOption,
  type RiskProbabilities,
} from '../shared/types';

export interface JevRequestBody {
  model: string;
  state: string;
  questions: {
    risk: {
      type: 'choice';
      instructions: string;
      criteria: Record<RiskOption, string>;
    };
  };
}

/** Contract C7 criteria for the one Choice question named risk. */
const RISK_CRITERIA: Record<RiskOption, string> = {
  safe: 'A normal, legitimate website',
  phishing: 'Tries to steal logins, card details or personal data by pretending to be another site',
  scam: 'A fake shop, fake support or other fraud',
  malware: 'Spreads malware or unwanted downloads',
  other_risk: 'Some other security risk, such as a suspicious or newly made address',
};

const yesNo = (value: boolean): string => (value === true ? 'yes' : 'no');

/**
 * Builds the request body from the typed subject (BR7.6). Only the address and the three named
 * signals are read from it, so nothing else can reach the request (NFR2.1).
 */
export function buildJevRequest(subject: CheckSubject, modelName: string): JevRequestBody {
  const state = [
    `address: ${limitAddress(subject.address)}`,
    `asksForPassword: ${yesNo(subject.signals.asksForPassword)}`,
    `asksForPaymentCard: ${yesNo(subject.signals.asksForPaymentCard)}`,
    `formSendsToOtherSite: ${yesNo(subject.signals.formSendsToOtherSite)}`,
  ].join('\n');
  return {
    model: modelName,
    state,
    questions: {
      risk: {
        type: 'choice',
        instructions: 'What kind of website is this?',
        criteria: { ...RISK_CRITERIA },
      },
    },
  };
}

const isFraction = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

function isRiskOption(value: unknown): value is RiskOption {
  return typeof value === 'string' && (RISK_OPTIONS as readonly string[]).includes(value);
}

/**
 * Reads the answer into a closed shape. Anything else, such as a missing part, an unknown option
 * or a number outside 0 to 1, gives null and is treated as unreadable (BR5.7, NFR2.7).
 */
export function parseJevAnswer(body: unknown): RiskAnswer | null {
  if (typeof body !== 'object' || body === null) return null;
  const answers = (body as Record<string, unknown>).answers;
  if (typeof answers !== 'object' || answers === null) return null;
  const risk = (answers as Record<string, unknown>).risk;
  if (typeof risk !== 'object' || risk === null) return null;
  const { choice, confidence, probabilities } = risk as Record<string, unknown>;
  if (!isRiskOption(choice) || !isFraction(confidence)) return null;
  if (typeof probabilities !== 'object' || probabilities === null) return null;
  const given = probabilities as Record<string, unknown>;
  const parsed = {} as RiskProbabilities;
  for (const option of RISK_OPTIONS) {
    const value = given[option];
    if (!isFraction(value)) return null;
    parsed[option] = value;
  }
  return { choice, confidence, probabilities: parsed };
}
