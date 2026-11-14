import { createChromeEnv } from './chromeEnv';

type Listener = (...args: unknown[]) => unknown;

function fakeChrome() {
  const listeners: Record<string, Listener[]> = { message: [], updated: [], removed: [] };
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const record =
    (name: string, result: unknown = undefined) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return Promise.resolve(result);
    };
  const area = () => ({ get: record('get', {}), set: record('set'), remove: record('remove') });
  const api = {
    runtime: {
      id: 'ext-id',
      getURL: (path: string) => `chrome-extension://ext-id/${path}`,
      onMessage: { addListener: (l: Listener) => listeners.message.push(l) },
      sendMessage: record('runtime.sendMessage'),
    },
    tabs: {
      onUpdated: { addListener: (l: Listener) => listeners.updated.push(l) },
      onRemoved: { addListener: (l: Listener) => listeners.removed.push(l) },
      query: record('tabs.query', [{ id: 1, url: 'https://example.com/' }]),
      sendMessage: record('tabs.sendMessage', { ok: true }),
    },
    storage: { local: area(), session: area() },
    permissions: {
      contains: record('permissions.contains', true),
      request: record('permissions.request', true),
    },
    action: {
      setBadgeText: record('action.setBadgeText'),
      setBadgeBackgroundColor: record('action.setBadgeBackgroundColor'),
      setTitle: record('action.setTitle'),
      setIcon: record('action.setIcon'),
    },
  };
  return { api: api as unknown as typeof chrome, listeners, calls };
}

describe('createChromeEnv', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).OffscreenCanvas;
    delete (globalThis as Record<string, unknown>).fetch;
  });

  it('exposes the extension id and the address prefix of its own pages', () => {
    const { api } = fakeChrome();
    const env = createChromeEnv(api);
    expect(env.extensionId).toBe('ext-id');
    expect(env.extensionBaseUrl).toBe('chrome-extension://ext-id/');
  });

  it('passes browser events through to the listeners', () => {
    const { api, listeners } = fakeChrome();
    const env = createChromeEnv(api);
    const seen: unknown[][] = [];
    env.onMessage.addListener((...args) => seen.push(['message', ...args.slice(0, 2)]));
    env.onTabUpdated.addListener((...args) => seen.push(['updated', ...args]));
    env.onTabRemoved.addListener((...args) => seen.push(['removed', ...args]));
    listeners.message[0]({ type: 'x' }, { id: 'a' }, () => undefined);
    listeners.updated[0](4, { status: 'loading' }, { id: 4 });
    listeners.removed[0](4);
    expect(seen).toEqual([
      ['message', { type: 'x' }, { id: 'a' }],
      ['updated', 4, { status: 'loading' }, { id: 4 }],
      ['removed', 4],
    ]);
  });

  it('asks the collector in the top frame only', async () => {
    const { api, calls } = fakeChrome();
    await createChromeEnv(api).sendTabMessage(7, { type: 'signals/collect', visitId: 'v' });
    expect(calls.find((c) => c.name === 'tabs.sendMessage')?.args).toEqual([
      7,
      { type: 'signals/collect', visitId: 'v' },
      { frameId: 0 },
    ]);
  });

  it('wraps storage, permissions, tabs and the toolbar', async () => {
    const { api, calls } = fakeChrome();
    const env = createChromeEnv(api);
    await env.storageLocal.get('a');
    await env.storageSession.set({ b: 1 });
    await env.storageSession.remove('b');
    expect(await env.permissions.contains({ origins: ['https://x/*'] })).toBe(true);
    expect(await env.permissions.request({ origins: ['https://x/*'] })).toBe(true);
    expect(await env.queryTabs()).toEqual([{ id: 1, url: 'https://example.com/' }]);
    await env.sendRuntimeMessage({ type: 'verdict/updated' });
    await env.action.setBadgeText({ tabId: 1, text: 'OK' });
    await env.action.setBadgeBackgroundColor({ tabId: 1, color: '#000' });
    await env.action.setTitle({ tabId: 1, title: 't' });
    await env.action.setIcon({ tabId: 1, imageData: {} });
    expect(calls.map((c) => c.name)).toEqual(
      expect.arrayContaining([
        'get',
        'set',
        'remove',
        'permissions.contains',
        'permissions.request',
        'tabs.query',
        'runtime.sendMessage',
        'action.setBadgeText',
        'action.setBadgeBackgroundColor',
        'action.setTitle',
        'action.setIcon',
      ]),
    );
  });

  it('draws on an offscreen canvas and calls the browser fetch', async () => {
    const sizes: number[] = [];
    (globalThis as Record<string, unknown>).OffscreenCanvas = class {
      constructor(width: number) {
        sizes.push(width);
      }
    };
    const fetchSpy = jest.fn(async () => ({ status: 200 }));
    (globalThis as Record<string, unknown>).fetch = fetchSpy;
    const env = createChromeEnv(fakeChrome().api);
    env.createCanvas(32);
    await env.fetchFn('https://api.example.com/', { method: 'POST' });
    expect(sizes).toEqual([32]);
    expect(fetchSpy).toHaveBeenCalledWith('https://api.example.com/', { method: 'POST' });
  });
});
