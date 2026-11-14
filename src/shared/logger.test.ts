import { consoleSink, createLogger, type LogSink } from './logger';
import { parseBackgroundMessage, parseCollectSignalsMessage } from './contracts';
import type { FailureKind } from './types';

function recordingSink(): { sink: LogSink; lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    sink: { warn: (m) => lines.push(`warn:${m}`), debug: (m) => lines.push(`debug:${m}`) },
  };
}

describe('logger (NFR2.4, NFR2.8)', () => {
  it('writes an error kind and nothing else', () => {
    const { sink, lines } = recordingSink();
    createLogger(sink).error('timeout');
    expect(lines).toEqual(['warn:error timeout']);
  });

  it('ignores a kind that is not in the closed list', () => {
    const { sink, lines } = recordingSink();
    createLogger(sink).error('https://example.com/secret' as unknown as FailureKind);
    expect(lines).toEqual([]);
  });

  it('writes timings and steps only when debug is on', () => {
    const { sink, lines } = recordingSink();
    let debug = false;
    const logger = createLogger(sink, () => debug);
    logger.timing(120.4);
    logger.step('visit-started');
    expect(lines).toEqual([]);
    debug = true;
    logger.timing(120.4);
    logger.timing(Number.NaN);
    logger.step('visit-started');
    expect(lines).toEqual(['debug:timing 120', 'debug:step visit-started']);
  });
});

describe('console sink', () => {
  it('writes through the console with a fixed prefix', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    consoleSink.warn('error timeout');
    consoleSink.debug('step visit-started');
    expect(warn).toHaveBeenCalledWith('[Phishing Guard] error timeout');
    expect(debug).toHaveBeenCalledWith('[Phishing Guard] step visit-started');
    warn.mockRestore();
    debug.mockRestore();
  });
});

describe('message parsing (security design: messages are validated)', () => {
  it('accepts the three background messages', () => {
    expect(parseBackgroundMessage({ type: 'content/ready', extra: 1 })).toEqual({
      type: 'content/ready',
    });
    expect(parseBackgroundMessage({ type: 'verdict/get', tabId: 4 })).toEqual({
      type: 'verdict/get',
      tabId: 4,
    });
    expect(parseBackgroundMessage({ type: 'verdict/recheck', tabId: 4, visitId: 'v' })).toEqual({
      type: 'verdict/recheck',
      tabId: 4,
      visitId: 'v',
    });
  });

  it('rejects unknown, malformed or incomplete messages', () => {
    expect(parseBackgroundMessage(null)).toBeNull();
    expect(parseBackgroundMessage({ type: 'settings/read' })).toBeNull();
    expect(parseBackgroundMessage({ type: 'verdict/get', tabId: 'x' })).toBeNull();
    expect(parseBackgroundMessage({ type: 'verdict/recheck', tabId: 1 })).toBeNull();
  });

  it('parses the collect request for the page-side collector', () => {
    expect(parseCollectSignalsMessage({ type: 'signals/collect', visitId: 'v1' })).toEqual({
      type: 'signals/collect',
      visitId: 'v1',
    });
    expect(parseCollectSignalsMessage({ type: 'signals/collect' })).toBeNull();
    expect(parseCollectSignalsMessage('collect')).toBeNull();
  });
});
