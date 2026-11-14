import { stripAddress } from '../core/address';
import { NO_SIGNALS, SIGNAL_WAIT_MS, parseSignals, type PageSignals } from '../shared/types';
import type { VerdictService } from './verdictService';

export interface PageWatcherDeps {
  service: VerdictService;
  /** Asks the page-side collector in the tab's top frame for its signals. */
  requestSignals: (tabId: number, visitId: string) => Promise<unknown>;
  signalWaitMs?: number;
}

function readReport(raw: unknown, visitId: string): PageSignals | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const report = raw as Record<string, unknown>;
  if (report.visitId !== visitId) return null;
  return parseSignals(report.signals);
}

/**
 * PageWatcher, background part: turns tab events into page visits, then collects the three
 * signals and waits at most 1 second for them (BR7.5). Frames never reach this code because the
 * browser reports only top-level changes (BR1.2).
 */
export class PageWatcher {
  private readonly readyWaiters = new Map<number, Array<() => void>>();
  private readonly signalWaitMs: number;

  constructor(private readonly deps: PageWatcherDeps) {
    this.signalWaitMs = deps.signalWaitMs ?? SIGNAL_WAIT_MS;
  }

  /** A top-level page is loading (or reloading): always a new visit (BR1.1). */
  async onNavigated(tabId: number, url: string): Promise<void> {
    const visit = await this.deps.service.beginVisit(tabId, url);
    if (!visit.checkable) return;
    const signals = await this.gather(tabId, visit.visitId);
    await this.deps.service.submitSignals(tabId, visit.visitId, signals);
  }

  /** The address changed without a reload: a new visit only if the stripped address differs (BR1.5). */
  async onAddressChanged(tabId: number, url: string): Promise<void> {
    if (this.deps.service.currentAddress(tabId) === stripAddress(url)) return;
    await this.onNavigated(tabId, url);
  }

  /** The page-side collector has started in this tab. */
  onContentReady(tabId: number): void {
    const waiting = this.readyWaiters.get(tabId) ?? [];
    this.readyWaiters.delete(tabId);
    for (const wake of waiting) wake();
  }

  async onTabRemoved(tabId: number): Promise<void> {
    this.readyWaiters.delete(tabId);
    await this.deps.service.forgetTab(tabId);
  }

  /** After a restart: keep the saved state when it fits the open page, else start a new visit (BR8.2). */
  async restoreOrBegin(tabId: number, url: string): Promise<void> {
    if (await this.deps.service.restore(tabId, url)) return;
    await this.onNavigated(tabId, url);
  }

  private async gather(tabId: number, visitId: string): Promise<PageSignals> {
    const state = { finished: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), this.signalWaitMs);
    });
    try {
      const signals = await Promise.race([this.pullWhenReady(tabId, visitId, state), timeout]);
      return signals ?? { ...NO_SIGNALS };
    } finally {
      state.finished = true;
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  private async pull(tabId: number, visitId: string): Promise<PageSignals | null> {
    try {
      return readReport(await this.deps.requestSignals(tabId, visitId), visitId);
    } catch {
      // The collector is not in the page (yet), or the page forbids it: counted as no.
      return null;
    }
  }

  private async pullWhenReady(
    tabId: number,
    visitId: string,
    state: { finished: boolean },
  ): Promise<PageSignals | null> {
    const first = await this.pull(tabId, visitId);
    if (first) return first;
    await new Promise<void>((resolve) => {
      this.readyWaiters.set(tabId, [...(this.readyWaiters.get(tabId) ?? []), resolve]);
    });
    return state.finished ? null : this.pull(tabId, visitId);
  }
}
