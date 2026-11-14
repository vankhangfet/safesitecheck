/** @jest-environment jsdom */
import optionsHtml from './options.html';
import { initOptions } from './optionsView';
import { createSettingsManager } from '../background/settingsManager';
import type { SourceAdapter, TestConnectionResult } from '../shared/contracts';
import { byTestId, flush, mountPage, tabOrder } from '../test-support/dom';
import {
  FAKE_KEY,
  createFakePermissions,
  createMemoryStorage,
  type MemoryStorage,
} from '../test-support/fakes';

interface Page {
  storage: MemoryStorage;
  testConnection: jest.Mock<Promise<TestConnectionResult>, []>;
}

async function openSettings(
  options: {
    saved?: Record<string, unknown>;
    grant?: boolean;
    adapter?: boolean;
    alsoGranted?: string[];
  } = {},
): Promise<Page> {
  const { saved = {}, grant = true, adapter = true, alsoGranted = [] } = options;
  mountPage(optionsHtml);
  const storage = createMemoryStorage(saved);
  const permissions = createFakePermissions({ grantOnRequest: grant });
  permissions.granted.add('https://api.typesafe.ai/*');
  for (const origin of alsoGranted) permissions.granted.add(origin);
  const testConnection = jest.fn<Promise<TestConnectionResult>, []>(async () => ({ ok: true }));
  const jevAdapter: SourceAdapter = {
    check: async () => ({ ok: false, kind: 'internal-error' }),
    testConnection: testConnection as unknown as SourceAdapter['testConnection'],
  };
  await initOptions(document, {
    settings: createSettingsManager({ storage, permissions }),
    adapters: adapter ? { jev: jevAdapter } : {},
  });
  return { storage, testConnection };
}

const input = (id: string) => byTestId<HTMLInputElement>(id);
const text = (id: string): string => byTestId(id).textContent?.trim() ?? '';

