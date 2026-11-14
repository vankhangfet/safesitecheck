/**
 * Browser-facing shapes used by the background process, and the small helpers that adapt the
 * real `chrome` object to them. Tests pass in-memory fakes with the same shapes.
 */

export interface StorageArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export interface PermissionsApi {
  contains(query: { origins: string[] }): Promise<boolean>;
  request(query: { origins: string[] }): Promise<boolean>;
}

/** Wraps a browser storage area so the rest of the code sees only the three calls it needs. */
export function wrapStorageArea(area: chrome.storage.StorageArea): StorageArea {
  return {
    get: (keys) => area.get(keys),
    set: (items) => area.set(items),
    remove: (keys) => area.remove(keys),
  };
}

export function wrapPermissions(permissions: typeof chrome.permissions): PermissionsApi {
  return {
    contains: (query) => permissions.contains(query),
    request: (query) => permissions.request(query),
  };
}
