import {
  createToolbarIcon,
  drawIcon,
  iconModel,
  type ActionApi,
  type IconCanvas,
} from './toolbarIcon';
import { createLogger } from '../shared/logger';
import type { VisitSnapshot } from '../shared/contracts';
import { fakeCanvas } from '../test-support/fakeEnv';

const base: VisitSnapshot = {
  visitId: 'v',
  tabId: 3,
  address: 'https://example.com/',
  state: 'verdict',
};

describe('iconModel (BR4.1, BR4.2, AC2.1.1, AC2.1.2, AC2.1.4)', () => {
  it('gives each state its own badge text, so colour is never the only signal', () => {
    const models = [
      iconModel({ ...base, state: 'checking' }),
      iconModel({ ...base, label: 'safe' }),
      iconModel({ ...base, label: 'suspicious' }),
      iconModel({ ...base, label: 'dangerous' }),
      iconModel({ ...base, label: 'could-not-check', reasonShort: 'No answer came in time.' }),
    ];
    expect(models.map((m) => m.badgeText)).toEqual(['...', 'OK', '?', '!', '-']);
    expect(new Set(models.map((m) => m.badgeText)).size).toBe(5);
  });

  it('announces the verdict in the accessible name, with the reason for Could not check', () => {
    expect(iconModel({ ...base, label: 'dangerous' }).title).toBe('Phishing Guard: Dangerous');
    expect(iconModel({ ...base, state: 'checking' }).title).toBe('Phishing Guard: Checking');
    expect(
      iconModel({ ...base, label: 'could-not-check', reasonShort: 'No answer came in time.' })
        .title,
    ).toBe('Phishing Guard: Could not check, No answer came in time.');
  });

  it('falls back to Could not check when a verdict has no label', () => {
    expect(iconModel(base).title).toBe('Phishing Guard: Could not check');
  });
});

describe('drawIcon', () => {
  it('draws a shield and the symbol, then reads the pixels', () => {
    const calls: string[] = [];
    const context = new Proxy(
      { getImageData: () => ({ width: 16, height: 16 }) as ImageData },
      {
        get: (target, key) =>
          key in target
            ? (target as Record<string, unknown>)[key as string]
            : (...args: unknown[]) => calls.push(`${String(key)}:${args.join(',')}`),
        set: (_t, key, value) => {
          calls.push(`set ${String(key)}=${String(value)}`);
          return true;
        },
      },
    ) as never;
    const canvas: IconCanvas = { getContext: () => context };
    drawIcon(canvas, 16, iconModel({ ...base, label: 'dangerous' }));
    expect(calls).toContain('set fillStyle=#c5221f');
    expect(calls.some((c) => c.startsWith('fillText:!'))).toBe(true);
    expect(calls.some((c) => c.startsWith('fill:'))).toBe(true);
  });

  it('fails clearly when there is no drawing surface', () => {
    expect(() => drawIcon({ getContext: () => null }, 16, iconModel(base))).toThrow(
      /drawing surface/,
    );
  });
});

describe('createToolbarIcon', () => {
  function actionRecorder(failing?: keyof ActionApi) {
    const calls: Array<{ call: string; details: Record<string, unknown> }> = [];
    const make = (name: keyof ActionApi) => async (details: Record<string, unknown>) => {
      calls.push({ call: name, details });
      if (failing === name) throw new Error('No tab with id');
    };
    const action = {
      setBadgeText: make('setBadgeText'),
      setBadgeBackgroundColor: make('setBadgeBackgroundColor'),
      setTitle: make('setTitle'),
      setIcon: make('setIcon'),
    } as unknown as ActionApi;
    return { action, calls };
  }
  const logLines: string[] = [];
  const logger = createLogger({ warn: (m) => logLines.push(m), debug: (m) => logLines.push(m) });

  beforeEach(() => {
    logLines.length = 0;
  });

  it('sets the badge, colour, name and drawn icon for the tab', async () => {
    const { action, calls } = actionRecorder();
    await createToolbarIcon({ action, createCanvas: () => fakeCanvas(), logger }).update({
      ...base,
      label: 'suspicious',
    });
    expect(calls.map((c) => c.call).sort()).toEqual(
      ['setBadgeBackgroundColor', 'setBadgeText', 'setIcon', 'setTitle'].sort(),
    );
    expect(calls.every((c) => c.details.tabId === 3)).toBe(true);
    const icon = calls.find((c) => c.call === 'setIcon')?.details.imageData as Record<
      number,
      unknown
    >;
    expect(Object.keys(icon)).toEqual(['16', '32']);
    expect(logLines).toEqual([]);
  });

  it('still sets the badge and name when drawing fails, and logs only an error kind', async () => {
    const { action, calls } = actionRecorder();
    await createToolbarIcon({
      action,
      createCanvas: () => ({ getContext: () => null }),
      logger,
    }).update({
      ...base,
      label: 'safe',
    });
    expect(calls.map((c) => c.call)).not.toContain('setIcon');
    expect(calls.map((c) => c.call)).toContain('setTitle');
    expect(logLines).toEqual(['error internal-error']);
  });

  it('leaves the previous state and logs an error kind when the browser refuses (closed tab)', async () => {
    const { action } = actionRecorder('setTitle');
    await expect(
      createToolbarIcon({ action, createCanvas: () => fakeCanvas(), logger }).update(base),
    ).resolves.toBeUndefined();
    expect(logLines).toEqual(['error internal-error']);
  });
});
