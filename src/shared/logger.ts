import type { FailureKind } from './types';
import { FAILURE_KINDS } from './types';

/** Steps that may be named in debug output (NFR2.9). No free text is possible. */
export type StepName =
  | 'visit-started'
  | 'signals-collected'
  | 'request-sent'
  | 'answer-shown'
  | 'visit-restored'
  | 'check-again';

export interface LogSink {
  warn(message: string): void;
  debug(message: string): void;
}

export interface Logger {
  /** Records an error kind from the closed list. */
  error(kind: FailureKind): void;
  /** Records a timing in milliseconds. */
  timing(milliseconds: number): void;
  /** Records a step name, only when the debug switch is on. */
  step(name: StepName): void;
}

/**
 * The only way anything is logged. It accepts an error kind, a number or a step name, so an
 * address, a signal or a key cannot be passed in (NFR2.4, NFR2.8).
 */
export function createLogger(sink: LogSink, isDebugOn: () => boolean = () => false): Logger {
  return {
    error(kind) {
      if (!(FAILURE_KINDS as readonly string[]).includes(kind)) return;
      sink.warn(`error ${kind}`);
    },
    timing(milliseconds) {
      if (!Number.isFinite(milliseconds)) return;
      if (isDebugOn()) sink.debug(`timing ${Math.round(milliseconds)}`);
    },
    step(name) {
      if (isDebugOn()) sink.debug(`step ${name}`);
    },
  };
}

export const consoleSink: LogSink = {
  warn: (message) => console.warn(`[Phishing Guard] ${message}`),
  debug: (message) => console.debug(`[Phishing Guard] ${message}`),
};
