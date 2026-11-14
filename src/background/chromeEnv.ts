import { wrapPermissions, wrapStorageArea } from '../shared/browser';
import type { BackgroundEnv, EventSource, SenderInfo, TabChangeInfo, TabInfo } from './wiring';
import type { IconCanvas } from './toolbarIcon';

type SendResponse = (response?: unknown) => void;

/** Maps the real `chrome` object onto the shapes the background process uses. Edge and Chrome match. */
export function createChromeEnv(api: typeof chrome): BackgroundEnv {
  const onMessage: EventSource<[unknown, SenderInfo, SendResponse]> = {
    addListener: (listener) =>
      api.runtime.onMessage.addListener((message, sender, sendResponse) =>
        listener(message, sender as SenderInfo, sendResponse),
      ),
  };
  const onTabUpdated: EventSource<[number, TabChangeInfo, TabInfo]> = {
    addListener: (listener) =>
      api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => listener(tabId, changeInfo, tab)),
  };
  const onTabRemoved: EventSource<[number]> = {
    addListener: (listener) => api.tabs.onRemoved.addListener((tabId) => listener(tabId)),
  };
  return {
    extensionId: api.runtime.id,
    extensionBaseUrl: api.runtime.getURL(''),
    onMessage,
    onTabUpdated,
    onTabRemoved,
    queryTabs: () => api.tabs.query({}),
    // The collector lives in the top frame only; frame 0 is that frame.
    sendTabMessage: (tabId, message) => api.tabs.sendMessage(tabId, message, { frameId: 0 }),
    sendRuntimeMessage: (message) => api.runtime.sendMessage(message),
    storageLocal: wrapStorageArea(api.storage.local),
    storageSession: wrapStorageArea(api.storage.session),
    permissions: wrapPermissions(api.permissions),
    action: {
      setBadgeText: (details) => api.action.setBadgeText(details),
      setBadgeBackgroundColor: (details) => api.action.setBadgeBackgroundColor(details),
      setTitle: (details) => api.action.setTitle(details),
      setIcon: (details) => api.action.setIcon(details),
    },
    createCanvas: (size) => new OffscreenCanvas(size, size) as unknown as IconCanvas,
    fetchFn: (input, init) => fetch(input, init),
  };
}
