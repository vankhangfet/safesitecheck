import { parseCollectSignalsMessage } from '../shared/contracts';
import type { SignalsReport } from '../shared/contracts';
import { collectSignalsSafely } from './signals';

export interface ContentEnv {
  extensionId: string;
  onMessage: {
    addListener(
      listener: (
        message: unknown,
        sender: { id?: string },
        sendResponse: (response?: unknown) => void,
      ) => unknown,
    ): void;
  };
  sendMessage(message: unknown): Promise<unknown>;
}

function whenDomReady(doc: Document): Promise<void> {
  if (doc.readyState !== 'loading') return Promise.resolve();
  return new Promise((resolve) =>
    doc.addEventListener('DOMContentLoaded', () => resolve(), { once: true }),
  );
}

/**
 * The page-side collector. It holds no key and imports no settings code (NFR2.2). It answers one
 * request from the extension per visit with three yes/no values and the visit identifier.
 */
export function initContent(env: ContentEnv, doc: Document, pageHost: string): void {
  env.onMessage.addListener((raw, sender, sendResponse) => {
    const request = parseCollectSignalsMessage(raw);
    if (!request || sender.id !== env.extensionId) return false;
    void whenDomReady(doc).then(() => {
      const report: SignalsReport = {
        visitId: request.visitId,
        signals: collectSignalsSafely(doc, pageHost),
      };
      sendResponse(report);
    });
    return true;
  });
  // Tells the extension this page can now be asked, in case its first question came too early.
  env.sendMessage({ type: 'content/ready' }).catch(() => undefined);
}
