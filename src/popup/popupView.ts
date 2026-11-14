import { displayAddress } from '../core/address';
import type { VisitSnapshot } from '../shared/contracts';
import type { VerdictLabel } from '../shared/types';

export interface PopupApi {
  getActiveTabId(): Promise<number | undefined>;
  getSnapshot(tabId: number): Promise<VisitSnapshot | null>;
  recheck(tabId: number, visitId: string): Promise<void>;
  openSettings(): void;
  onUpdate(listener: (snapshot: VisitSnapshot) => void): void;
}

type ShownState = 'checking' | VerdictLabel;

const LABELS: Record<ShownState, string> = {
  checking: 'Checking',
  safe: 'Safe',
  suspicious: 'Suspicious',
  dangerous: 'Dangerous',
  'could-not-check': 'Could not check',
};

/** Each state has its own symbol as text, so colour is never the only signal (AC2.1.1). */
const SYMBOLS: Record<ShownState, string> = {
  checking: '...',
  safe: 'OK',
  suspicious: '?',
  dangerous: '!',
  'could-not-check': '-',
};

function element<T extends HTMLElement>(doc: Document, id: string): T {
  const found = doc.getElementById(id);
  if (!found) throw new Error(`popup page is missing #${id}`);
  return found as T;
}

/** The popup (BR4.4): verdict, short reason with Show more, Check again and Settings. */
export async function initPopup(doc: Document, api: PopupApi): Promise<void> {
  const verdict = element<HTMLElement>(doc, 'verdict');
  const symbol = element<HTMLElement>(doc, 'symbol');
  const label = element<HTMLElement>(doc, 'label');
  const note = element<HTMLElement>(doc, 'note');
  const pageRow = element<HTMLElement>(doc, 'page-row');
  const page = element<HTMLElement>(doc, 'page');
  const reasonRow = element<HTMLElement>(doc, 'reason-row');
  const reason = element<HTMLElement>(doc, 'reason');
  const more = element<HTMLElement>(doc, 'more');
  const showMore = element<HTMLButtonElement>(doc, 'show-more');
  const checkAgain = element<HTMLButtonElement>(doc, 'check-again');
  const settingsLink = element<HTMLButtonElement>(doc, 'settings-link');

  const tabId = await api.getActiveTabId();
  let current: VisitSnapshot | null = null;
  let expanded = false;

  function setExpanded(next: boolean): void {
    expanded = next;
    more.hidden = !next;
    showMore.setAttribute('aria-expanded', String(next));
    showMore.textContent = next ? 'Show less' : 'Show more';
  }

  function render(snapshot: VisitSnapshot | null): void {
    const previousVisit = current?.visitId;
    current = snapshot;
    if (!snapshot) {
      verdict.hidden = true;
      pageRow.hidden = true;
      reasonRow.hidden = true;
      showMore.hidden = true;
      more.hidden = true;
      note.textContent = 'Open a web page to see its check here.';
      checkAgain.disabled = true;
      return;
    }
    checkAgain.disabled = false;
    const shown: ShownState =
      snapshot.state === 'checking' ? 'checking' : (snapshot.label ?? 'could-not-check');
    verdict.hidden = false;
    symbol.textContent = SYMBOLS[shown];
    label.textContent = LABELS[shown];
    page.textContent = displayAddress(snapshot.address);
    pageRow.hidden = snapshot.address === '';
    if (shown === 'checking') {
      note.textContent = 'Checking this page. This takes a few seconds.';
      reasonRow.hidden = true;
      showMore.hidden = true;
      more.hidden = true;
      return;
    }
    note.textContent = '';
    reasonRow.hidden = false;
    reason.textContent = snapshot.reasonShort ?? '';
    const hasMore = Boolean(snapshot.reasonMore);
    more.textContent = snapshot.reasonMore ?? '';
    showMore.hidden = !hasMore;
    // A new page starts collapsed; an update for the same page keeps what the person chose.
    if (!hasMore || previousVisit !== snapshot.visitId) setExpanded(false);
    else setExpanded(expanded);
  }

  showMore.addEventListener('click', () => setExpanded(!expanded));
  checkAgain.addEventListener('click', () => {
    if (tabId !== undefined && current) void api.recheck(tabId, current.visitId);
  });
  settingsLink.addEventListener('click', () => api.openSettings());

  api.onUpdate((snapshot) => {
    // Updates for other tabs are dropped.
    if (tabId === undefined || snapshot.tabId !== tabId) return;
    render(snapshot);
  });

  render(tabId === undefined ? null : await api.getSnapshot(tabId));
  checkAgain.focus();
}
