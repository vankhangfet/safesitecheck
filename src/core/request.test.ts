import { buildJevRequest, parseJevAnswer } from './request';
import { verdictFromAnswer, verdictFromFailure } from './verdict';
import { answerFor, jevBodyFor, signals } from '../test-support/fakes';
import type { CheckSubject, PageVisit } from '../shared/types';

const visit: PageVisit = {
  visitId: 'visit-1',
  tabId: 1,
  strippedAddress: 'https://example.com/login',
  checkable: true,
  signals: signals({ asksForPassword: true }),
  attemptId: 'attempt-1',
  state: 'checking',
  startedAt: 0,
};
const context = {
  visit,
  attemptId: 'attempt-1',
  verdictId: 'verdict-1',
  source: 'jev' as const,
  now: 42,
};

describe('buildJevRequest (BR7.3, BR7.6, NFR2.1)', () => {
  it('holds the model, the state and one Choice question named risk', () => {
    const body = buildJevRequest(
      { address: 'https://example.com/', signals: signals() },
      'jev-latest',
    );
    expect(Object.keys(body).sort()).toEqual(['model', 'questions', 'state']);
    expect(body.model).toBe('jev-latest');
    expect(Object.keys(body.questions)).toEqual(['risk']);
    expect(body.questions.risk.type).toBe('choice');
    expect(Object.keys(body.questions.risk.criteria)).toEqual([
      'safe',
      'phishing',
      'scam',
      'malware',
      'other_risk',
    ]);
  });

  it('puts only the address and the three signals in the state', () => {
    const body = buildJevRequest(
      { address: 'https://example.com/a', signals: signals({ asksForPaymentCard: true }) },
      'jev-latest',
    );
    expect(body.state.split('\n')).toEqual([
      'address: https://example.com/a',
      'asksForPassword: no',
      'asksForPaymentCard: yes',
      'formSendsToOtherSite: no',
    ]);
  });

  it('drops anything that is not one of the typed fields', () => {
    const sneaky = {
      address: 'https://example.com/',
      signals: { ...signals(), pageText: 'my bank password' },
      cookie: 'session=1',
    } as unknown as CheckSubject;
    const text = JSON.stringify(buildJevRequest(sneaky, 'jev-latest'));
    expect(text).not.toContain('my bank password');
    expect(text).not.toContain('session=1');
  });

  it('cuts a very long address', () => {
    const body = buildJevRequest(
      { address: `https://example.com/${'a'.repeat(9000)}`, signals: signals() },
      'jev-latest',
    );
    expect(body.state.length).toBeLessThan(2300);
  });
});

describe('parseJevAnswer (BR5.7, NFR2.7)', () => {
  it('reads a good answer into the closed shape', () => {
    const answer = answerFor('phishing');
    expect(parseJevAnswer(jevBodyFor(answer))).toEqual(answer);
  });

  it('ignores extra fields', () => {
    const body = jevBodyFor(answerFor('safe')) as Record<string, unknown>;
    expect(parseJevAnswer({ ...body, extra: { anything: true } })).toEqual(answerFor('safe'));
  });

  it.each([
    ['not an object', 'text'],
    ['no answers', {}],
    ['no risk', { answers: {} }],
    [
      'unknown choice',
      { answers: { risk: { choice: 'maybe', confidence: 0.5, probabilities: {} } } },
    ],
    [
      'missing probability',
      { answers: { risk: { choice: 'safe', confidence: 0.5, probabilities: { safe: 1 } } } },
    ],
  ])('rejects %s', (_name, body) => {
    expect(parseJevAnswer(body)).toBeNull();
  });

  it('rejects numbers outside 0 to 1 and values that are not numbers', () => {
    const outOfRange = jevBodyFor(answerFor('safe', { confidence: 7 }));
    expect(parseJevAnswer(outOfRange)).toBeNull();
    const text = jevBodyFor(answerFor('safe')) as { answers: { risk: { confidence: unknown } } };
    text.answers.risk.confidence = '0.9';
    expect(parseJevAnswer(text)).toBeNull();
  });
});

describe('verdict builders (BR2.1, BR2.3)', () => {
  it('builds one verdict with a fixed reason and the signals seen', () => {
    const verdict = verdictFromAnswer(answerFor('phishing'), context);
    expect(verdict).toMatchObject({
      visitId: 'visit-1',
      attemptId: 'attempt-1',
      strippedAddress: 'https://example.com/login',
      label: 'dangerous',
      source: 'jev',
      checkedAt: 42,
    });
    expect(verdict.reasonShort).toMatch(/steal logins/);
    expect(verdict.reasonMore).toBe('The page asks for a password.');
    expect(verdict.failureKind).toBeUndefined();
  });

  it('leaves out the longer part when no signal is yes', () => {
    const quiet = { ...context, visit: { ...visit, signals: signals() } };
    expect(verdictFromAnswer(answerFor('safe'), quiet).reasonMore).toBeUndefined();
  });

  it('builds Could not check with its failure kind and reason', () => {
    const verdict = verdictFromFailure('rate-limited', { ...context, source: 'none' });
    expect(verdict).toMatchObject({
      label: 'could-not-check',
      failureKind: 'rate-limited',
      source: 'none',
      reasonShort: 'The service is limiting requests.',
    });
  });
});
