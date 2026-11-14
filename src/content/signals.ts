import { NO_SIGNALS, type PageSignals } from '../shared/types';

/** Names that mark a card number field when the page gives no autocomplete hint. */
const CARD_FIELD_HINT =
  /(card.?(number|num|no\b)|cc.?(num|number)|credit.?card|cardnumber|ccnumber)/i;
const CARD_FIELD_TYPES = ['', 'text', 'tel', 'number'];

function isCardField(input: HTMLInputElement): boolean {
  const autocomplete = (input.getAttribute('autocomplete') ?? '').toLowerCase().split(/\s+/);
  if (autocomplete.includes('cc-number')) return true;
  if (!CARD_FIELD_TYPES.includes((input.getAttribute('type') ?? '').toLowerCase())) return false;
  // Only the field's own labels are read here, never what the person has typed into it.
  const hints = [
    input.getAttribute('name'),
    input.getAttribute('id'),
    input.getAttribute('aria-label'),
    input.getAttribute('placeholder'),
  ].join(' ');
  return CARD_FIELD_HINT.test(hints);
}

/** Two hosts belong to the same site when they match or one is a subdomain of the other. */
function isSameSite(a: string, b: string): boolean {
  const first = a.toLowerCase();
  const second = b.toLowerCase();
  return first === second || first.endsWith(`.${second}`) || second.endsWith(`.${first}`);
}

function sendsToOtherSite(form: HTMLFormElement, doc: Document, pageHost: string): boolean {
  const action = form.getAttribute('action');
  if (!action) return false;
  let target: URL;
  try {
    target = new URL(action, doc.baseURI);
  } catch {
    return false;
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
  return !isSameSite(target.hostname, pageHost);
}

/**
 * The three yes/no signals (contract C5, BR7.4). One pass over the page, once per visit. It reads
 * which kinds of fields exist and one form attribute; no page text and no field value is read.
 */
export function collectSignals(doc: Document, pageHost: string): PageSignals {
  const inputs = Array.from(doc.querySelectorAll('input'));
  return {
    asksForPassword: inputs.some(
      (input) => (input.getAttribute('type') ?? '').toLowerCase() === 'password',
    ),
    asksForPaymentCard: inputs.some(isCardField),
    formSendsToOtherSite: Array.from(doc.querySelectorAll('form')).some((form) =>
      sendsToOtherSite(form, doc, pageHost),
    ),
  };
}

/** A page that cannot be read counts as no for all three (functional spec). */
export function collectSignalsSafely(doc: Document, pageHost: string): PageSignals {
  try {
    return collectSignals(doc, pageHost);
  } catch {
    return { ...NO_SIGNALS };
  }
}
