import { createJevAdapter, type FetchFunction } from './jevAdapter';
import { FAKE_KEY, answerFor, fakeResponse, jevBodyFor, signals } from '../test-support/fakes';
import type { Connection } from '../shared/contracts';

const connection: Connection = {
  source: 'jev',
  serverAddress: 'https://api.typesafe.ai',
  key: FAKE_KEY,
  modelName: 'jev-latest',
};
const subject = {
  address: 'https://example.com/login',
  signals: signals({ asksForPassword: true }),
};

function adapterWith(fetchFn: jest.Mock<ReturnType<FetchFunction>, Parameters<FetchFunction>>) {
  return createJevAdapter({ fetchFn });
}

function fetchReturning(status: number, body?: unknown) {
  return jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>(async () =>
    fakeResponse(status, body),
  );
}

describe('JevAdapter request (BR7.1, BR7.3, C7)', () => {
  it('sends one POST with the bearer key to the saved address only', async () => {
    const fetchFn = fetchReturning(200, jevBodyFor(answerFor('phishing')));
    const result = await adapterWith(fetchFn).check(subject, connection, 5000);
    expect(result).toEqual({ ok: true, answer: answerFor('phishing') });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.typesafe.ai/v1/systemone');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: `Bearer ${FAKE_KEY}`,
      'Content-Type': 'application/json',
    });
  });

  it('puts only the address and the three signals in the body', async () => {
    const fetchFn = fetchReturning(200, jevBodyFor(answerFor('safe')));
    await adapterWith(fetchFn).check(subject, connection, 5000);
    const body = JSON.parse(fetchFn.mock.calls[0][1].body as string);
    expect(body.model).toBe('jev-latest');
    expect(body.state).toBe(
      'address: https://example.com/login\nasksForPassword: yes\nasksForPaymentCard: no\nformSendsToOtherSite: no',
    );
    expect(Object.keys(body.questions)).toEqual(['risk']);
    expect(JSON.stringify(body)).not.toContain(FAKE_KEY);
  });

  it('does not follow redirects, so the key cannot be carried to another server', async () => {
    const fetchFn = fetchReturning(200, jevBodyFor(answerFor('safe')));
    await adapterWith(fetchFn).check(subject, connection, 5000);
    expect(fetchFn.mock.calls[0][1]).toMatchObject({
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
    });
  });

  it('keeps a path on the saved address', async () => {
    const fetchFn = fetchReturning(200, jevBodyFor(answerFor('safe')));
    await adapterWith(fetchFn).check(
      subject,
      { ...connection, serverAddress: 'https://proxy.example.org/jev/' },
      5000,
    );
    expect(fetchFn.mock.calls[0][0]).toBe('https://proxy.example.org/jev/v1/systemone');
  });

  it('never sends the key over http or without an address, and sends nothing without a key', async () => {
    const fetchFn = fetchReturning(200);
    const adapter = adapterWith(fetchFn);
    expect(
      await adapter.check(
        subject,
        { ...connection, serverAddress: 'http://api.example.com' },
        5000,
      ),
    ).toEqual({
      ok: false,
      kind: 'unsupported-request',
    });
    expect(
      await adapter.check(subject, { ...connection, serverAddress: 'nonsense' }, 5000),
    ).toEqual({
      ok: false,
      kind: 'missing-address',
    });
    expect(await adapter.check(subject, { ...connection, key: undefined }, 5000)).toEqual({
      ok: false,
      kind: 'missing-key',
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('JevAdapter failures (BR5.5 to BR5.9, NFR6.2, NFR6.5)', () => {
  it.each([
    [401, 'rejected-key'],
    [429, 'rate-limited'],
    [529, 'overloaded'],
    [400, 'unsupported-request'],
    [413, 'unsupported-request'],
    [415, 'unsupported-request'],
    [422, 'unsupported-request'],
    [500, 'unreadable-answer'],
    [302, 'unreadable-answer'],
  ])('maps status %i to %s', async (status, kind) => {
    const result = await adapterWith(fetchReturning(status, {})).check(subject, connection, 5000);
    expect(result).toEqual({ ok: false, kind });
  });

  it('does not retry after 429 or 529', async () => {
    for (const status of [429, 529]) {
      const fetchFn = fetchReturning(status);
      await adapterWith(fetchFn).check(subject, connection, 5000);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    }
  });

  it('reports no connection when the request cannot be made', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await adapterWith(fetchFn).check(subject, connection, 5000)).toEqual({
      ok: false,
      kind: 'no-connection',
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('reports an unreadable answer for a body that is not JSON or not the expected shape', async () => {
    const notJson = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>(async () =>
      fakeResponse(200, undefined, true),
    );
    expect(await adapterWith(notJson).check(subject, connection, 5000)).toEqual({
      ok: false,
      kind: 'unreadable-answer',
    });
    expect(
      await adapterWith(fetchReturning(200, { answers: {} })).check(subject, connection, 5000),
    ).toEqual({
      ok: false,
      kind: 'unreadable-answer',
    });
  });

  it('gives up with a timeout when no answer comes in the time it was given', async () => {
    jest.useFakeTimers();
    try {
      const hanging = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            );
          }),
      );
      const pending = adapterWith(hanging).check(subject, connection, 4000);
      await jest.advanceTimersByTimeAsync(3999);
      let settled = false;
      void pending.then(() => {
        settled = true;
      });
      await Promise.resolve();
      expect(settled).toBe(false);
      await jest.advanceTimersByTimeAsync(1);
      expect(await pending).toEqual({ ok: false, kind: 'timeout' });
      expect(hanging).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('never returns the key in a result', async () => {
    const results = [
      await adapterWith(fetchReturning(401)).check(subject, connection, 5000),
      await adapterWith(fetchReturning(200, jevBodyFor(answerFor('safe')))).check(
        subject,
        connection,
        5000,
      ),
    ];
    expect(JSON.stringify(results)).not.toContain(FAKE_KEY);
  });
});

describe('JevAdapter testConnection (BR6.5)', () => {
  it('reports success when the service answers', async () => {
    const fetchFn = fetchReturning(200, jevBodyFor(answerFor('safe')));
    expect(await adapterWith(fetchFn).testConnection(connection)).toEqual({ ok: true });
    const body = JSON.parse(fetchFn.mock.calls[0][1].body as string);
    expect(body.state).toContain('address: https://example.com/');
  });

  it('reports the reason when it fails', async () => {
    expect(await adapterWith(fetchReturning(401)).testConnection(connection)).toEqual({
      ok: false,
      kind: 'rejected-key',
    });
  });
});
