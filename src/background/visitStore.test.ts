import { createVisitStore, type StoredTabState } from './visitStore';
import { createMemoryStorage } from '../test-support/fakes';
import type { PageVisit, Verdict } from '../shared/types';

function visit(overrides: Partial<PageVisit> = {}): PageVisit {
  return {
    visitId: 'visit-1',
    tabId: 7,
    strippedAddress: 'https://example.com/page',
    checkable: true,
    attemptId: 'attempt-1',
    state: 'checking',
    startedAt: 1000,
    ...overrides,
  };
}

const verdict: Verdict = {
  verdictId: 'verdict-1',
  visitId: 'visit-1',
  attemptId: 'attempt-1',
  strippedAddress: 'https://example.com/page',
  label: 'could-not-check',
  reasonShort: 'No answer came in time.',
  failureKind: 'timeout',
  source: 'jev',
  checkedAt: 6000,
};

describe('visit store (BR8.2, NFR6.3)', () => {
  it('saves and restores a visit with its signals', async () => {
    const store = createVisitStore(createMemoryStorage());
    const state: StoredTabState = {
      visit: visit({
        signals: { asksForPassword: true, asksForPaymentCard: false, formSendsToOtherSite: false },
      }),
    };
    await store.save(state);
    expect(await store.load(7)).toEqual(state);
  });

  it('saves and restores a verdict with its failure kind', async () => {
    const store = createVisitStore(createMemoryStorage());
    await store.save({ visit: visit({ state: 'timed-out' }), verdict });
    expect(await store.load(7)).toEqual({ visit: visit({ state: 'timed-out' }), verdict });
  });

  it('gives null for a tab with nothing saved, so it becomes a new visit', async () => {
    const store = createVisitStore(createMemoryStorage());
    expect(await store.load(99)).toBeNull();
  });

  it('treats a damaged record as missing', async () => {
    const storage = createMemoryStorage({
      'tab:1': { visit: { visitId: 5 } },
      'tab:2': 'text',
      'tab:3': { visit: visit({ tabId: 3, state: 'nonsense' as PageVisit['state'] }) },
      'tab:4': { visit: { ...visit({ tabId: 4 }), signals: { asksForPassword: 'yes' } } },
    });
    const store = createVisitStore(storage);
    for (const tabId of [1, 2, 3, 4]) expect(await store.load(tabId)).toBeNull();
  });

  it('refuses a record saved for another tab', async () => {
    const storage = createMemoryStorage({ 'tab:8': { visit: visit({ tabId: 7 }) } });
    expect(await createVisitStore(storage).load(8)).toBeNull();
  });

  it('keeps the visit when only the saved verdict is damaged', async () => {
    const storage = createMemoryStorage({
      'tab:7': { visit: visit(), verdict: { label: 'safe' } },
    });
    expect(await createVisitStore(storage).load(7)).toEqual({ visit: visit() });
  });

  it('removes a tab', async () => {
    const store = createVisitStore(createMemoryStorage());
    await store.save({ visit: visit() });
    await store.remove(7);
    expect(await store.load(7)).toBeNull();
  });
});
