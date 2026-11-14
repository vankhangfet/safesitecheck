import { registerBackground, isTrustedSender } from './wiring';
import {
  EXTENSION_BASE,
  EXTENSION_ID,
  badgeFor,
  contentSender,
  createFakeBackground,
  popupSender,
  settle,
  titleFor,
} from '../test-support/fakeEnv';
import { FAKE_KEY, answerFor, fakeResponse, jevBodyFor } from '../test-support/fakes';

const PAGE = 'https://example.com/page?token=abc#top';

async function openPage(fake: ReturnType<typeof createFakeBackground>, tabId = 1, url = PAGE) {
  fake.onTabUpdated.emit(tabId, { status: 'loading', url }, { id: tabId, url });
  await settle();
  await settle();
}

describe('background wiring: a page opens (BR1.1, W1)', () => {
  it('checks the page, sends the stripped address with the bearer key once, and shows the verdict', async () => {
    const fake = createFakeBackground();
    const handle = registerBackground(fake.env);
    await handle.ready;
    await openPage(fake);

    expect(fake.fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fake.fetchFn.mock.calls[0];
    expect(url).toBe('https://api.typesafe.ai/v1/systemone');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${FAKE_KEY}`);
    expect(JSON.parse(init.body as string).state).toContain('address: https://example.com/page\n');
    expect(init.body).not.toContain('token=abc');
    expect(badgeFor(fake, 1)).toBe('OK');
    expect(titleFor(fake, 1)).toBe('Phishing Guard: Safe');
  });

  it('shows the checking state first (AC2.1.4)', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    let release: (value: Response) => void = () => undefined;
    fake.fetchFn.mockReturnValueOnce(new Promise<Response>((resolve) => (release = resolve)));
    await openPage(fake);
    expect(badgeFor(fake, 1)).toBe('...');
    expect(titleFor(fake, 1)).toBe('Phishing Guard: Checking');
    release(fakeResponse(200, jevBodyFor(answerFor('phishing'))));
    await settle();
    expect(badgeFor(fake, 1)).toBe('!');
  });

  it('shows Could not check with the key-missing reason when no key is saved (AC4.3.1)', async () => {
    const fake = createFakeBackground({ withKey: false });
    await registerBackground(fake.env).ready;
    await openPage(fake);
    expect(fake.fetchFn).not.toHaveBeenCalled();
    expect(titleFor(fake, 1)).toBe(
      'Phishing Guard: Could not check, A key is missing. Add it in Settings.',
    );
  });

  it('sends nothing for pages that cannot be checked (AC4.2.1)', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake, 1, 'edge://settings/');
    expect(fake.fetchFn).not.toHaveBeenCalled();
    expect(badgeFor(fake, 1)).toBe('-');
    expect(titleFor(fake, 1)).toContain('This page cannot be checked.');
  });

  it('checks a reload of the same page again (BR1.1)', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake);
    fake.onTabUpdated.emit(1, { status: 'loading' }, { id: 1, url: PAGE });
    await settle();
    await settle();
    expect(fake.fetchFn).toHaveBeenCalledTimes(2);
  });

  it('starts a new visit when only the address changes in the page (BR1.5)', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake, 1, 'https://example.com/a');
    fake.onTabUpdated.emit(
      1,
      { url: 'https://example.com/b#x' },
      { id: 1, url: 'https://example.com/b#x' },
    );
    await settle();
    await settle();
    expect(fake.fetchFn).toHaveBeenCalledTimes(2);
    // A change of query or fragment alone does not change the stripped address.
    fake.onTabUpdated.emit(
      1,
      { url: 'https://example.com/b?x=2' },
      { id: 1, url: 'https://example.com/b?x=2' },
    );
    await settle();
    expect(fake.fetchFn).toHaveBeenCalledTimes(2);
  });

  it('ignores tab events without an address or other changes', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    fake.onTabUpdated.emit(1, { status: 'complete' }, { id: 1 });
    fake.onTabUpdated.emit(1, { status: 'complete' }, { id: 1, url: PAGE });
    await settle();
    expect(fake.fetchFn).not.toHaveBeenCalled();
  });

  it('forgets a tab that is closed', async () => {
    const fake = createFakeBackground();
    const handle = registerBackground(fake.env);
    await handle.ready;
    await openPage(fake);
    fake.onTabRemoved.emit(1);
    await settle();
    expect(handle.service.getSnapshot(1)).toBeNull();
    expect(fake.storageSession.data.has('tab:1')).toBe(false);
  });
});

describe('background wiring: messages (security design trust boundaries)', () => {
  it('answers the popup with the current state and pushes updates to it', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake);
    const reply = await fake.send({ type: 'verdict/get', tabId: 1 }, popupSender);
    expect(reply.response).toMatchObject({
      state: 'verdict',
      label: 'safe',
      address: 'https://example.com/page',
    });
    expect(
      fake.runtimeMessages.some((m) => (m as { type: string }).type === 'verdict/updated'),
    ).toBe(true);
  });

  it('starts a new attempt when the popup asks for Check again', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake);
    const snapshot = (await fake.send({ type: 'verdict/get', tabId: 1 }, popupSender)).response as {
      visitId: string;
    };
    const reply = await fake.send(
      { type: 'verdict/recheck', tabId: 1, visitId: snapshot.visitId },
      popupSender,
    );
    expect(reply.response).toEqual({ ok: true });
    await settle();
    await settle();
    expect(fake.fetchFn).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      'another extension',
      { id: 'other-extension', url: `${EXTENSION_BASE}popup.html` },
      { type: 'verdict/get', tabId: 1 },
    ],
    ['a web page asking for a verdict', contentSender(1), { type: 'verdict/get', tabId: 1 }],
    [
      'a web page asking for a recheck',
      contentSender(1),
      { type: 'verdict/recheck', tabId: 1, visitId: 'v' },
    ],
    ['a frame of a page', contentSender(1, 3), { type: 'content/ready' }],
    ['an extension page saying it is the collector', popupSender, { type: 'content/ready' }],
    [
      'a sender with no id',
      { url: `${EXTENSION_BASE}popup.html` },
      { type: 'verdict/get', tabId: 1 },
    ],
  ])('ignores a message from %s', async (_name, sender, message) => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake);
    const before = fake.fetchFn.mock.calls.length;
    const reply = await fake.send(message, sender);
    expect(reply.handled).toBe(false);
    expect(fake.fetchFn.mock.calls.length).toBe(before);
  });

  it('ignores messages that are not one of the three it knows', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    for (const message of ['hello', null, { type: 'settings/read' }, { type: 'verdict/get' }]) {
      expect((await fake.send(message, popupSender)).handled).toBe(false);
    }
  });

  it('decides trust from the sender id, page and frame', () => {
    const env = { extensionId: EXTENSION_ID, extensionBaseUrl: EXTENSION_BASE };
    expect(isTrustedSender({ type: 'content/ready' }, contentSender(5), env)).toBe(true);
    expect(isTrustedSender({ type: 'content/ready' }, { ...contentSender(5), tab: {} }, env)).toBe(
      false,
    );
    expect(isTrustedSender({ type: 'verdict/get', tabId: 1 }, popupSender, env)).toBe(true);
  });
});

describe('background wiring: signals from the page (BR7.5)', () => {
  it('waits for the page-side collector to start, then asks it', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    fake.sendTabMessage.mockRejectedValueOnce(new Error('Receiving end does not exist.'));
    fake.sendTabMessage.mockImplementationOnce(async (_id, message) => ({
      visitId: (message as { visitId: string }).visitId,
      signals: { asksForPassword: true, asksForPaymentCard: false, formSendsToOtherSite: false },
    }));
    fake.onTabUpdated.emit(1, { status: 'loading', url: PAGE }, { id: 1, url: PAGE });
    await settle();
    expect(fake.fetchFn).not.toHaveBeenCalled();
    await fake.send({ type: 'content/ready' }, contentSender(1));
    await settle();
    await settle();
    expect(fake.fetchFn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fake.fetchFn.mock.calls[0][1].body as string).state).toContain(
      'asksForPassword: yes',
    );
  });

  it('counts all three signals as no after 1 second and still checks', async () => {
    jest.useFakeTimers();
    try {
      const fake = createFakeBackground();
      await registerBackground(fake.env).ready;
      fake.sendTabMessage.mockRejectedValue(new Error('no collector in this page'));
      fake.onTabUpdated.emit(1, { status: 'loading', url: PAGE }, { id: 1, url: PAGE });
      await jest.advanceTimersByTimeAsync(999);
      expect(fake.fetchFn).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await jest.advanceTimersByTimeAsync(0);
      expect(fake.fetchFn).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fake.fetchFn.mock.calls[0][1].body as string).state).toContain(
        'asksForPassword: no',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('ignores a report that belongs to another visit', async () => {
    jest.useFakeTimers();
    try {
      const fake = createFakeBackground();
      await registerBackground(fake.env).ready;
      fake.sendTabMessage.mockResolvedValue({
        visitId: 'some-older-visit',
        signals: { asksForPassword: true, asksForPaymentCard: true, formSendsToOtherSite: true },
      });
      fake.onTabUpdated.emit(1, { status: 'loading', url: PAGE }, { id: 1, url: PAGE });
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(0);
      expect(JSON.parse(fake.fetchFn.mock.calls[0][1].body as string).state).toContain(
        'asksForPassword: no',
      );
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('background wiring: restart of the background process (BR8.2)', () => {
  it('restores the saved verdict for an open tab without a new request', async () => {
    const first = createFakeBackground();
    await registerBackground(first.env).ready;
    await openPage(first);
    const second = createFakeBackground({ storageSession: first.storageSession });
    second.tabs.push({ id: 1, url: PAGE, status: 'complete' });
    const handle = registerBackground(second.env);
    await handle.ready;
    expect(second.fetchFn).not.toHaveBeenCalled();
    expect(badgeFor(second, 1)).toBe('OK');
    expect(handle.service.getSnapshot(1)).toMatchObject({ label: 'safe' });
  });

  it('treats an open tab with nothing saved as a new visit and checks it', async () => {
    const fake = createFakeBackground();
    fake.tabs.push({ id: 4, url: 'https://example.org/', status: 'complete' });
    await registerBackground(fake.env).ready;
    expect(fake.fetchFn).toHaveBeenCalledTimes(1);
    expect(badgeFor(fake, 4)).toBe('OK');
  });

  it('leaves a loading tab to its own update event, and skips tabs without an address', async () => {
    const fake = createFakeBackground();
    fake.tabs.push(
      { id: 5, url: 'https://example.org/', status: 'loading' },
      { id: 6 },
      { url: 'https://x.test/' },
    );
    await registerBackground(fake.env).ready;
    expect(fake.fetchFn).not.toHaveBeenCalled();
  });

  it('keeps working when the tab list cannot be read (NFR6.1)', async () => {
    const fake = createFakeBackground();
    fake.env.queryTabs = async () => {
      throw new Error('tabs unavailable');
    };
    await registerBackground(fake.env).ready;
    expect(fake.logs.join('\n')).toContain('internal-error');
    await openPage(fake);
    expect(badgeFor(fake, 1)).toBe('OK');
  });
});

describe('background wiring: the key (NFR2.2, NFR2.4)', () => {
  it('appears only in the one request, never in a message, a saved tab record or a log', async () => {
    const fake = createFakeBackground();
    await registerBackground(fake.env).ready;
    await openPage(fake);
    const others = JSON.stringify([
      fake.runtimeMessages,
      fake.actionCalls,
      [...fake.storageSession.data.values()],
      fake.logs,
    ]);
    expect(others).not.toContain(FAKE_KEY);
    expect(JSON.stringify(fake.fetchFn.mock.calls)).toContain(FAKE_KEY);
    expect(fake.logs.join('\n')).not.toContain('example.com');
  });
});
