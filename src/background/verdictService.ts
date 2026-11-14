import type { ConnectionProvider, SourceAdapter, VisitSnapshot } from '../shared/contracts';
import type { Logger } from '../shared/logger';
import {
  NO_SIGNALS,
  VISIT_TIME_LIMIT_MS,
  type FailureKind,
  type PageSignals,
  type PageVisit,
  type SourceName,
  type Verdict,
  type VerdictSource,
} from '../shared/types';
import { isCheckableAddress, stripAddress } from '../core/address';
import { verdictFromAnswer, verdictFromFailure } from '../core/verdict';
import type { VisitStore } from './visitStore';

export interface VerdictServiceDeps {
  store: VisitStore;
  connections: ConnectionProvider;
  adapters: Partial<Record<SourceName, SourceAdapter>>;
  logger: Logger;
  now?: () => number;
  newId?: () => string;
  /** The limit for a whole visit; 5 seconds unless a test shortens it. */
  limitMs?: number;
}

export type SnapshotListener = (snapshot: VisitSnapshot) => void;

interface TabState {
  visit: PageVisit;
  verdict?: Verdict;
  timer?: ReturnType<typeof setTimeout>;
  /** True from the visit start until the signals arrive or a recheck takes over. Not saved. */
  awaitingSignals: boolean;
}

function defaultId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Owns every PageVisit and its Verdict: the 5-second timer counted from the visit start, attempt
 * identity, the late-answer guard and Check again (BR3.x, BR5.x, BR8.x). Each visit is its own
 * failure domain; one request is made per attempt and never retried (NFR6.5).
 */
export class VerdictService {
  private readonly tabs = new Map<number, TabState>();
  private readonly listeners = new Set<SnapshotListener>();
  private readonly now: () => number;
  private readonly newId: () => string;
  private readonly limitMs: number;