async function type(id: string, value: string): Promise<void> {
  const field = input(id);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

async function press(id: string): Promise<void> {
  byTestId(id).click();
  await flush();
  await flush();
}

const SAVED = {
  settings: { source: 'jev', modelName: 'jev-latest', debug: false },
  jevKey: FAKE_KEY,
};

describe('first run (BR6.4, AC5.1.4)', () => {
  it('shows a short hint when nothing is saved', async () => {
    await openSettings();
    expect(byTestId('settings-first-run-hint').hidden).toBe(false);
    expect(text('settings-first-run-hint')).toMatch(/paste your Jev key/);
    expect(input('settings-source-jev-radio').checked).toBe(true);
  });

  it('hides the hint once something is saved', async () => {
    await openSettings({ saved: SAVED });
    expect(byTestId('settings-first-run-hint').hidden).toBe(true);
  });

  it('shows the address the key will be sent to, and keeps it in step with what is typed (BR6.8)', async () => {
    await openSettings();
    expect(text('settings-destination')).toBe('The key is sent only to: https://api.typesafe.ai');
    await type('settings-address-input', 'https://jev.example.org/');
    expect(text('settings-destination')).toBe('The key is sent only to: https://jev.example.org');
    await type('settings-address-input', 'http://insecure.example.org');
    expect(text('settings-destination')).toMatch(
      /will not be sent until the server address is fixed/,
    );
    input('settings-source-openjev-radio').click();
    await type('settings-address-input', '');
    expect(text('settings-destination')).toMatch(/Enter a server address/);
  });

  it('says what is sent for each check', async () => {
    await openSettings();
    expect(text('settings-notice')).toMatch(/without anything after a \? or #/);
    expect(text('settings-notice')).toMatch(/No page text and no typed values are sent/);
  });
});

describe('save (BR6.1, AC5.1.1 to AC5.1.3)', () => {
  it('saves the source, address and key, then says so and clears the key field', async () => {
    const { storage } = await openSettings();
    input('settings-source-openjev-radio').click();
    await type('settings-address-input', 'https://openjev.example.org');
    await type('settings-key-input', FAKE_KEY);
    await press('settings-save-button');
    expect(text('settings-status')).toBe('Saved.');
    expect(storage.data.get('jevKey')).toBe(FAKE_KEY);
    expect(storage.data.get('settings')).toMatchObject({
      source: 'openjev',
      serverAddress: 'https://openjev.example.org',
    });
    expect(input('settings-key-input').value).toBe('');
    expect(input('settings-key-input').placeholder).toMatch(/A key is saved/);
    expect(byTestId('settings-remove-key-button').hidden).toBe(false);
    expect(byTestId('settings-first-run-hint').hidden).toBe(true);
  });

  it('never fills the key field from storage, so the key does not appear on the page', async () => {
    await openSettings({ saved: SAVED });
    expect(input('settings-key-input').value).toBe('');
    expect(document.body.innerHTML).not.toContain(FAKE_KEY);
  });

  it('shows and hides the typed key', async () => {
    await openSettings();
    const toggle = byTestId('settings-key-toggle-button');
    expect(input('settings-key-input').type).toBe('password');
    toggle.click();
    expect(input('settings-key-input').type).toBe('text');
    expect(toggle.textContent).toBe('Hide');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    toggle.click();
    expect(input('settings-key-input').type).toBe('password');
  });

  it('removes the saved key', async () => {
    const { storage } = await openSettings({ saved: SAVED });
    await press('settings-remove-key-button');
    expect(storage.data.has('jevKey')).toBe(false);
    expect(text('settings-status')).toBe('The saved key was removed.');
    expect(byTestId('settings-remove-key-button').hidden).toBe(true);
  });

  it('saves the debug switch', async () => {
    const { storage } = await openSettings();
    input('settings-debug-checkbox').click();
    await press('settings-save-button');
    expect(storage.data.get('settings')).toMatchObject({ debug: true });
  });
});

describe('errors (BR6.6, AC5.2.2, AC5.2.3)', () => {
  it('names the address field and the fix, keeps what was typed and marks the field', async () => {
    const { storage } = await openSettings();
    await type('settings-address-input', 'http://insecure.example.org');
    await type('settings-key-input', FAKE_KEY);
    await press('settings-save-button');
    expect(text('settings-address-error')).toMatch(/start with https:\/\//);
    expect(input('settings-address-input').value).toBe('http://insecure.example.org');
    expect(input('settings-key-input').value).toBe(FAKE_KEY);
    expect(input('settings-address-input').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input('settings-address-input'));
    expect(text('settings-status')).toMatch(/Read the message next to the field/);
    expect(storage.data.has('jevKey')).toBe(false);
  });

  it('shows a key error beside the key field', async () => {
    await openSettings();
    await type('settings-key-input', 'two words');
    await press('settings-save-button');
    expect(text('settings-key-error')).toMatch(/not allowed/);
    expect(input('settings-key-input').getAttribute('aria-invalid')).toBe('true');
  });

  it('clears an old error on the next try', async () => {
    await openSettings();
    await type('settings-address-input', 'nope');
    await press('settings-save-button');
    expect(text('settings-address-error')).not.toBe('');
    await type('settings-address-input', 'https://ok.example.org');
    await press('settings-save-button');
    expect(text('settings-address-error')).toBe('');
    expect(input('settings-address-input').hasAttribute('aria-invalid')).toBe(false);
  });

  it('explains a permission the browser did not give, and keeps the typed address', async () => {
    await openSettings({ grant: false });
    await type('settings-address-input', 'https://openjev.example.org');
    await type('settings-key-input', FAKE_KEY);
    await press('settings-save-button');
    expect(text('settings-address-error')).toMatch(/needs your permission/);
    expect(input('settings-address-input').value).toBe('https://openjev.example.org');
  });

  it('reports a storage failure in the status line', async () => {
    const { storage } = await openSettings();
    storage.failWrites();
    await press('settings-save-button');
    expect(text('settings-status')).toBe('The settings could not be saved. Try again.');
  });

  it('describes every error in text and puts status and errors where screen readers read them', async () => {
    await openSettings();
    const status = byTestId('settings-status');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(input('settings-address-input').getAttribute('aria-describedby')).toContain(
      'address-error',
    );
    expect(input('settings-key-input').getAttribute('aria-describedby')).toContain('key-error');
  });

  it('labels every field and keeps the tab order in the visual order', async () => {
    await openSettings({ saved: SAVED });
    for (const id of ['key', 'server-address', 'source-jev', 'source-openjev', 'debug']) {
      expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
    expect(tabOrder()).toEqual([
      'settings-source-jev-radio',
      'settings-source-openjev-radio',
      'settings-key-input',
      'settings-key-toggle-button',
      'settings-remove-key-button',
      'settings-address-input',
      'settings-save-button',
      'settings-test-button',
      'settings-debug-checkbox',
    ]);
  });
});

describe('test connection (BR6.5, AC5.2.1)', () => {
  it('says it worked', async () => {
    const { testConnection } = await openSettings({ saved: SAVED });
    await press('settings-test-button');
    expect(testConnection).toHaveBeenCalledTimes(1);
    expect(text('settings-status')).toBe('The connection works. The server accepted the key.');
  });

  it('gives the reason when it fails', async () => {
    const { testConnection } = await openSettings({ saved: SAVED });
    testConnection.mockResolvedValueOnce({ ok: false, kind: 'rejected-key' });
    await press('settings-test-button');
    expect(text('settings-status')).toBe(
      'The connection failed. The key was not accepted. Check it in Settings.',
    );
  });

  it('says a key is missing instead of testing without one', async () => {
    const { testConnection } = await openSettings();
    await press('settings-test-button');
    expect(testConnection).not.toHaveBeenCalled();
    expect(text('settings-status')).toMatch(/A key is missing/);
  });

  it('shows the address error and keeps typed values when the address is invalid', async () => {
    const { testConnection } = await openSettings({ saved: SAVED });
    await type('settings-address-input', 'ftp://files.example.org');
    await press('settings-test-button');
    expect(testConnection).not.toHaveBeenCalled();
    expect(text('settings-address-error')).toMatch(/https/);
    expect(input('settings-address-input').value).toBe('ftp://files.example.org');
  });

  it('asks the person to save unsaved changes first', async () => {
    const { testConnection } = await openSettings({ saved: SAVED });
    await type('settings-key-input', 'a-new-fake-key');
    await press('settings-test-button');
    expect(testConnection).not.toHaveBeenCalled();
    expect(text('settings-status')).toMatch(/Press Save first/);
  });

  it('says so when the chosen source cannot be tested yet', async () => {
    await openSettings({
      saved: {
        settings: { source: 'openjev', serverAddress: 'https://o.example.org' },
        jevKey: FAKE_KEY,
      },
      alsoGranted: ['https://o.example.org/*'],
    });
    await press('settings-test-button');
    expect(text('settings-status')).toBe('Testing this source is not available yet.');
  });
});
