import {
  FAILURE_KINDS,
  NO_SIGNALS,
  assertValidVerdict,
  isFailureKind,
  isSourceName,
  isVerdictLabel,
  isVisitState,
  parseSignals,
  type Verdict,
} from './types';

function verdictWith(overrides: Partial<Verdict>): Verdict {
  return {
    verdictId: 'verdict-1',
    visitId: 'visit-1',
    attemptId: 'attempt-1',
    strippedAddress: 'https://example.com/',
    label: 'safe',
    reasonShort: 'This looks like a normal website.',
    source: 'jev',
    checkedAt: 1,
    ...overrides,
  };
}

describe('closed lists', () => {
  it('accepts only the four verdict labels', () => {
    expect(['safe', 'suspicious', 'dangerous', 'could-not-check'].every(isVerdictLabel)).toBe(true);
    expect(isVerdictLabel('unknown')).toBe(false);
    expect(isVerdictLabel(undefined)).toBe(false);
  });

  it('includes the failure kinds added by the design', () => {
    for (const kind of [
      'missing-address',
      'unsupported-page',
      'permission-denied',
      'internal-error',
    ]) {
      expect(FAILURE_KINDS).toContain(kind);
      expect(isFailureKind(kind)).toBe(true);
    }
    expect(isFailureKind('boom')).toBe(false);
  });

  it('knows the sources and visit states', () => {
    expect(isSourceName('jev')).toBe(true);
    expect(isSourceName('openjev')).toBe(true);
    expect(isSourceName('other')).toBe(false);
    expect(isVisitState('timed-out')).toBe(true);
    expect(isVisitState('done')).toBe(false);
  });
});

describe('assertValidVerdict (BR2.1)', () => {
  it('requires a failure kind for Could not check', () => {
    expect(() => assertValidVerdict(verdictWith({ label: 'could-not-check' }))).toThrow(
      /failure kind/,
    );
    const ok = verdictWith({ label: 'could-not-check', failureKind: 'timeout' });
    expect(assertValidVerdict(ok)).toBe(ok);
  });

  it('refuses a failure kind on any other label', () => {
    expect(() =>
      assertValidVerdict(verdictWith({ label: 'safe', failureKind: 'timeout' })),
    ).toThrow(/only a Could not check/);
  });

  it('refuses an unknown label and an empty reason', () => {
    expect(() =>
      assertValidVerdict(verdictWith({ label: 'fine' as unknown as Verdict['label'] })),
    ).toThrow(/four allowed/);
    expect(() => assertValidVerdict(verdictWith({ reasonShort: '' }))).toThrow(/short reason/);
  });
});

describe('parseSignals (NFR2.7)', () => {
  it('keeps exactly the three booleans and drops anything else', () => {
    const parsed = parseSignals({
      asksForPassword: true,
      asksForPaymentCard: false,
      formSendsToOtherSite: true,
      pageText: 'secret',
    });
    expect(parsed).toEqual({
      asksForPassword: true,
      asksForPaymentCard: false,
      formSendsToOtherSite: true,
    });
  });

  it('rejects other shapes', () => {
    expect(parseSignals(null)).toBeNull();
    expect(parseSignals('yes')).toBeNull();
    expect(parseSignals({ asksForPassword: 'yes' })).toBeNull();
    expect(parseSignals({ asksForPassword: true, asksForPaymentCard: true })).toBeNull();
  });

  it('has an all-no default that cannot be changed', () => {
    expect(Object.isFrozen(NO_SIGNALS)).toBe(true);
    expect(Object.values(NO_SIGNALS)).toEqual([false, false, false]);
  });
});
