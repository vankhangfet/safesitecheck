import { createJevAdapter, type FetchFunction } from '../adapters/jevAdapter';
import { parseBackgroundMessage, type BackgroundMessage } from '../shared/contracts';
import { consoleSink, createLogger, type LogSink } from '../shared/logger';
import type { PermissionsApi, StorageArea } from '../shared/browser';
import { PageWatcher } from './pageWatcher';
import { createSettingsManager } from './settingsManager';
import { createToolbarIcon, type ActionApi, type IconCanvas } from './toolbarIcon';
import { VerdictService } from './verdictService';
import { createVisitStore } from './visitStore';

export interface EventSource<Args extends unknown[]> {
  addListener(listener: (...args: Args) => void): void;
}

export interface SenderInfo {
  id?: string;
  url?: string;
  frameId?: number;
  tab?: { id?: number };
}

export interface TabInfo {
  id?: number;
  url?: string;
  status?: string;
}

export interface TabChangeInfo {
  status?: string;
  url?: string;
}

/** Everything the background process needs from the browser. Tests pass fakes of the same shape. */
export interface BackgroundEnv {
  extensionId: string;
  /** The address prefix of the extension's own pages, such as chrome-extension://<id>/ */
  extensionBaseUrl: string;
  onMessage: EventSource<[unknown, SenderInfo, (response?: unknown) => void]>;
  onTabUpdated: EventSource<[number, TabChangeInfo, TabInfo]>;
  onTabRemoved: EventSource<[number]>;
  queryTabs(): Promise<TabInfo[]>;
  sendTabMessage(tabId: number, message: unknown): Promise<unknown>;
  sendRuntimeMessage(message: unknown): Promise<unknown>;
  storageLocal: StorageArea;
  storageSession: StorageArea;
  permissions: PermissionsApi;
  action: ActionApi;
  createCanvas: (size: number) => IconCanvas;
  fetchFn: FetchFunction;
  logSink?: LogSink;
}

export interface BackgroundHandle {
  service: VerdictService;
  watcher: PageWatcher;
  /** Resolves when the saved tab state has been restored after a start. */
  ready: Promise<void>;
}

/**
 * Who may send what (security design, trust boundaries): the page-side collector may only say it
 * has started, from the top frame of a tab; the popup and settings pages, which are the extension's
 * own pages, may ask for a verdict or a recheck. Every other sender is ignored.
 */
export function isTrustedSender(
  message: BackgroundMessage,
  sender: SenderInfo,
  env: Pick<BackgroundEnv, 'extensionId' | 'extensionBaseUrl'>,
): boolean {
  if (sender.id !== env.extensionId) return false;
  const fromExtensionPage = sender.url?.startsWith(env.extensionBaseUrl) === true;
  if (message.type === 'content/ready') {
    return !fromExtensionPage && sender.frameId === 0 && typeof sender.tab?.id === 'number';
  }
  return fromExtensionPage;
}

export function registerBackground(env: BackgroundEnv): BackgroundHandle {
  const settings = createSettingsManager({
    storage: env.storageLocal,
    permissions: env.permissions,
  });
  let debugOn = false;
  const logger = createLogger(env.logSink ?? consoleSink, () => debugOn);
  const refreshDebug = async (): Promise<void> => {
    debugOn = (await settings.load()).debug;
  };

  const service = new VerdictService({
    store: createVisitStore(env.storageSession),
    connections: settings,
    adapters: { jev: createJevAdapter({ fetchFn: env.fetchFn }) },
    logger,
  });
  const watcher = new PageWatcher({
    service,
    requestSignals: (tabId, visitId) =>
      env.sendTabMessage(tabId, { type: 'signals/collect', visitId }),
  });
  const toolbar = createToolbarIcon({ action: env.action, createCanvas: env.createCanvas, logger });

  service.subscribe((snapshot) => {
    void toolbar.update(snapshot);
    // The popup, if open, listens. Nobody listening is not an error.
    env.sendRuntimeMessage({ type: 'verdict/updated', ...snapshot }).catch(() => undefined);
  });

  // Every call into the extension is wrapped: an error ends here, never in the page (NFR6.1).
  const safely = async (work: () => Promise<void>): Promise<void> => {
    try {
      await work();
    } catch {
      logger.error('internal-error');
    }
  };

  async function restoreAll(): Promise<void> {
    await refreshDebug();
    const tabs = await env.queryTabs();
    const work: Promise<void>[] = [];
    for (const tab of tabs) {
      // A tab that is loading is handled by its own update event.
      if (tab.id === undefined || !tab.url || tab.status === 'loading') continue;
      work.push(safely(() => watcher.restoreOrBegin(tab.id as number, tab.url as string)));
    }
    await Promise.all(work);
  }
  const ready = safely(restoreAll);

  env.onTabUpdated.addListener((tabId, changeInfo, tab) => {
    void safely(async () => {
      await ready;
      const url = changeInfo.url ?? tab.url;
      if (!url) return;
      if (changeInfo.status === 'loading') {
        await refreshDebug();
        await watcher.onNavigated(tabId, url);
      } else if (changeInfo.url !== undefined) {
        await watcher.onAddressChanged(tabId, url);
      }
    });
  });

  env.onTabRemoved.addListener((tabId) => {
    void safely(() => watcher.onTabRemoved(tabId));
  });

  env.onMessage.addListener((raw, sender, sendResponse) => {
    const message = parseBackgroundMessage(raw);
    if (!message || !isTrustedSender(message, sender, env)) return false;
    void safely(async () => {
      if (message.type === 'content/ready') {
        // Never wait for the restore here: its own signal wait may be waiting for this message.
        watcher.onContentReady(sender.tab?.id as number);
        sendResponse(null);
        return;
      }
      await ready;
      switch (message.type) {
        case 'verdict/get':
          sendResponse(service.getSnapshot(message.tabId));
          break;
        case 'verdict/recheck':
          void safely(() => service.recheck(message.tabId, message.visitId));
          sendResponse({ ok: true });
          break;
      }
    });
    return true;
  });

  return { service, watcher, ready };
}
