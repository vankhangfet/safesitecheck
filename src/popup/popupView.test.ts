/** @jest-environment jsdom */
import popupHtml from './popup.html';
import { initPopup, type PopupApi } from './popupView';
import { createPopupApi } from './popupApi';
import type { VisitSnapshot } from '../shared/contracts';
import { byTestId, flush, mountPage, tabOrder } from '../test-support/dom';

const verdict = (overrides: Partial<VisitSnapshot> = {}): VisitSnapshot => ({
  visitId: 'visit-1',
  tabId: 4,
  address: 'https://example.com/login',
  state: 'verdict',
  label: 'safe',
  reasonShort: 'This looks like a normal website.',
  ...overrides,
});

function makeApi(snapshot: VisitSnapshot | null, tabId: number | null = 4) {
  let push: (snapshot: VisitSnapshot) => void = () => undefined;
  const api: PopupApi & { recheck: jest.Mock; openSettings: jest.Mock } = {
    getActiveTabId: async () => tabId ?? undefined,
    getSnapshot: async () => snapshot,
    recheck: jest.fn(async () => undefined),
    openSettings: jest.fn(),
    onUpdate: (listener) => {
      push = listener;
    },
  };
  return { api, push: (s: VisitSnapshot) => push(s) };
}

async function open(snapshot: VisitSnapshot | null, tabId: number | null = 4) {
  mountPage(popupHtml);
  const made = makeApi(snapshot, tabId);
  await initPopup(document, made.api);
  return made;
}

