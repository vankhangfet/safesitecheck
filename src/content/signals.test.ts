/** @jest-environment jsdom */
import { collectSignals, collectSignalsSafely } from './signals';

function page(html: string): Document {
  return new DOMParser().parseFromString(
    `<!doctype html><html><body>${html}</body></html>`,
    'text/html',
  );
}

describe('collectSignals (BR7.4, AC2.1)', () => {
  it('says yes to a password field', () => {
    expect(
      collectSignals(page('<form><input type="password" name="pw"></form>'), 'example.com'),
    ).toEqual({
      asksForPassword: true,
      asksForPaymentCard: false,
      formSendsToOtherSite: false,
    });
  });

  it('says yes to a card number field, by autocomplete or by its name', () => {
    expect(
      collectSignals(page('<input autocomplete="cc-number">'), 'example.com').asksForPaymentCard,
    ).toBe(true);
    expect(
      collectSignals(page('<input name="card_number" type="text">'), 'example.com')
        .asksForPaymentCard,
    ).toBe(true);
    expect(
      collectSignals(page('<input placeholder="Credit card">'), 'example.com').asksForPaymentCard,
    ).toBe(true);
  });

  it('does not take other fields for a card field', () => {
    const doc = page(
      '<input name="email"><input type="checkbox" name="card_number"><input name="discard-note">',
    );
    expect(collectSignals(doc, 'example.com').asksForPaymentCard).toBe(false);
  });

  it('says yes when a form sends to another website', () => {
    const doc = page('<form action="https://collector.evil.example/steal"><input name="q"></form>');
    expect(collectSignals(doc, 'example.com').formSendsToOtherSite).toBe(true);
  });

  it('says no for forms that stay on the site', () => {
    const doc = page(
      [
        '<base href="https://example.com/">',
        '<form action="/login"></form>',
        '<form action="https://example.com/search"></form>',
        '<form action="https://accounts.example.com/sign-in"></form>',
        '<form></form>',
        '<form action="javascript:void(0)"></form>',
        '<form action="http://[bad"></form>',
      ].join(''),
    );
    expect(collectSignals(doc, 'example.com').formSendsToOtherSite).toBe(false);
  });

  it('says no to everything on a page with none of the three', () => {
    expect(collectSignals(page('<p>Hello</p><input name="q">'), 'example.com')).toEqual({
      asksForPassword: false,
      asksForPaymentCard: false,
      formSendsToOtherSite: false,
    });
  });

  it('leaks nothing from the page: no text and no typed value reaches the result', () => {
    const doc = page(
      '<p>my secret diary</p><input type="password" value="hunter2"><input name="card_number" value="4111111111111111">',
    );
    const result = collectSignals(doc, 'example.com');
    expect(Object.keys(result).sort()).toEqual([
      'asksForPassword',
      'asksForPaymentCard',
      'formSendsToOtherSite',
    ]);
    const text = JSON.stringify(result);
    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('4111');
    expect(text).not.toContain('diary');
  });

  it('counts all three as no when the page cannot be read', () => {
    const broken = {
      querySelectorAll: () => {
        throw new Error('blocked');
      },
    } as unknown as Document;
    expect(collectSignalsSafely(broken, 'example.com')).toEqual({
      asksForPassword: false,
      asksForPaymentCard: false,
      formSendsToOtherSite: false,
    });
  });

  it('is fast on a large page (NFR3.3 starting check)', () => {
    const rows = Array.from({ length: 2000 }, (_, i) => `<div><input name="field${i}"></div>`).join(
      '',
    );
    const doc = page(rows);
    const started = performance.now();
    collectSignals(doc, 'example.com');
    expect(performance.now() - started).toBeLessThan(500);
  });
});
