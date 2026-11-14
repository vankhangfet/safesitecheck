import type { StorageArea } from '../shared/browser';
import {
  isFailureKind,
  isVerdictLabel,
  isVisitState,
  parseSignals,
  type PageVisit,
  type Verdict,
} from '../shared/types';

/** What is kept for one tab so a restart of the background process loses nothing (BR8.2). */
export interface StoredTabState {
  visit: PageVisit;
  verdict?: Verdict;
}

export interface VisitStore {
  save(state: StoredTabState): Promise<void>;
  load(tabId: number): Promise<StoredTabState | null>;
  remove(tabId: number): Promise<void>;
}

const keyFor = (tabId: number): string => `tab:${tabId}`;

function parseVisit(value: unknown): PageVisit | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.visitId !== 'string' ||
    !Number.isInteger(v.tabId) ||
    typeof v.strippedAddress !== 'string' ||
    typeof v.checkable !== 'boolean' ||
    typeof v.attemptId !== 'string' ||
    !isVisitState(v.state) ||
    typeof v.startedAt !== 'number'
  ) {
    return null;
  }
  const visit: PageVisit = {
    visitId: v.visitId,
    tabId: v.tabId as number,
    strippedAddress: v.strippedAddress,
    checkable: v.checkable,
    attemptId: v.attemptId,
    state: v.state,
    startedAt: v.startedAt,
  };
  if (v.signals !== undefined) {
    const signals = parseSignals(v.signals);
    if (!signals) return null;
    visit.signals = signals;
  }
  return visit;
}

function parseVerdict(value: unknown): Verdict | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.verdictId !== 'string' ||
    typeof v.visitId !== 'string' ||
    typeof v.attemptId !== 'string' ||
    typeof v.strippedAddress !== 'string' ||
    !isVerdictLabel(v.label) ||
    typeof v.reasonShort !== 'string' ||
    typeof v.checkedAt !== 'number' ||
    (v.source !== 'jev' && v.source !== 'openjev' && v.source !== 'none')
  ) {
    return null;
  }
  const verdict: Verdict = {
    verdictId: v.verdictId,
    visitId: v.visitId,
    attemptId: v.attemptId,
    strippedAddress: v.strippedAddress,
    label: v.label,
    reasonShort: v.reasonShort,
    source: v.source,
    checkedAt: v.checkedAt,
  };
  if (typeof v.reasonMore === 'string') verdict.reasonMore = v.reasonMore;
  if (isFailureKind(v.failureKind)) verdict.failureKind = v.failureKind;
  return verdict;
}

/** Short-lived (browser session) storage of each tab's current visit and verdict. */
export function createVisitStore(storage: StorageArea): VisitStore {
  return {
    async save(state) {
      await storage.set({ [keyFor(state.visit.tabId)]: state });
    },
    async load(tabId) {
      const stored = (await storage.get(keyFor(tabId)))[keyFor(tabId)];
      if (typeof stored !== 'object' || stored === null) return null;
      const record = stored as Record<string, unknown>;
      const visit = parseVisit(record.visit);
      if (!visit || visit.tabId !== tabId) return null;
      if (record.verdict === undefined) return { visit };
      const verdict = parseVerdict(record.verdict);
      return verdict ? { visit, verdict } : { visit };
    },
    async remove(tabId) {
      await storage.remove(keyFor(tabId));
    },
  };
}
