import { displayAddress, isCheckableAddress, limitAddress, stripAddress } from './address';
import { MAX_ADDRESS_LENGTH } from '../shared/types';

describe('stripAddress (BR1.3, AC1.1.3, AC1.1.4)', () => {
  it('removes the query string and the fragment', () => {
    expect(stripAddress('https://example.com/page?token=abc&x=1#section')).toBe(
      'https://example.com/page',
    );
  });

  it('removes the user name and password', () => {
    expect(stripAddress('https://alice:secret@example.com/login')).toBe(
      'https://example.com/login',
    );
  });

  it('keeps the port and path', () => {
    expect(stripAddress('http://example.com:8080/a/b')).toBe('http://example.com:8080/a/b');
  });

  it('lets the browser parser handle odd characters', () => {
    const stripped = stripAddress('https://example.com/a b/<script>?q=1');
    expect(stripped).toBe('https://example.com/a%20b/%3Cscript%3E');
    expect(stripped).not.toContain('<');
  });

  it('reduces non-web addresses to their scheme so nothing they carry is kept', () => {
    expect(stripAddress('chrome://settings/passwords')).toBe('chrome:');
    expect(stripAddress('data:text/html,<p>private</p>')).toBe('data:');
    expect(stripAddress('file:///C:/Users/me/secret.txt')).toBe('file:');
  });

  it('gives an empty text for an address that cannot be parsed', () => {
    expect(stripAddress('not an address')).toBe('');
    expect(stripAddress('')).toBe('');
  });
});

describe('isCheckableAddress (BR5.3, AC4.2.1, AC4.2.2)', () => {
  it('accepts http and https pages', () => {
    expect(isCheckableAddress('https://example.com/')).toBe(true);
    expect(isCheckableAddress('http://example.com/x')).toBe(true);
  });

  it.each(['chrome:', 'edge:', 'file:', 'data:', 'about:', 'chrome-extension:', ''])(
    'refuses %p',
    (address) => {
      expect(isCheckableAddress(address)).toBe(false);
    },
  );

  it('refuses the Chrome Web Store and Edge Add-ons sites', () => {
    expect(isCheckableAddress('https://chromewebstore.google.com/detail/abc')).toBe(false);
    expect(isCheckableAddress('https://chrome.google.com/webstore/detail/abc')).toBe(false);
    expect(isCheckableAddress('https://microsoftedge.microsoft.com/addons/detail/abc')).toBe(false);
  });

  it('still checks other pages on the same hosts', () => {
    expect(isCheckableAddress('https://chrome.google.com/intl/en/chrome/')).toBe(true);
    expect(isCheckableAddress('https://microsoftedge.microsoft.com/welcome')).toBe(true);
  });
});

describe('limitAddress and displayAddress', () => {
  it('cuts a very long address to the allowed length', () => {
    const long = `https://example.com/${'a'.repeat(5000)}`;
    expect(limitAddress(long)).toHaveLength(MAX_ADDRESS_LENGTH);
    expect(limitAddress('https://example.com/')).toBe('https://example.com/');
  });

  it('shows the host when there is one', () => {
    expect(displayAddress('https://example.com:8080/a')).toBe('example.com:8080');
    expect(displayAddress('chrome:')).toBe('chrome:');
    expect(displayAddress('')).toBe('');
  });
});
