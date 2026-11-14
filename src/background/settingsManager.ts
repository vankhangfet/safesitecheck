import type { PermissionsApi, StorageArea } from '../shared/browser';
import type { ConnectionProvider, ConnectionResult } from '../shared/contracts';
import {
  DEFAULT_JEV_ADDRESS,
  DEFAULT_MODEL_NAME,
  isSourceName,
  type Settings,
  type SourceName,
} from '../shared/types';

const SETTINGS_KEY = 'settings';
const KEY_STORAGE_KEY = 'jevKey';
const MAX_KEY_LENGTH = 512;
const MAX_MODEL_NAME_LENGTH = 100;

/** Sources that cannot be used without a key. OpenJev's need is confirmed by u4. */
const SOURCES_NEEDING_KEY: readonly SourceName[] = ['jev'];

export type AddressCheck = { ok: true; address: string | undefined } | { ok: false; error: string };

/**
 * Accepts an empty address (the default applies) or a secure web address without login details,
 * query string or fragment. Returns the address without a trailing slash (BR6.6, BR6.8).
 */
export function validateServerAddress(input: string): AddressCheck {
  const text = input.trim();
  if (text === '') return { ok: true, address: undefined };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return {
      ok: false,
      error:
        'Enter a full web address that starts with https://, for example https://api.typesafe.ai.',
    };
  }
  if (url.protocol !== 'https:') {
    return {
      ok: false,
      error:
        'The server address must start with https:// so the key is sent over a secure connection.',
    };
  }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, error: 'Remove the user name and password from the server address.' };
  }
  if (url.search !== '' || url.hash !== '') {
    return { ok: false, error: 'Remove everything after the address, such as ? or # parts.' };
  }
  return { ok: true, address: `${url.origin}${url.pathname.replace(/\/+$/, '')}` };
}

/** The permission pattern for one server address, for that address only (security design). */
export function originPattern(address: string): string {
  return `${new URL(address).origin}/*`;
}

export interface SettingsInput {
  source: SourceName;
  serverAddress: string;
  /** Undefined keeps the saved key, an empty text removes it, any other text replaces it. */
  key?: string;
  debug?: boolean;
}

export type SaveField = 'source' | 'serverAddress' | 'key' | 'storage';

export type SaveResult =
  | { ok: true; settings: Settings }
  | {
      ok: false;
      field: SaveField;
      kind: 'invalid' | 'permission-denied' | 'storage';
      message: string;
    };

export interface SettingsManager extends ConnectionProvider {
  load(): Promise<Settings>;
  save(input: SettingsInput): Promise<SaveResult>;
}

export function effectiveAddress(settings: Settings): string | undefined {
  if (settings.serverAddress) return settings.serverAddress;
  return (settings.source ?? 'jev') === 'jev' ? DEFAULT_JEV_ADDRESS : undefined;
}

function isPlainKey(text: string): boolean {
  return text.length > 0 && text.length <= MAX_KEY_LENGTH && /^[\x21-\x7e]+$/.test(text);
}

/**
 * The only component that reads the key (NFR2.2). It stays in extension-private storage and is
 * handed out inside one connection result for one request.
 */
export function createSettingsManager(deps: {
  storage: StorageArea;
  permissions: PermissionsApi;
}): SettingsManager {
  const { storage, permissions } = deps;

  async function load(): Promise<Settings> {
    let stored: Record<string, unknown> = {};
    try {
      stored = await storage.get([SETTINGS_KEY, KEY_STORAGE_KEY]);
    } catch {
      // Storage unavailable: fall back to defaults; checks will say the key is missing.
    }
    const raw = (stored[SETTINGS_KEY] ?? {}) as Record<string, unknown>;
    const address =
      typeof raw.serverAddress === 'string' ? validateServerAddress(raw.serverAddress) : undefined;
    const modelName =
      typeof raw.modelName === 'string' &&
      raw.modelName.length > 0 &&
      raw.modelName.length <= MAX_MODEL_NAME_LENGTH
        ? raw.modelName
        : DEFAULT_MODEL_NAME;
    const key = stored[KEY_STORAGE_KEY];
    return {
      source: isSourceName(raw.source) ? raw.source : undefined,
      serverAddress: address && address.ok ? address.address : undefined,
      modelName,
      keyPresent: typeof key === 'string' && key.length > 0,
      debug: raw.debug === true,
    };
  }

  async function save(input: SettingsInput): Promise<SaveResult> {
    if (!isSourceName(input.source)) {
      return { ok: false, field: 'source', kind: 'invalid', message: 'Choose a verdict source.' };
    }
    const address = validateServerAddress(input.serverAddress);
    if (!address.ok) {
      return { ok: false, field: 'serverAddress', kind: 'invalid', message: address.error };
    }
    if (input.key !== undefined && input.key !== '' && !isPlainKey(input.key.trim())) {
      return {
        ok: false,
        field: 'key',
        kind: 'invalid',
        message: 'The key has characters that are not allowed. Paste it again without spaces.',
      };
    }

    const target = address.address ?? (input.source === 'jev' ? DEFAULT_JEV_ADDRESS : undefined);
    let permissionGranted = true;
    if (target !== undefined) {
      const query = { origins: [originPattern(target)] };
      try {
        permissionGranted =
          (await permissions.contains(query)) || (await permissions.request(query));
      } catch {
        permissionGranted = false;
      }
    }

    try {
      const current = await load();
      const record = {
        source: input.source,
        // An address the browser would not allow is not made active (reliability design).
        serverAddress: permissionGranted ? address.address : undefined,
        modelName: current.modelName,
        debug: input.debug ?? current.debug,
      };
      await storage.set({ [SETTINGS_KEY]: record });
      if (input.key === '') await storage.remove(KEY_STORAGE_KEY);
      else if (input.key !== undefined) await storage.set({ [KEY_STORAGE_KEY]: input.key.trim() });
    } catch {
      return {
        ok: false,
        field: 'storage',
        kind: 'storage',
        message: 'The settings could not be saved. Try again.',
      };
    }

    if (!permissionGranted) {
      return {
        ok: false,
        field: 'serverAddress',
        kind: 'permission-denied',
        message:
          'The browser needs your permission to contact this address. Save again and allow it.',
      };
    }
    return { ok: true, settings: await load() };
  }

  async function getConnection(): Promise<ConnectionResult> {
    const settings = await load();
    const source = settings.source ?? 'jev';
    let key: string | undefined;
    try {
      const stored = await storage.get(KEY_STORAGE_KEY);
      key =
        typeof stored[KEY_STORAGE_KEY] === 'string'
          ? (stored[KEY_STORAGE_KEY] as string)
          : undefined;
    } catch {
      key = undefined;
    }
    if (SOURCES_NEEDING_KEY.includes(source) && !key) return { ok: false, kind: 'missing-key' };
    const serverAddress = effectiveAddress({ ...settings, source });
    if (!serverAddress) return { ok: false, kind: 'missing-address' };
    try {
      if (!(await permissions.contains({ origins: [originPattern(serverAddress)] }))) {
        return { ok: false, kind: 'permission-denied' };
      }
    } catch {
      return { ok: false, kind: 'permission-denied' };
    }
    return {
      ok: true,
      connection: { source, serverAddress, key, modelName: settings.modelName },
    };
  }

  return { load, save, getConnection };
}
