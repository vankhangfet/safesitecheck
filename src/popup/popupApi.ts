import { parseVisitSnapshot } from '../shared/contracts';
import type { PopupApi } from './popupView';

/** The real browser behind the popup's small interface. */
export function createPopupApi(api: typeof chrome): PopupApi {
  return {
    async getActiveTabId() {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      return tab?.id;
    },
    async getSnapshot(tabId) {
      return parseVisitSnapshot(await api.runtime.sendMessage({ type: 'verdict/get', tabId }));
    },
    async recheck(tabId, visitId) {
      await api.runtime.sendMessage({ type: 'verdict/recheck', tabId, visitId });
    },
    openSettings() {
      void api.runtime.openOptionsPage();
    },
    onUpdate(listener) {
      api.runtime.onMessage.addListener((message, sender) => {
        // Only the extension's own background process may push an update (not a page's collector).
        if (sender.id !== api.runtime.id || sender.tab) return;
        if ((message as { type?: unknown } | null)?.type !== 'verdict/updated') return;
        const snapshot = parseVisitSnapshot(message);
        if (snapshot) listener(snapshot);
      });
    },
  };
}
