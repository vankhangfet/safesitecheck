import { VerdictService } from './verdictService';
import { createVisitStore, type VisitStore } from './visitStore';
import {
  FAKE_KEY,
  answerFor,
  createMemoryStorage,
  signals,
  type MemoryStorage,
} from '../test-support/fakes';
import { createLogger, type LogSink } from '../shared/logger';
import type {
  AdapterResult,
  Connection,
  ConnectionResult,
  SourceAdapter,
  VisitSnapshot,
} from '../shared/contracts';
import { FAILURE_KINDS, type FailureKind } from '../shared/types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const goodConnection: ConnectionResult = {
  ok: true,
  connection: {
    source: 'jev',
    serverAddress: 'https://api.typesafe.ai',
    key: FAKE_KEY,
    modelName: 'jev-latest',
  },
};

interface Harness {
  service: VerdictService;
  snapshots: VisitSnapshot[];
  logs: string[];
  storage: MemoryStorage;
  store: VisitStore;
  check: jest.Mock<Promise<AdapterResult>, [unknown, Connection, number]>;
  connection: { current: ConnectionResult };
}

function harness(options: { adapters?: 'none' } = {}): Harness {
  let counter = 0;
  const logs: string[] = [];
  const sink: LogSink = { warn: (m) => logs.push(m), debug: (m) => logs.push(m) };
  const storage = createMemoryStorage();
  const store = createVisitStore(storage);
  const check = jest.fn<Promise<AdapterResult>, [unknown, Connection, number]>(async () => ({
    ok: true,
    answer: answerFor('safe'),
  }));
  const adapter: SourceAdapter = {
    check: check as unknown as SourceAdapter['check'],
    testConnection: async () => ({ ok: true }),
  };
  const connection = { current: goodConnection };
  const service = new VerdictService({
    store,
    connections: { getConnection: async () => connection.current },
    adapters: options.adapters === 'none' ? {} : { jev: adapter },
    logger: createLogger(sink, () => true),
    newId: () => `id-${++counter}`,
  });
  const snapshots: VisitSnapshot[] = [];
  service.subscribe((s) => snapshots.push(s));
  return { service, snapshots, logs, storage, store, check, connection };
}

const lastSnapshot = (h: Harness): VisitSnapshot => h.snapshots[h.snapshots.length - 1];

async function startVisit(
  h: Harness,
  options: { url?: string; tabId?: number; wait?: boolean } = {},
) {
  const { url = 'https://example.com/page?secret=1#x', tabId = 1, wait = true } = options;
  const visit = await h.service.beginVisit(tabId, url);
  const sending = h.service.submitSignals(tabId, visit.visitId, signals({ asksForPassword: true }));
  // A request that never answers keeps the call open until the timer ends the visit.
  if (wait) await sending;
  return visit;
}

