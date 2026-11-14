import {
  createSettingsManager,
  originPattern,
  validateServerAddress,
  type SettingsManager,
} from './settingsManager';
import {
  FAKE_KEY,
  createFakePermissions,
  createMemoryStorage,
  type FakePermissions,
  type MemoryStorage,
} from '../test-support/fakes';

function setup(grantOnRequest = true): {
  manager: SettingsManager;
  storage: MemoryStorage;
  permissions: FakePermissions;
} {
  const storage = createMemoryStorage();
  const permissions = createFakePermissions({ grantOnRequest });
  return { manager: createSettingsManager({ storage, permissions }), storage, permissions };
}

describe('validateServerAddress (BR6.6, BR6.8)', () => {
  it('accepts an empty address, meaning the default applies', () => {
    expect(validateServerAddress('  ')).toEqual({ ok: true, address: undefined });
  });

  it('accepts https and drops a trailing slash', () => {
    expect(validateServerAddress('https://example.com/')).toEqual({
      ok: true,
      address: 'https://example.com',
    });
    expect(validateServerAddress('https://example.com/api/')).toEqual({
      ok: true,
      address: 'https://example.com/api',
    });
  });

  it.each([
    ['http://example.com', /https/],
    ['example.com', /full web address/],
    ['https://user:pw@example.com', /user name/],
    ['https://example.com/a?b=1', /everything after/],
    ['https://example.com/#frag', /everything after/],
  ])('rejects %s with a message that names the fix', (input, message) => {
    const result = validateServerAddress(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });
});

describe('SettingsManager save and load (BR6.1, AC5.1.1)', () => {
  it('saves the source and address and loads them back', async () => {
    const { manager } = setup();
    const result = await manager.save({
      source: 'openjev',
      serverAddress: 'https://openjev.example.org',
      key: FAKE_KEY,
    });
    expect(result.ok).toBe(true);
    expect(await manager.load()).toEqual({
      source: 'openjev',
      serverAddress: 'https://openjev.example.org',
      modelName: 'jev-latest',
      keyPresent: true,
      debug: false,
    });
  });

  it('keeps the saved key when none is given and removes it with an empty text', async () => {
    const { manager } = setup();
    await manager.save({ source: 'jev', serverAddress: '', key: FAKE_KEY });
    await manager.save({ source: 'jev', serverAddress: '' });
    expect((await manager.load()).keyPresent).toBe(true);
    await manager.save({ source: 'jev', serverAddress: '', key: '' });
    expect((await manager.load()).keyPresent).toBe(false);
  });

  it('refuses an address that is not https and keeps old values', async () => {
    const { manager } = setup();
    await manager.save({ source: 'jev', serverAddress: 'https://one.example.com', key: FAKE_KEY });
    const result = await manager.save({ source: 'jev', serverAddress: 'http://two.example.com' });
    expect(result).toMatchObject({ ok: false, field: 'serverAddress', kind: 'invalid' });
    expect((await manager.load()).serverAddress).toBe('https://one.example.com');
  });

  it('refuses a key with spaces or control characters', async () => {
    const { manager } = setup();
    expect(
      await manager.save({ source: 'jev', serverAddress: '', key: 'two words' }),
    ).toMatchObject({
      ok: false,
      field: 'key',
    });
    expect(await manager.save({ source: 'jev', serverAddress: '', key: 'bad\nkey' })).toMatchObject(
      {
        ok: false,
        field: 'key',
      },
    );
  });

  it('validates the settings again on load (NFR2.7)', async () => {
    const storage = createMemoryStorage({
      settings: {
        source: 'weird',
        serverAddress: 'http://insecure.example.com',
        modelName: '',
        debug: 'yes',
      },
    });
    const manager = createSettingsManager({
      storage,
      permissions: createFakePermissions({ grantOnRequest: true }),
    });
    expect(await manager.load()).toEqual({
      source: undefined,
      serverAddress: undefined,
      modelName: 'jev-latest',
      keyPresent: false,
      debug: false,
    });
  });
});

describe('permission for the server address (NFR2.5)', () => {
  it('asks only for that address when saving', async () => {
    const { manager, permissions } = setup();
    await manager.save({
      source: 'jev',
      serverAddress: 'https://api.example.com/v2',
      key: FAKE_KEY,
    });
    expect(permissions.requests).toEqual([['https://api.example.com/*']]);
  });

  it('does not make the address active when the browser denies it', async () => {
    const { manager } = setup(false);
    const result = await manager.save({
      source: 'jev',
      serverAddress: 'https://api.example.com',
      key: FAKE_KEY,
    });
    expect(result).toMatchObject({ ok: false, field: 'serverAddress', kind: 'permission-denied' });
    expect((await manager.load()).serverAddress).toBeUndefined();
    expect(await manager.getConnection()).toEqual({ ok: false, kind: 'permission-denied' });
  });

  it('builds the pattern from the origin only', () => {
    expect(originPattern('https://api.example.com:8443/deep/path')).toBe(
      'https://api.example.com:8443/*',
    );
  });
});

describe('getConnection (contract C6, BR5.4, BR6.8)', () => {
  it('hands out the key with the default hosted address', async () => {
    const { manager } = setup();
    await manager.save({ source: 'jev', serverAddress: '', key: `  ${FAKE_KEY}  ` });
    expect(await manager.getConnection()).toEqual({
      ok: true,
      connection: {
        source: 'jev',
        serverAddress: 'https://api.typesafe.ai',
        key: FAKE_KEY,
        modelName: 'jev-latest',
      },
    });
  });

  it('reports a missing key before anything else', async () => {
    const { manager } = setup();
    expect(await manager.getConnection()).toEqual({ ok: false, kind: 'missing-key' });
  });

  it('reports a missing address for OpenJev with none saved', async () => {
    const { manager } = setup();
    await manager.save({ source: 'openjev', serverAddress: '', key: FAKE_KEY });
    expect(await manager.getConnection()).toEqual({ ok: false, kind: 'missing-address' });
  });

  it('treats unavailable storage as a missing key', async () => {
    const { manager, storage } = setup();
    await manager.save({ source: 'jev', serverAddress: '', key: FAKE_KEY });
    storage.failNext(2);
    expect(await manager.getConnection()).toEqual({ ok: false, kind: 'missing-key' });
  });

  it('reports a storage failure when saving', async () => {
    const { manager, storage } = setup();
    storage.failWrites();
    const result = await manager.save({ source: 'jev', serverAddress: '', key: FAKE_KEY });
    expect(result).toMatchObject({ ok: false, field: 'storage', kind: 'storage' });
  });
});

describe('the key never leaves (NFR2.2, BR6.3)', () => {
  it('is absent from the loaded settings, the save result and the console', async () => {
    const spies = (['log', 'warn', 'error', 'debug', 'info'] as const).map((name) =>
      jest.spyOn(console, name).mockImplementation(() => undefined),
    );
    const { manager } = setup();
    const saved = await manager.save({ source: 'jev', serverAddress: '', key: FAKE_KEY });
    const loaded = await manager.load();
    expect(JSON.stringify(saved)).not.toContain(FAKE_KEY);
    expect(JSON.stringify(loaded)).not.toContain(FAKE_KEY);
    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(FAKE_KEY);
      spy.mockRestore();
    }
  });
});
