import type { BackgroundEnv, SenderInfo, TabChangeInfo, TabInfo } from '../background/wiring';
import type { ActionApi, IconCanvas, IconContext } from '../background/toolbarIcon';
import {
  FAKE_KEY,
  answerFor,
  createFakePermissions,
  createMemoryStorage,
  fakeResponse,
  jevBodyFor,
  signals,
} from './fakes';
import type { FetchFunction } from '../adapters/jevAdapter';
import type { PageSignals } from '../shared/types';

export class FakeEvent<Args extends unknown[]> {
  readonly listeners: Array<(...args: Args) => unknown> = [];
  addListener(listener: (...args: Args) => unknown): void {
    this.listeners.push(listener);
  }
  emit(...args: Args): void {
    for (const listener of this.listeners) listener(...args);
  }
}

export const EXTENSION_ID = 'fake-extension-id';
export const EXTENSION_BASE = `chrome-extension://${EXTENSION_ID}/`;

export const popupSender: SenderInfo = { id: EXTENSION_ID, url: `${EXTENSION_BASE}popup.html` };
export const contentSender = (tabId: number, frameId = 0): SenderInfo => ({
  id: EXTENSION_ID,
  url: 'https://example.com/',
  frameId,
  tab: { id: tabId },
});

export interface FakeBackground {
  env: BackgroundEnv;
  onMessage: FakeEvent<[unknown, SenderInfo, (response?: unknown) => void]>;
  onTabUpdated: FakeEvent<[number, TabChangeInfo, TabInfo]>;
  onTabRemoved: FakeEvent<[number]>;
  tabs: TabInfo[];
  storageLocal: ReturnType<typeof createMemoryStorage>;
  storageSession: ReturnType<typeof createMemoryStorage>;
  permissions: ReturnType<typeof createFakePermissions>;
  fetchFn: jest.Mock<ReturnType<FetchFunction>, Parameters<FetchFunction>>;
  sendTabMessage: jest.Mock<Promise<unknown>, [number, unknown]>;
  runtimeMessages: unknown[];
  actionCalls: Array<{ call: string; details: Record<string, unknown> }>;
  logs: string[];
  /** Sends a message as the browser would and resolves with the response, if one was given. */
  send(message: unknown, sender: SenderInfo): Promise<{ handled: boolean; response?: unknown }>;
}

export function fakeCanvas(): IconCanvas {
  const context = new Proxy(
    {
      getImageData: (_x: number, _y: number, width: number, height: number) =>
        ({
          width,
          height,
          data: new Uint8ClampedArray(width * height * 4),
        }) as unknown as ImageData,
    },
    {
      get: (target, key) =>
        key in target ? (target as Record<string, unknown>)[key as string] : () => undefined,
      set: () => true,
    },
  ) as unknown as IconContext;
  return { getContext: () => context };
}

/** An extension environment in memory: a saved key, permission for the default address, Jev says safe. */
export function createFakeBackground(
  options: { withKey?: boolean; storageSession?: ReturnType<typeof createMemoryStorage> } = {},
): FakeBackground {
  const { withKey = true } = options;
  const onMessage = new FakeEvent<[unknown, SenderInfo, (response?: unknown) => void]>();
  const onTabUpdated = new FakeEvent<[number, TabChangeInfo, TabInfo]>();
  const onTabRemoved = new FakeEvent<[number]>();
  const storageLocal = createMemoryStorage(withKey ? { jevKey: FAKE_KEY } : {});
  const storageSession = options.storageSession ?? createMemoryStorage();
  const permissions = createFakePermissions({ grantOnRequest: true });
  permissions.granted.add('https://api.typesafe.ai/*');
  const tabs: TabInfo[] = [];
  const runtimeMessages: unknown[] = [];
  const actionCalls: FakeBackground['actionCalls'] = [];
  const logs: string[] = [];

  const fetchFn = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>(async () =>
    fakeResponse(200, jevBodyFor(answerFor('safe'))),
  );
  const sendTabMessage = jest.fn<Promise<unknown>, [number, unknown]>(async (_tabId, message) => ({
    visitId: (message as { visitId: string }).visitId,
    signals: {
      asksForPassword: false,
      asksForPaymentCard: false,
      formSendsToOtherSite: false,
    } satisfies PageSignals,
  }));
  const record =
    (call: string) =>
    async (details: Record<string, unknown>): Promise<void> => {
      actionCalls.push({ call, details });
    };
  const action = {
    setBadgeText: record('setBadgeText'),
    setBadgeBackgroundColor: record('setBadgeBackgroundColor'),
    setTitle: record('setTitle'),
    setIcon: record('setIcon'),
  } as unknown as ActionApi;

  const env: BackgroundEnv = {
    extensionId: EXTENSION_ID,
    extensionBaseUrl: EXTENSION_BASE,
    onMessage,
    onTabUpdated,
    onTabRemoved,
    queryTabs: async () => tabs,
    sendTabMessage,
    sendRuntimeMessage: async (message) => {
      runtimeMessages.push(message);
      return undefined;
    },
    storageLocal,
    storageSession,
    permissions,
    action,
    createCanvas: () => fakeCanvas(),
    fetchFn,
    logSink: { warn: (m) => logs.push(m), debug: (m) => logs.push(m) },
  };

  return {
    env,
    onMessage,
    onTabUpdated,
    onTabRemoved,
    tabs,
    storageLocal,
    storageSession,
    permissions,
    fetchFn,
    sendTabMessage,
    runtimeMessages,
    actionCalls,
    logs,
    send(message, sender) {
      return new Promise((resolve) => {
        let handled = false;
        for (const listener of onMessage.listeners) {
          if (
            listener(message, sender, (response) => resolve({ handled: true, response })) === true
          )
            handled = true;
        }
        if (!handled) resolve({ handled: false });
      });
    },
  };
}

/** Lets pending promise chains run, under real timers. */
export const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export function badgeFor(fake: FakeBackground, tabId: number): string | undefined {
  const calls = fake.actionCalls.filter(
    (c) => c.call === 'setBadgeText' && c.details.tabId === tabId,
  );
  return calls.length > 0 ? (calls[calls.length - 1].details.text as string) : undefined;
}

export function titleFor(fake: FakeBackground, tabId: number): string | undefined {
  const calls = fake.actionCalls.filter((c) => c.call === 'setTitle' && c.details.tabId === tabId);
  return calls.length > 0 ? (calls[calls.length - 1].details.title as string) : undefined;
}

export { signals };