const text = (id: string): string => byTestId(id).textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('popup states (BR4.4, AC2.2.1)', () => {
  it.each([
    ['safe', 'OK', 'Safe'],
    ['suspicious', '?', 'Suspicious'],
    ['dangerous', '!', 'Dangerous'],
    ['could-not-check', '-', 'Could not check'],
  ] as const)('shows %s with its own symbol and word', async (label, symbol, word) => {
    await open(verdict({ label }));
    expect(text('popup-verdict')).toBe(`${symbol} ${word}`);
    expect(text('popup-reason')).toBe('This looks like a normal website.');
    expect(text('popup-page')).toBe('example.com');
  });

  it('shows a checking state with a status message and no reason', async () => {
    await open(verdict({ state: 'checking', label: undefined, reasonShort: undefined }));
    expect(text('popup-verdict')).toBe('... Checking');
    expect(text('popup-note')).toMatch(/Checking this page/);
    expect(byTestId('popup-reason').closest('p')?.hidden).toBe(true);
  });

  it('shows the reason in plain words for a page that cannot be checked (AC4.2.3)', async () => {
    await open(
      verdict({
        label: 'could-not-check',
        failureKind: 'unsupported-page',
        reasonShort: 'This page cannot be checked.',
        address: 'chrome:',
      }),
    );
    expect(text('popup-reason')).toBe('This page cannot be checked.');
    expect(text('popup-page')).toBe('chrome:');
  });

  it('shows a hint when there is no page yet', async () => {
    await open(null);
    expect(text('popup-note')).toMatch(/Open a web page/);
    expect(byTestId('popup-verdict').hidden).toBe(true);
    expect((byTestId('popup-check-again-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the hint when the active tab is unknown', async () => {
    await open(verdict(), null);
    expect(text('popup-note')).toMatch(/Open a web page/);
  });
});

describe('Show more (BR4.4, AC2.2.1)', () => {
  it('is offered only when there is more, and expands and collapses', async () => {
    await open(verdict({ label: 'dangerous', reasonMore: 'The page asks for a password.' }));
    const toggle = byTestId<HTMLButtonElement>('popup-show-more-button');
    const more = byTestId('popup-reason-more');
    expect(toggle.hidden).toBe(false);
    expect(more.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(more.hidden).toBe(false);
    expect(more.textContent).toBe('The page asks for a password.');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Show less');
    toggle.click();
    expect(more.hidden).toBe(true);
  });

  it('is not offered when there is nothing more', async () => {
    await open(verdict());
    expect(byTestId('popup-show-more-button').hidden).toBe(true);
  });

  it("keeps the person's choice when the same page is updated, and resets for a new page", async () => {
    const { push } = await open(verdict({ label: 'dangerous', reasonMore: 'More.' }));
    byTestId('popup-show-more-button').click();
    push(verdict({ label: 'dangerous', reasonMore: 'More.' }));
    expect(byTestId('popup-reason-more').hidden).toBe(false);
    push(verdict({ visitId: 'visit-2', label: 'dangerous', reasonMore: 'Other.' }));
    expect(byTestId('popup-reason-more').hidden).toBe(true);
  });
});

describe('actions (BR4.5, W2)', () => {
  it('asks to check the current visit again', async () => {
    const { api } = await open(verdict());
    byTestId('popup-check-again-button').click();
    expect(api.recheck).toHaveBeenCalledWith(4, 'visit-1');
  });

  it('opens the settings page', async () => {
    const { api } = await open(verdict());
    byTestId('popup-settings-link').click();
    expect(api.openSettings).toHaveBeenCalledTimes(1);
  });

  it('shows updates pushed for this tab and drops those for other tabs', async () => {
    const { push } = await open(
      verdict({ state: 'checking', label: undefined, reasonShort: undefined }),
    );
    push(verdict({ tabId: 99, label: 'dangerous' }));
    expect(text('popup-verdict')).toBe('... Checking');
    push(verdict({ label: 'suspicious', reasonShort: 'Take care.' }));
    expect(text('popup-verdict')).toBe('? Suspicious');
    expect(text('popup-reason')).toBe('Take care.');
  });
});

describe('accessibility (NFR4.1, NFR4.2, AC2.1.3)', () => {
  it('puts the verdict in a polite live region', async () => {
    await open(verdict());
    const live = byTestId('popup-status');
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.contains(byTestId('popup-verdict'))).toBe(true);
    expect(live.contains(byTestId('popup-reason'))).toBe(true);
  });

  it('starts with focus on Check again and tabs through Show more, Check again, Settings', async () => {
    await open(verdict({ reasonMore: 'More.' }));
    expect(document.activeElement).toBe(byTestId('popup-check-again-button'));
    expect(tabOrder()).toEqual([
      'popup-show-more-button',
      'popup-check-again-button',
      'popup-settings-link',
    ]);
  });

  it('uses native buttons, a title heading and a verdict heading', async () => {
    await open(verdict());
    expect(document.querySelector('h1')?.textContent).toBe('Phishing Guard');
    expect(byTestId('popup-verdict').tagName).toBe('H2');
    for (const id of [
      'popup-check-again-button',
      'popup-settings-link',
      'popup-show-more-button',
    ]) {
      expect(byTestId(id).tagName).toBe('BUTTON');
    }
  });

  it('hides the symbol from screen readers, so the word carries the meaning', async () => {
    await open(verdict({ label: 'dangerous' }));
    expect(document.getElementById('symbol')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('createPopupApi', () => {
  function fakeChrome(overrides: { reply?: unknown } = {}) {
    let listener: (message: unknown, sender: { id?: string; tab?: object }) => void = () =>
      undefined;
    const sent: unknown[] = [];
    const api = {
      runtime: {
        id: 'ext-id',
        sendMessage: async (message: unknown) => {
          sent.push(message);
          return overrides.reply;
        },
        openOptionsPage: jest.fn(async () => undefined),
        onMessage: { addListener: (l: typeof listener) => (listener = l) },
      },
      tabs: { query: async () => [{ id: 12 }] },
    } as unknown as typeof chrome;
    return { api, sent, emit: (m: unknown, s: { id?: string; tab?: object }) => listener(m, s) };
  }

  it('finds the active tab and asks the background for its state', async () => {
    const { api, sent } = fakeChrome({ reply: verdict({ tabId: 12 }) });
    const popup = createPopupApi(api);
    expect(await popup.getActiveTabId()).toBe(12);
    expect(await popup.getSnapshot(12)).toMatchObject({ tabId: 12, label: 'safe' });
    expect(sent).toEqual([{ type: 'verdict/get', tabId: 12 }]);
  });

  it('gives null for an answer that is not a verdict state', async () => {
    expect(await createPopupApi(fakeChrome({ reply: 'nonsense' }).api).getSnapshot(1)).toBeNull();
    expect(await createPopupApi(fakeChrome({ reply: undefined }).api).getSnapshot(1)).toBeNull();
  });

  it('sends Check again and opens Settings', async () => {
    const { api, sent } = fakeChrome();
    const popup = createPopupApi(api);
    await popup.recheck(3, 'v1');
    popup.openSettings();
    expect(sent).toEqual([{ type: 'verdict/recheck', tabId: 3, visitId: 'v1' }]);
    expect(api.runtime.openOptionsPage).toHaveBeenCalled();
  });

  it('accepts updates only from the extension background', async () => {
    const { api, emit } = fakeChrome();
    const seen: VisitSnapshot[] = [];
    createPopupApi(api).onUpdate((s) => seen.push(s));
    const update = { type: 'verdict/updated', ...verdict() };
    emit(update, { id: 'ext-id' });
    emit(update, { id: 'other-extension' });
    emit(update, { id: 'ext-id', tab: { id: 1 } });
    emit({ type: 'something-else' }, { id: 'ext-id' });
    emit({ type: 'verdict/updated', visitId: 5 }, { id: 'ext-id' });
    emit(null, { id: 'ext-id' });
    await flush();
    expect(seen).toHaveLength(1);
    expect(seen[0].visitId).toBe('visit-1');
  });
});
