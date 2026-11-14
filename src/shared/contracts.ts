import type {
  CheckSubject,
  FailureKind,
  RiskAnswer,
  SourceName,
  VerdictLabel,
  PageSignals,
} from './types';
import { isFailureKind, isVerdictLabel } from './types';

/** Connection details for one request (contract C6). The key is never kept by the caller. */
export interface Connection {
  source: SourceName;
  serverAddress: string;
  key?: string;
  modelName: string;
}

export type ConnectionFailureKind = Extract<
  FailureKind,
  'missing-key' | 'missing-address' | 'permission-denied' | 'internal-error'
>;

export type ConnectionResult =
  { ok: true; connection: Connection } | { ok: false; kind: ConnectionFailureKind };

export interface ConnectionProvider {
  getConnection(): Promise<ConnectionResult>;
}

/** Result of one request: an answer or a named failure, never a third path (NFR6.2). */
export type AdapterResult = { ok: true; answer: RiskAnswer } | { ok: false; kind: FailureKind };

export type TestConnectionResult = { ok: true } | { ok: false; kind: FailureKind };

/** Contract C1. An adapter never reads or stores the key and never retries. */
export interface SourceAdapter {
  check(subject: CheckSubject, connection: Connection, timeoutMs: number): Promise<AdapterResult>;
  testConnection(connection: Connection): Promise<TestConnectionResult>;
}

/** What every screen needs to know about one tab's current visit (contract C3, BR8.1). */
export interface VisitSnapshot {
  visitId: string;
  tabId: number;
  address: string;
  state: 'checking' | 'verdict';
  label?: VerdictLabel;
  reasonShort?: string;
  reasonMore?: string;
  failureKind?: FailureKind;
}

export type VerdictUpdatedMessage = { type: 'verdict/updated' } & VisitSnapshot;
export interface VerdictGetMessage {
  type: 'verdict/get';
  tabId: number;
}
export interface VerdictRecheckMessage {
  type: 'verdict/recheck';
  visitId: string;
  tabId: number;
}
export interface ContentReadyMessage {
  type: 'content/ready';
}
export interface CollectSignalsMessage {
  type: 'signals/collect';
  visitId: string;
}
export interface SignalsReport {
  visitId: string;
  signals: PageSignals;
}

export type BackgroundMessage = VerdictGetMessage | VerdictRecheckMessage | ContentReadyMessage;

/** Accepts only the three messages the background process understands; others give null. */
export function parseBackgroundMessage(raw: unknown): BackgroundMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const message = raw as Record<string, unknown>;
  if (message.type === 'content/ready') return { type: 'content/ready' };
  if (message.type === 'verdict/get' && Number.isInteger(message.tabId)) {
    return { type: 'verdict/get', tabId: message.tabId as number };
  }
  if (
    message.type === 'verdict/recheck' &&
    Number.isInteger(message.tabId) &&
    typeof message.visitId === 'string'
  ) {
    return { type: 'verdict/recheck', tabId: message.tabId as number, visitId: message.visitId };
  }
  return null;
}

export function parseCollectSignalsMessage(raw: unknown): CollectSignalsMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const message = raw as Record<string, unknown>;
  if (message.type !== 'signals/collect' || typeof message.visitId !== 'string') return null;
  return { type: 'signals/collect', visitId: message.visitId };
}

/** Reads a verdict update or a verdict answer into the closed shape; anything else gives null. */
export function parseVisitSnapshot(raw: unknown): VisitSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Record<string, unknown>;
  if (
    typeof value.visitId !== 'string' ||
    !Number.isInteger(value.tabId) ||
    typeof value.address !== 'string' ||
    (value.state !== 'checking' && value.state !== 'verdict')
  ) {
    return null;
  }
  const snapshot: VisitSnapshot = {
    visitId: value.visitId,
    tabId: value.tabId as number,
    address: value.address,
    state: value.state,
  };
  if (isVerdictLabel(value.label)) snapshot.label = value.label;
  if (typeof value.reasonShort === 'string') snapshot.reasonShort = value.reasonShort;
  if (typeof value.reasonMore === 'string') snapshot.reasonMore = value.reasonMore;
  if (isFailureKind(value.failureKind)) snapshot.failureKind = value.failureKind;
  return snapshot;
}