describe('VerdictService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe('a fresh check (BR1.1, BR2.1, BR2.4, BR8.1)', () => {
    it('publishes checking first and then exactly one verdict', async () => {
      const h = harness();
      await startVisit(h);
      expect(h.snapshots.map((s) => s.state)).toEqual(['checking', 'checking', 'verdict']);
      expect(lastSnapshot(h)).toMatchObject({
        label: 'safe',
        address: 'https://example.com/page',
        reasonMore: 'The page asks for a password.',
      });
      expect(h.check).toHaveBeenCalledTimes(1);
    });

    it('sends only the stripped address and the three signals, and hands the key to one request', async () => {
      const h = harness();
      await startVisit(h);
      const [subject, connection, timeout] = h.check.mock.calls[0];
      expect(subject).toEqual({
        address: 'https://example.com/page',
        signals: signals({ asksForPassword: true }),
      });
      expect(connection.key).toBe(FAKE_KEY);
      expect(timeout).toBe(5000);
    });

    it('never puts the key or the address in an event, a saved record or a log (NFR2.2, NFR2.4)', async () => {
      const h = harness();
      await startVisit(h);
      const everything = JSON.stringify([h.snapshots.map((s) => ({ ...s, address: '' })), h.logs]);
      expect(everything).not.toContain(FAKE_KEY);
      expect(h.logs.join('\n')).not.toContain('example.com');
      expect(JSON.stringify([...h.storage.data.values()])).not.toContain(FAKE_KEY);
    });

    it('keeps the verdict for a screen that opens later (BR8.1)', async () => {
      const h = harness();
      const visit = await startVisit(h);
      expect(h.service.getSnapshot(1)).toMatchObject({ visitId: visit.visitId, state: 'verdict' });
      expect(h.service.getSnapshot(2)).toBeNull();
    });

    it('ignores signals sent twice, so one request is made', async () => {
      const h = harness();
      const visit = await startVisit(h);
      await h.service.submitSignals(1, visit.visitId, signals());
      await h.service.submitSignals(1, 'another-visit', signals());
      expect(h.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('pages that cannot be checked and missing details (BR5.3, BR5.4, BR6.8)', () => {
    it.each([
      'chrome://settings',
      'file:///C:/a.txt',
      'https://chromewebstore.google.com/detail/x',
    ])('sends nothing for %s', async (url) => {
      const h = harness();
      await h.service.beginVisit(1, url);
      expect(h.check).not.toHaveBeenCalled();
      expect(lastSnapshot(h)).toMatchObject({
        label: 'could-not-check',
        failureKind: 'unsupported-page',
        state: 'verdict',
      });
    });

    it.each<[ConnectionResult, FailureKind]>([
      [{ ok: false, kind: 'missing-key' }, 'missing-key'],
      [{ ok: false, kind: 'missing-address' }, 'missing-address'],
      [{ ok: false, kind: 'permission-denied' }, 'permission-denied'],
    ])('makes no request when the connection is %j', async (connection, kind) => {
      const h = harness();
      h.connection.current = connection;
      await startVisit(h);
      expect(h.check).not.toHaveBeenCalled();
      expect(lastSnapshot(h)).toMatchObject({ label: 'could-not-check', failureKind: kind });
    });

    it('ends as internal-error when no adapter exists for the source', async () => {
      const h = harness({ adapters: 'none' });
      await startVisit(h);
      expect(lastSnapshot(h)).toMatchObject({ failureKind: 'internal-error' });
    });
  });

  describe('every failure kind from the adapter ends as Could not check (NFR6.2)', () => {
    it.each(FAILURE_KINDS.filter((k) => k !== 'timeout'))('%s', async (kind) => {
      const h = harness();
      h.check.mockResolvedValueOnce({ ok: false, kind });
      await startVisit(h);
      expect(lastSnapshot(h)).toMatchObject({ label: 'could-not-check', failureKind: kind });
      expect(h.service.getSnapshot(1)?.state).toBe('verdict');
    });

    it('turns an unexpected error into internal-error and does not throw (NFR6.1)', async () => {
      const h = harness();
      h.check.mockRejectedValueOnce(new Error('boom with https://secret.example/?k=1'));
      await expect(startVisit(h)).resolves.toBeDefined();
      expect(lastSnapshot(h)).toMatchObject({ failureKind: 'internal-error' });
      expect(h.logs.join('\n')).not.toContain('secret.example');
    });
  });

  describe('the 5-second limit counted from the visit start (BR5.1, BR5.2, NFR3.1)', () => {
    it('ends as timed-out at 5 seconds, not 5 seconds after the request', async () => {
      const h = harness();
      h.check.mockReturnValueOnce(new Promise(() => undefined));
      const visit = await h.service.beginVisit(1, 'https://example.com/');
      await jest.advanceTimersByTimeAsync(1000);
      void h.service.submitSignals(1, visit.visitId, signals());
      await jest.advanceTimersByTimeAsync(3999);
      expect(lastSnapshot(h).state).toBe('checking');
      await jest.advanceTimersByTimeAsync(1);
      expect(lastSnapshot(h)).toMatchObject({ label: 'could-not-check', failureKind: 'timeout' });
    });

    it('passes the adapter only the time that remains', async () => {
      const h = harness();
      const visit = await h.service.beginVisit(1, 'https://example.com/');
      await jest.advanceTimersByTimeAsync(1000);
      await h.service.submitSignals(1, visit.visitId, signals());
      expect(h.check.mock.calls[0][2]).toBe(4000);
    });

    it('shows an answer that arrives in time', async () => {
      const h = harness();
      const pending = deferred<AdapterResult>();
      h.check.mockReturnValueOnce(pending.promise);
      const visit = await h.service.beginVisit(1, 'https://example.com/');
      const sent = h.service.submitSignals(1, visit.visitId, signals());
      await jest.advanceTimersByTimeAsync(4900);
      pending.resolve({ ok: true, answer: answerFor('phishing') });
      await sent;
      expect(lastSnapshot(h)).toMatchObject({ label: 'dangerous' });
    });

    it('ignores a late answer after the timeout (BR5.2, AC4.1.3)', async () => {
      const h = harness();
      const pending = deferred<AdapterResult>();
      h.check.mockReturnValueOnce(pending.promise);
      const visit = await h.service.beginVisit(1, 'https://example.com/');
      const sent = h.service.submitSignals(1, visit.visitId, signals());
      await jest.advanceTimersByTimeAsync(5000);
      const shown = h.snapshots.length;
      pending.resolve({ ok: true, answer: answerFor('safe') });
      await sent;
      expect(h.snapshots).toHaveLength(shown);
      expect(h.service.getSnapshot(1)).toMatchObject({ failureKind: 'timeout' });
    });

    it('treats a timeout reported by the adapter as timed-out too', async () => {
      const h = harness();
      h.check.mockResolvedValueOnce({ ok: false, kind: 'timeout' });
      await startVisit(h);
      expect(lastSnapshot(h)).toMatchObject({ label: 'could-not-check', failureKind: 'timeout' });
      // The visit's own timer was cancelled: nothing more is published at 5 seconds.
      const shown = h.snapshots.length;
      await jest.advanceTimersByTimeAsync(6000);
      expect(h.snapshots).toHaveLength(shown);
      await h.service.recheck(1, h.service.currentVisitId(1) as string);
      expect(h.check).toHaveBeenCalledTimes(2);
    });
  });

  describe('visits and attempts (BR3.1 to BR3.3, BR1.5)', () => {
    it('discards the answer for a visit that ended because the address changed (AC1.3.2)', async () => {
      const h = harness();
      const first = deferred<AdapterResult>();
      h.check.mockReturnValueOnce(first.promise);
      const visit = await h.service.beginVisit(1, 'https://old.example.com/');
      const sending = h.service.submitSignals(1, visit.visitId, signals());
      await h.service.beginVisit(1, 'https://new.example.com/');
      first.resolve({ ok: true, answer: answerFor('phishing') });
      await sending;
      expect(h.snapshots.filter((s) => s.label === 'dangerous')).toHaveLength(0);
      expect(h.service.getSnapshot(1)).toMatchObject({
        address: 'https://new.example.com/',
        state: 'checking',
      });
    });

    it('does not show a late result from one tab on another (AC1.3.1)', async () => {
      const h = harness();
      const slow = deferred<AdapterResult>();
      h.check.mockReturnValueOnce(slow.promise);
      const one = await h.service.beginVisit(1, 'https://one.example.com/');
      const sending = h.service.submitSignals(1, one.visitId, signals());
      await startVisit(h, { url: 'https://two.example.com/', tabId: 2 });
      slow.resolve({ ok: true, answer: answerFor('phishing') });
      await sending;
      expect(h.service.getSnapshot(2)).toMatchObject({ label: 'safe' });
      expect(h.service.getSnapshot(1)).toMatchObject({ label: 'dangerous' });
    });

    it('discards the answer after the tab is closed', async () => {
      const h = harness();
      const slow = deferred<AdapterResult>();
      h.check.mockReturnValueOnce(slow.promise);
      const visit = await h.service.beginVisit(1, 'https://example.com/');
      const sending = h.service.submitSignals(1, visit.visitId, signals());
      await h.service.forgetTab(1);
      slow.resolve({ ok: true, answer: answerFor('phishing') });
      await sending;
      expect(h.service.getSnapshot(1)).toBeNull();
      expect(await h.store.load(1)).toBeNull();
    });

    it('shows only the answer to the latest attempt after Check again while waiting (BR3.3)', async () => {
      const h = harness();
      const first = deferred<AdapterResult>();
      h.check.mockReturnValueOnce(first.promise);
      const visit = await h.service.beginVisit(1, 'https://example.com/');
      const firstRun = h.service.submitSignals(1, visit.visitId, signals());
      await jest.advanceTimersByTimeAsync(10);
      h.check.mockResolvedValueOnce({ ok: true, answer: answerFor('scam') });
      await h.service.recheck(1, visit.visitId);
      first.resolve({ ok: true, answer: answerFor('safe') });
      await firstRun;
      expect(h.check).toHaveBeenCalledTimes(2);
      expect(h.service.getSnapshot(1)).toMatchObject({ label: 'dangerous' });
      expect(h.snapshots.filter((s) => s.label === 'safe')).toHaveLength(0);
    });
  });

  describe('Check again (W2, BR4.5, AC2.2.2)', () => {
    it('starts a fresh check from a shown verdict', async () => {
      const h = harness();
      const visit = await startVisit(h);
      h.check.mockResolvedValueOnce({ ok: true, answer: answerFor('malware') });
      await h.service.recheck(1, visit.visitId);
      expect(h.check).toHaveBeenCalledTimes(2);
      expect(h.snapshots.some((s, i) => i > 2 && s.state === 'checking')).toBe(true);
      expect(lastSnapshot(h)).toMatchObject({ label: 'dangerous' });
    });

    it('starts a fresh 5-second period after a timeout', async () => {
      const h = harness();
      h.check.mockReturnValueOnce(new Promise(() => undefined));
      const visit = await startVisit(h, { wait: false });
      await jest.advanceTimersByTimeAsync(5000);
      expect(h.service.getSnapshot(1)).toMatchObject({ failureKind: 'timeout' });
      await h.service.recheck(1, visit.visitId);
      expect(h.check.mock.calls[1][2]).toBe(5000);
      expect(lastSnapshot(h)).toMatchObject({ label: 'safe' });
    });

    it('ignores a request for another visit', async () => {
      const h = harness();
      await startVisit(h);
      await h.service.recheck(1, 'not-the-visit');
      await h.service.recheck(9, 'whatever');
      expect(h.check).toHaveBeenCalledTimes(1);
    });

    it('shows the unsupported-page verdict again without sending anything', async () => {
      const h = harness();
      const visit = await h.service.beginVisit(1, 'edge://settings');
      await h.service.recheck(1, visit.visitId);
      expect(h.check).not.toHaveBeenCalled();
      expect(lastSnapshot(h)).toMatchObject({ failureKind: 'unsupported-page' });
    });
  });

  describe('restart of the background process (BR8.2, NFR6.3)', () => {
    it('restores an answered visit without a new request', async () => {
      const first = harness();
      await startVisit(first);
      const second = harness();
      second.storage.data.set('tab:1', first.storage.data.get('tab:1'));
      expect(await second.service.restore(1, 'https://example.com/page?other=2')).toBe(true);
      expect(lastSnapshot(second)).toMatchObject({ label: 'safe', state: 'verdict' });
      expect(second.check).not.toHaveBeenCalled();
    });

    it('gives a waiting visit a new attempt with its timer counted from the saved start', async () => {
      const first = harness();
      first.check.mockReturnValueOnce(new Promise(() => undefined));
      await startVisit(first, { wait: false });
      await jest.advanceTimersByTimeAsync(2000);
      const second = harness();
      second.storage.data.set('tab:1', first.storage.data.get('tab:1'));
      expect(await second.service.restore(1, 'https://example.com/page')).toBe(true);
      expect(second.check).toHaveBeenCalledTimes(1);
      expect(second.check.mock.calls[0][2]).toBe(3000);
    });

    it('ends a visit that already ran past 5 seconds as timed-out at once', async () => {
      const first = harness();
      first.check.mockReturnValueOnce(new Promise(() => undefined));
      await startVisit(first, { wait: false });
      await jest.advanceTimersByTimeAsync(10);
      const saved = first.storage.data.get('tab:1');
      await first.service.forgetTab(1);
      await jest.advanceTimersByTimeAsync(6000);
      const second = harness();
      second.storage.data.set('tab:1', saved);
      expect(await second.service.restore(1, 'https://example.com/page')).toBe(true);
      expect(second.check).not.toHaveBeenCalled();
      expect(lastSnapshot(second)).toMatchObject({ failureKind: 'timeout' });
    });

    it('reports false when nothing usable is saved, or the page has changed', async () => {
      const first = harness();
      await startVisit(first);
      const second = harness();
      expect(await second.service.restore(1, 'https://example.com/page')).toBe(false);
      second.storage.data.set('tab:1', first.storage.data.get('tab:1'));
      expect(await second.service.restore(1, 'https://different.example.com/')).toBe(false);
      second.storage.failNext();
      expect(await second.service.restore(1, 'https://example.com/page')).toBe(false);
    });

    it('treats an answered record without its verdict as unusable', async () => {
      const h = harness();
      await startVisit(h);
      await h.store.save({ visit: { ...(await h.store.load(1))!.visit, state: 'answered' } });
      const second = harness();
      second.storage.data.set('tab:1', h.storage.data.get('tab:1'));
      expect(await second.service.restore(1, 'https://example.com/page')).toBe(false);
    });
  });

  it('keeps working when saving the tab state fails (BR8.2 degrades to a new visit)', async () => {
    const h = harness();
    h.storage.failWrites();
    await startVisit(h);
    expect(lastSnapshot(h)).toMatchObject({ label: 'safe' });
    expect(h.logs.some((line) => line.includes('internal-error'))).toBe(true);
  });

  it('keeps going when a listener throws', async () => {
    const h = harness();
    h.service.subscribe(() => {
      throw new Error('listener failed');
    });
    await startVisit(h);
    expect(lastSnapshot(h)).toMatchObject({ label: 'safe' });
  });
});
