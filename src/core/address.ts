import { MAX_ADDRESS_LENGTH } from '../shared/types';

/**
 * Removes the query string, the fragment and any login details (BR1.3). Addresses that are not
 * web addresses are reduced to their scheme (for example "chrome:") so nothing they carry is
 * kept. An address the browser cannot parse gives an empty text.
 */
export function stripAddress(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return '';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return url.protocol;
  return `${url.protocol}//${url.host}${url.pathname}`;
}

/** Store sites cannot be checked (BR5.3). */
function isStoreAddress(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host === 'chromewebstore.google.com') return true;
  if (host === 'chrome.google.com') return url.pathname.startsWith('/webstore');
  if (host === 'microsoftedge.microsoft.com') return url.pathname.startsWith('/addons');
  return false;
}

/** Checkable only for http and https addresses outside the store sites (BR5.3). */
export function isCheckableAddress(strippedAddress: string): boolean {
  let url: URL;
  try {
    url = new URL(strippedAddress);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return !isStoreAddress(url);
}

/** Cuts the address to the length allowed in a request (security design). */
export function limitAddress(address: string): string {
  return address.length > MAX_ADDRESS_LENGTH ? address.slice(0, MAX_ADDRESS_LENGTH) : address;
}

/** The part shown to the person: the host when there is one, else the address as stored. */
export function displayAddress(strippedAddress: string): string {
  try {
    const url = new URL(strippedAddress);
    return url.host || strippedAddress;
  } catch {
    return strippedAddress;
  }
}
