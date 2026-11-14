import {
  DANGEROUS_RISK_THRESHOLD,
  LOW_CONFIDENCE_THRESHOLD,
  SUSPICIOUS_RISK_THRESHOLD,
  mapRiskToLabel,
} from './mapping';
import { failureReason, optionReason, signalReasons } from './reasons';
import { FAILURE_KINDS, RISK_OPTIONS, type RiskAnswer } from '../shared/types';
import { signals } from '../test-support/fakes';

function answer(
  probabilities: Partial<RiskAnswer['probabilities']>,
  confidence = 0.9,
  choice: RiskAnswer['choice'] = 'safe',
): RiskAnswer {
  return {
    choice,
    confidence,
    probabilities: { safe: 0, phishing: 0, scam: 0, malware: 0, other_risk: 0, ...probabilities },
  };
}

describe('mapRiskToLabel (BR2.2, NFR1.1)', () => {
  it('names the starting thresholds', () => {
    expect(DANGEROUS_RISK_THRESHOLD).toBe(0.7);
    expect(SUSPICIOUS_RISK_THRESHOLD).toBe(0.4);
    expect(LOW_CONFIDENCE_THRESHOLD).toBe(0.6);
  });

  it('is Dangerous at and above 70% combined risk', () => {
    expect(mapRiskToLabel(answer({ phishing: 0.7 }, 0.9, 'phishing'))).toBe('dangerous');
    expect(mapRiskToLabel(answer({ phishing: 0.3, scam: 0.2, malware: 0.2 }))).toBe('dangerous');
    expect(mapRiskToLabel(answer({ scam: 0.95 }, 0.9, 'scam'))).toBe('dangerous');
  });

  it('is Suspicious just below 70% and at 40%', () => {
    expect(mapRiskToLabel(answer({ phishing: 0.69 }, 0.9, 'phishing'))).toBe('suspicious');
    expect(mapRiskToLabel(answer({ malware: 0.4 }, 0.9, 'malware'))).toBe('suspicious');
  });

  it('is Safe just below 40%', () => {
    expect(mapRiskToLabel(answer({ safe: 0.61, phishing: 0.39 }))).toBe('safe');
    expect(mapRiskToLabel(answer({ safe: 1 }))).toBe('safe');
  });

  it('is Suspicious when other risk is the chosen option, whatever the numbers', () => {
    expect(mapRiskToLabel(answer({ other_risk: 0.8, safe: 0.2 }, 0.9, 'other_risk'))).toBe(
      'suspicious',
    );
  });

  it('treats confidence below 0.6 as low: never Dangerous, at least Suspicious', () => {
    expect(mapRiskToLabel(answer({ phishing: 0.95 }, 0.59, 'phishing'))).toBe('suspicious');
    expect(mapRiskToLabel(answer({ safe: 0.95 }, 0.59))).toBe('suspicious');
    expect(mapRiskToLabel(answer({ phishing: 0.95 }, 0.6, 'phishing'))).toBe('dangerous');
  });

  it('gives the same label for the same answer every time (pure)', () => {
    const input = answer({ phishing: 0.5 }, 0.8, 'phishing');
    const labels = new Set(Array.from({ length: 5 }, () => mapRiskToLabel(input)));
    expect(labels).toEqual(new Set(['suspicious']));
  });

  it('does not let rounding in the sum push 0.7 below the line', () => {
    expect(mapRiskToLabel(answer({ phishing: 0.1, scam: 0.2, malware: 0.4 }, 0.9, 'malware'))).toBe(
      'dangerous',
    );
  });
});

describe('reasons (BR2.3, AC2.2.3)', () => {
  it('has a fixed sentence for every option', () => {
    for (const option of RISK_OPTIONS) {
      expect(optionReason(option, 'dangerous').length).toBeGreaterThan(10);
    }
    expect(optionReason('phishing', 'dangerous')).toBe(optionReason('phishing', 'dangerous'));
  });

  it('does not call a not-Safe verdict a normal website', () => {
    expect(optionReason('safe', 'safe')).toMatch(/normal website/);
    expect(optionReason('safe', 'suspicious')).toMatch(/not sure/);
  });

  it('has a plain sentence for every failure kind', () => {
    for (const kind of FAILURE_KINDS) expect(failureReason(kind).length).toBeGreaterThan(5);
    expect(failureReason('missing-key')).toMatch(/key is missing/i);
    expect(failureReason('timeout')).toMatch(/no answer came in time/i);
  });

  it('lists each signal that is yes, and nothing when none is', () => {
    expect(signalReasons(signals())).toBeUndefined();
    expect(signalReasons(signals({ asksForPassword: true }))).toBe('The page asks for a password.');
    const all = signalReasons(
      signals({ asksForPassword: true, asksForPaymentCard: true, formSendsToOtherSite: true }),
    );
    expect(all).toMatch(/password/);
    expect(all).toMatch(/payment card/);
    expect(all).toMatch(/another website/);
  });
});
