import type {
  AdapterResult,
  Connection,
  SourceAdapter,
  TestConnectionResult,
} from '../shared/contracts';
import type { CheckSubject, FailureKind } from '../shared/types';
import { NO_SIGNALS } from '../shared/types';
import { buildJevRequest, parseJevAnswer } from '../core/request';

export type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;

const ENDPOINT_PATH = '/v1/systemone';

/** Statuses the service uses for a request it will not accept (contract C7). */
const REJECTED_REQUEST_STATUSES = [400, 413, 415, 422];

function failureForStatus(status: number): FailureKind {
  if (status === 401) return 'rejected-key';
  if (status === 429) return 'rate-limited';
  if (status === 529) return 'overloaded';
  if (REJECTED_REQUEST_STATUSES.includes(status)) return 'unsupported-request';
  // Any other status is not an answer we can use.
  return 'unreadable-answer';
}

/**
 * Hosted Jev (contract C7): one POST with the bearer key to the saved https address, one Choice
 * question named risk. It never reads or stores the key, never retries (NFR6.5), and returns an
 * answer or a named failure, nothing else (NFR6.2).
 */
export function createJevAdapter(deps: { fetchFn: FetchFunction }): SourceAdapter {
  async function check(
    subject: CheckSubject,
    connection: Connection,
    timeoutMs: number,
  ): Promise<AdapterResult> {
    if (!connection.key) return { ok: false, kind: 'missing-key' };
    let url: URL;
    try {
      url = new URL(connection.serverAddress);
    } catch {
      return { ok: false, kind: 'missing-address' };
    }
    // The key goes only over a secure connection (BR6.8), checked again here as a second guard.
    if (url.protocol !== 'https:') return { ok: false, kind: 'unsupported-request' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(0, timeoutMs));
    try {
      const response = await deps.fetchFn(
        `${url.origin}${url.pathname.replace(/\/+$/, '')}${ENDPOINT_PATH}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${connection.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildJevRequest(subject, connection.modelName)),
          signal: controller.signal,
          // A redirect could carry the key to another server, so none is followed.
          redirect: 'error',
          credentials: 'omit',
          cache: 'no-store',
        },
      );
      if (response.status !== 200) return { ok: false, kind: failureForStatus(response.status) };
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { ok: false, kind: 'unreadable-answer' };
      }
      const answer = parseJevAnswer(body);
      return answer ? { ok: true, answer } : { ok: false, kind: 'unreadable-answer' };
    } catch (error) {
      if (controller.signal.aborted || (error as { name?: string }).name === 'AbortError') {
        return { ok: false, kind: 'timeout' };
      }
      return { ok: false, kind: 'no-connection' };
    } finally {
      clearTimeout(timer);
    }
  }

  async function testConnection(connection: Connection): Promise<TestConnectionResult> {
    const result = await check(
      { address: 'https://example.com/', signals: { ...NO_SIGNALS } },
      connection,
      5000,
    );
    return result.ok ? { ok: true } : { ok: false, kind: result.kind };
  }

  return { check, testConnection };
}
