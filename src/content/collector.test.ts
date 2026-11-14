/** @jest-environment jsdom */
import { initContent, type ContentEnv } from './collector';

type Listener = Parameters<ContentEnv['onMessage']['addListener']>[0];

function setup(html = '<input type="password">') {
  document.body.innerHTML = html;
  const listeners: Listener[] = [];
  const sent: unknown[] = [];
  const env: ContentEnv = {
    extensionId: 'ext-id',
    onMessage: { addListener: (l) => listeners.push(l) },
    sendMessage: async (message) => {
      sent.push(message);
      return undefined;
    },
  };
  initContent(env, document, 'example.com');
  const ask = (message: unknown, senderId = 'ext-id') =>
    new Promise<{ handled: boolean; response?: unknown }>((resolve) => {
      const handled = listeners[0](message, { id: senderId }, (response) =>
        resolve({ handled: true, response }),
      );
      if (handled !== true) resolve({ handled: false });
    });
  return { ask, sent };
}

describe('page-side collector (contract C5, BR7.5)', () => {
  it('tells the extension it has started', () => {
    expect(setup().sent).toEqual([{ type: 'content/ready' }]);
  });

  it('answers a request with the visit identifier and the three signals only', async () => {
    const { ask } = setup('<input type="password"><p>private text</p>');
    const reply = await ask({ type: 'signals/collect', visitId: 'visit-9' });
    expect(reply.response).toEqual({
      visitId: 'visit-9',
      signals: { asksForPassword: true, asksForPaymentCard: false, formSendsToOtherSite: false },
    });
    expect(JSON.stringify(reply.response)).not.toContain('private text');
  });

  it('ignores requests from any sender other than the extension', async () => {
    const { ask } = setup();
    expect(
      (await ask({ type: 'signals/collect', visitId: 'v' }, 'another-extension')).handled,
    ).toBe(false);
  });

  it('ignores messages that are not a collect request', async () => {
    const { ask } = setup();
    expect((await ask({ type: 'something-else' })).handled).toBe(false);
    expect((await ask('collect')).handled).toBe(false);
    expect((await ask({ type: 'signals/collect' })).handled).toBe(false);
  });

  it('waits for the document to finish loading before it looks', async () => {
    const { ask } = setup('');
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
    try {
      let answered = false;
      const pending = ask({ type: 'signals/collect', visitId: 'v' }).then((reply) => {
        answered = true;
        return reply;
      });
      await Promise.resolve();
      expect(answered).toBe(false);
      document.body.innerHTML = '<input type="password">';
      document.dispatchEvent(new Event('DOMContentLoaded'));
      const reply = await pending;
      expect(
        (reply.response as { signals: { asksForPassword: boolean } }).signals.asksForPassword,
      ).toBe(true);
    } finally {
      delete (document as unknown as Record<string, unknown>).readyState;
    }
  });

  it('does not fail when the extension is not listening for the started message', async () => {
    document.body.innerHTML = '';
    const env: ContentEnv = {
      extensionId: 'ext-id',
      onMessage: { addListener: () => undefined },
      sendMessage: () => Promise.reject(new Error('Receiving end does not exist.')),
    };
    expect(() => initContent(env, document, 'example.com')).not.toThrow();
    await Promise.resolve();
  });
});
