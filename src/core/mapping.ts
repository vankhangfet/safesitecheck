import type { RiskAnswer, VerdictLabel } from '../shared/types';

/**
 * Starting thresholds (BR2.2). They are named here, in one place, and tuned after the quality
 * measurement. Probabilities and confidence are fractions between 0 and 1.
 */
export const DANGEROUS_RISK_THRESHOLD = 0.7;
export const SUSPICIOUS_RISK_THRESHOLD = 0.4;
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Guards the comparisons against sums such as 0.1 + 0.2 + 0.4 landing a hair under 0.7. */
const EPSILON = 1e-9;

export type MappedLabel = Exclude<VerdictLabel, 'could-not-check'>;

/**
 * Pure function: the same answer always gives the same label, with no use of the page, the
 * clock or settings (NFR1.1), so the quality measurement matches the extension.
 */
export function mapRiskToLabel(answer: RiskAnswer): MappedLabel {
  const { phishing, scam, malware } = answer.probabilities;
  const risk = phishing + scam + malware;
  const lowConfidence = answer.confidence < LOW_CONFIDENCE_THRESHOLD;
  if (risk + EPSILON >= DANGEROUS_RISK_THRESHOLD && !lowConfidence) return 'dangerous';
  if (
    risk + EPSILON >= SUSPICIOUS_RISK_THRESHOLD ||
    answer.choice === 'other_risk' ||
    lowConfidence
  ) {
    return 'suspicious';
  }
  return 'safe';
}