  constructor(private readonly deps: VerdictServiceDeps) {
    this.now = deps.now ?? Date.now;
    this.newId = deps.newId ?? defaultId;
    this.limitMs = deps.limitMs ?? VISIT_TIME_LIMIT_MS;
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** What a screen that opens later pulls (BR8.1). */
  getSnapshot(tabId: number): VisitSnapshot | null {
    const tab = this.tabs.get(tabId);
    return tab ? this.toSnapshot(tab) : null;
  }

  currentAddress(tabId: number): string | undefined {
    return this.tabs.get(tabId)?.visit.strippedAddress;
  }

  currentVisitId(tabId: number): string | undefined {
    return this.tabs.get(tabId)?.visit.visitId;
  }

  /** A top-level page opened or its address changed: the old visit ends and a new one starts. */
  async beginVisit(tabId: number, rawAddress: string): Promise<PageVisit> {
    this.dropTab(tabId);
    const strippedAddress = stripAddress(rawAddress);
    const checkable = isCheckableAddress(strippedAddress);
    const visit: PageVisit = {
      visitId: this.newId(),
      tabId,
      strippedAddress,
      checkable,
      attemptId: this.newId(),
      state: 'checking',
      startedAt: this.now(),
    };
    const tab: TabState = { visit, awaitingSignals: checkable };
    this.tabs.set(tabId, tab);
    this.deps.logger.step('visit-started');
    if (!checkable) {
      await this.finishFailure(tab, visit.attemptId, 'unsupported-page', 'none');
      return visit;
    }
    this.armTimer(tab, this.limitMs);
    this.publish(tab);
    await this.persist(tab);
    return visit;
  }

  /** The signals for a visit have been collected (or the wait ran out): start the first check. */
  async submitSignals(tabId: number, visitId: string, signals: PageSignals): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab || tab.visit.visitId !== visitId || !tab.awaitingSignals) return;
    if (tab.visit.state !== 'checking') return;
    tab.awaitingSignals = false;
    tab.visit.signals = { ...signals };
    this.deps.logger.step('signals-collected');
    await this.runAttempt(tab);
  }

  /** Check again (W2): supersedes any waiting attempt, ignores memory and starts one new attempt. */
  async recheck(tabId: number, visitId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab || tab.visit.visitId !== visitId) return;
    if (!tab.visit.checkable) {
      this.publish(tab);
      return;
    }
    this.deps.logger.step('check-again');
    tab.awaitingSignals = false;
    tab.visit.startedAt = this.now();
    this.armTimer(tab, this.limitMs);
    await this.runAttempt(tab);
  }

  /** The person left the page or closed the tab: later answers are discarded (BR3.1). */
  async forgetTab(tabId: number): Promise<void> {
    this.dropTab(tabId);
    try {
      await this.deps.store.remove(tabId);
    } catch {
      this.deps.logger.error('internal-error');
    }
  }

  /**
   * After the background process restarts (BR8.2): returns true when the saved state for this tab
   * was usable. A visit that was waiting gets a new attempt, with its timer counted from the
   * saved start; one that already ran past the limit ends as timed-out at once (NFR6.3).
   */
  async restore(tabId: number, rawAddress: string): Promise<boolean> {
    let stored;
    try {
      stored = await this.deps.store.load(tabId);
    } catch {
      return false;
    }
    if (!stored) return false;
    const { visit } = stored;
    if (visit.state === 'ended' || visit.strippedAddress !== stripAddress(rawAddress)) return false;
    if (visit.state !== 'checking' && !stored.verdict) return false;
    this.dropTab(tabId);
    const tab: TabState = { visit: { ...visit }, verdict: stored.verdict, awaitingSignals: false };
    this.tabs.set(tabId, tab);
    this.deps.logger.step('visit-restored');
    if (visit.state !== 'checking') {
      this.publish(tab);
      return true;
    }
    const elapsed = this.now() - visit.startedAt;
    if (elapsed >= this.limitMs) {
      await this.finishFailure(tab, visit.attemptId, 'timeout', 'none');
      return true;
    }
    this.armTimer(tab, this.limitMs - elapsed);
    await this.runAttempt(tab);
    return true;
  }

  private async runAttempt(tab: TabState): Promise<void> {
    const { visit } = tab;
    const attemptId = this.newId();
    visit.attemptId = attemptId;
    visit.state = 'checking';
    tab.verdict = undefined;
    this.publish(tab);
    try {
      await this.persist(tab);
      const result = await this.deps.connections.getConnection();
      if (!this.isCurrent(tab, attemptId)) return;
      if (!result.ok) {
        await this.finishFailure(tab, attemptId, result.kind, 'none');
        return;
      }
      const { connection } = result;
      const adapter = this.deps.adapters[connection.source];
      if (!adapter) {
        await this.finishFailure(tab, attemptId, 'internal-error', connection.source);
        return;
      }
      const remaining = Math.max(0, this.limitMs - (this.now() - visit.startedAt));
      this.deps.logger.step('request-sent');
      const outcome = await adapter.check(
        { address: visit.strippedAddress, signals: visit.signals ?? NO_SIGNALS },
        connection,
        remaining,
      );
      // The connection (and the key in it) is not used again; only the answer matters now.
      if (!this.isCurrent(tab, attemptId)) return;
      if (!outcome.ok) {
        await this.finishFailure(tab, attemptId, outcome.kind, connection.source);
        return;
      }
      const verdict = verdictFromAnswer(outcome.answer, {
        visit,
        attemptId,
        verdictId: this.newId(),
        source: connection.source,
        now: this.now(),
      });
      await this.finish(tab, verdict);
    } catch {
      this.deps.logger.error('internal-error');
      if (this.isCurrent(tab, attemptId)) {
        await this.finishFailure(tab, attemptId, 'internal-error', 'none').catch(() => undefined);
      }
    }
  }

  /** The visit is still the tab's current one, still waiting, and this is its latest attempt. */
  private isCurrent(tab: TabState, attemptId: string): boolean {
    return (
      this.tabs.get(tab.visit.tabId) === tab &&
      tab.visit.state === 'checking' &&
      tab.visit.attemptId === attemptId
    );
  }

  private async finishFailure(
    tab: TabState,
    attemptId: string,
    kind: FailureKind,
    source: VerdictSource,
  ): Promise<void> {
    const verdict = verdictFromFailure(kind, {
      visit: tab.visit,
      attemptId,
      verdictId: this.newId(),
      source,
      now: this.now(),
    });
    await this.finish(tab, verdict);
  }

  private async finish(tab: TabState, verdict: Verdict): Promise<void> {
    tab.visit.state = verdict.failureKind === 'timeout' ? 'timed-out' : 'answered';
    tab.verdict = verdict;
    tab.awaitingSignals = false;
    this.clearTimer(tab);
    if (verdict.failureKind) this.deps.logger.error(verdict.failureKind);
    this.deps.logger.timing(this.now() - tab.visit.startedAt);
    this.deps.logger.step('answer-shown');
    this.publish(tab);
    await this.persist(tab);
  }

  private armTimer(tab: TabState, milliseconds: number): void {
    this.clearTimer(tab);
    tab.timer = setTimeout(() => {
      this.onTimeout(tab).catch(() => this.deps.logger.error('internal-error'));
    }, milliseconds);
  }

  private clearTimer(tab: TabState): void {
    if (tab.timer !== undefined) clearTimeout(tab.timer);
    tab.timer = undefined;
  }

  private async onTimeout(tab: TabState): Promise<void> {
    if (this.tabs.get(tab.visit.tabId) !== tab || tab.visit.state !== 'checking') return;
    await this.finishFailure(tab, tab.visit.attemptId, 'timeout', 'none');
  }

  private dropTab(tabId: number): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    this.clearTimer(tab);
    tab.visit.state = 'ended';
    this.tabs.delete(tabId);
  }

  private toSnapshot(tab: TabState): VisitSnapshot {
    const { visit, verdict } = tab;
    const snapshot: VisitSnapshot = {
      visitId: visit.visitId,
      tabId: visit.tabId,
      address: visit.strippedAddress,
      state: visit.state === 'checking' ? 'checking' : 'verdict',
    };
    if (snapshot.state === 'verdict' && verdict) {
      snapshot.label = verdict.label;
      snapshot.reasonShort = verdict.reasonShort;
      if (verdict.reasonMore !== undefined) snapshot.reasonMore = verdict.reasonMore;
      if (verdict.failureKind !== undefined) snapshot.failureKind = verdict.failureKind;
    }
    return snapshot;
  }

  private publish(tab: TabState): void {
    const snapshot = this.toSnapshot(tab);
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        this.deps.logger.error('internal-error');
      }
    }
  }

  private async persist(tab: TabState): Promise<void> {
    try {
      await this.deps.store.save({ visit: tab.visit, verdict: tab.verdict });
    } catch {
      this.deps.logger.error('internal-error');
    }
  }
}
