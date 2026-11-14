import type { PermissionsApi, StorageArea } from '../shared/browser';
import type { PageSignals, RiskAnswer, RiskOption } from '../shared/types';

/** An obviously fake key. No test uses a real key or the network. */
export const FAKE_KEY = 'fake-test-key-1';

/** Storage keeps copies, as the browser does (structuredClone is missing in jsdom). */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface MemoryStorage extends StorageArea {
  data: Map<string, unknown>;
  failNext(times?: number): void;
  /** Makes every later write fail, as when the browser's storage is full or unavailable. */
  failWrites(): void;
}

export function createMemoryStorage(initial: Record<string, unknown> = {}): MemoryStorage {
  const data = new Map<string, unknown>(Object.entries(initial));
  let failNext = 0;
  let failWrites = false;
  const guard = (): void => {
    if (failNext > 0) {
      failNext -= 1;
      throw new Error('storage unavailable');
    }
  };
  const guardWrite = (): void => {
    guard();
    if (failWrites) throw new Error('storage unavailable');
  };
  return {
    data,
    failNext: (times = 1) => {
      failNext = times;
    },
    failWrites: () => {
      failWrites = true;
    },
    async get(keys) {
      guard();
      const list = keys === null ? [...data.keys()] : Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};
      for (const key of list) if (data.has(key)) result[key] = clone(data.get(key));
      return result;
    },
    async set(items) {
      guardWrite();
      for (const [key, value] of Object.entries(items)) data.set(key, clone(value));
    },
    async remove(keys) {
      guardWrite();
      for (const key of Array.isArray(keys) ? keys : [keys]) data.delete(key);
    },
  };
}

export interface FakePermissions extends PermissionsApi {
  granted: Set<string>;
  requests: string[][];
}

export function createFakePermissions(options: { grantOnRequest: boolean }): FakePermissions {
  const granted = new Set<string>();
  const requests: string[][] = [];
  return {
    granted,
    requests,
    async contains(query) {
      return query.origins.every((origin) => granted.has(origin));
    },
    async request(query) {
      requests.push(query.origins);
      if (options.grantOnRequest) query.origins.forEach((origin) => granted.add(origin));
      return options.grantOnRequest;
    },
  };
}

export function answerFor(choice: RiskOption, overrides: Partial<RiskAnswer> = {}): RiskAnswer {
  const probabilities = { safe: 0, phishing: 0, scam: 0, malware: 0, other_risk: 0 };
  probabilities[choice] = 0.9;
  return { choice, confidence: 0.9, probabilities, ...overrides };
}

/** The body Jev would return (contract C7) for a given answer. */
export function jevBodyFor(answer: RiskAnswer): unknown {
  return {
    model: 'jev-latest',
    answers: {
      risk: {
        type: 'choice',
        choice: answer.choice,
        confidence: answer.confidence,
        probabilities: answer.probabilities,
      },
    },
    usage: { input_tokens: 10, output_tokens: 2 },
  };
}

export function signals(overrides: Partial<PageSignals> = {}): PageSignals {
  return {
    asksForPassword: false,
    asksForPaymentCard: false,
    formSendsToOtherSite: false,
    ...overrides,
  };
}

/** A minimal fake of the part of `Response` that the adapter reads. */
export function fakeResponse(status: number, body?: unknown, unreadable = false): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (unreadable) throw new SyntaxError('not json');
      return body;
    },
  } as unknown as Response;
}
