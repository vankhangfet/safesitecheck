import { failureReason } from '../core/reasons';
import { validateServerAddress, type SettingsManager } from '../background/settingsManager';
import type { SourceAdapter } from '../shared/contracts';
import { DEFAULT_JEV_ADDRESS, isSourceName, type Settings, type SourceName } from '../shared/types';

export interface OptionsDeps {
  settings: Pick<SettingsManager, 'load' | 'save' | 'getConnection'>;
  adapters: Partial<Record<SourceName, SourceAdapter>>;
}

function element<T extends HTMLElement>(doc: Document, id: string): T {
  const found = doc.getElementById(id);
  if (!found) throw new Error(`settings page is missing #${id}`);
  return found as T;
}

/**
 * The settings page (W3). It runs in the extension's own page and talks to SettingsManager
 * directly, so the key never travels in a message. The key field is never filled from storage.
 */
export async function initOptions(doc: Document, deps: OptionsDeps): Promise<void> {
  const hint = element<HTMLElement>(doc, 'first-run-hint');
  const form = element<HTMLFormElement>(doc, 'settings-form');
  const radios: Record<SourceName, HTMLInputElement> = {
    jev: element<HTMLInputElement>(doc, 'source-jev'),
    openjev: element<HTMLInputElement>(doc, 'source-openjev'),
  };
  const key = element<HTMLInputElement>(doc, 'key');
  const keyToggle = element<HTMLButtonElement>(doc, 'key-toggle');
  const keyError = element<HTMLElement>(doc, 'key-error');
  const removeKey = element<HTMLButtonElement>(doc, 'remove-key');
  const address = element<HTMLInputElement>(doc, 'server-address');
  const addressError = element<HTMLElement>(doc, 'address-error');
  const destination = element<HTMLElement>(doc, 'destination');
  const debug = element<HTMLInputElement>(doc, 'debug');
  const test = element<HTMLButtonElement>(doc, 'test');
  const status = element<HTMLElement>(doc, 'status');

  let saved: Settings = await deps.settings.load();

  const selectedSource = (): SourceName => (radios.openjev.checked ? 'openjev' : 'jev');

  function showSaved(settings: Settings): void {
    saved = settings;
    removeKey.hidden = !settings.keyPresent;
    key.placeholder = settings.keyPresent ? 'A key is saved. Type a new one to replace it.' : '';
    hint.hidden = Boolean(settings.source || settings.serverAddress || settings.keyPresent);
  }

  function clearErrors(): void {
    for (const [field, error] of [
      [address, addressError],
      [key, keyError],
    ] as const) {
      error.textContent = '';
      field.removeAttribute('aria-invalid');
    }
  }

  function showError(field: HTMLInputElement, error: HTMLElement, message: string): void {
    error.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }

  /** The address the key will be sent to (BR6.8), kept in step with what is typed. */
  function updateDestination(): void {
    const checked = validateServerAddress(address.value);
    if (!checked.ok) {
      destination.textContent = 'The key will not be sent until the server address is fixed.';
      return;
    }
    const target =
      checked.address ?? (selectedSource() === 'jev' ? DEFAULT_JEV_ADDRESS : undefined);
    destination.textContent = target
      ? `The key is sent only to: ${target}`
      : 'Enter a server address. The key is not sent anywhere until you do.';
  }

  radios.jev.checked = (saved.source ?? 'jev') === 'jev';
  radios.openjev.checked = saved.source === 'openjev';
  address.value = saved.serverAddress ?? '';
  debug.checked = saved.debug;
  showSaved(saved);
  updateDestination();

  for (const control of [address, radios.jev, radios.openjev]) {
    control.addEventListener('input', updateDestination);
    control.addEventListener('change', updateDestination);
  }

  keyToggle.addEventListener('click', () => {
    const showing = key.type === 'text';
    key.type = showing ? 'password' : 'text';
    keyToggle.textContent = showing ? 'Show' : 'Hide';
    keyToggle.setAttribute('aria-pressed', String(!showing));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void save();
  });

  async function save(): Promise<void> {
    clearErrors();
    const source = selectedSource();
    if (!isSourceName(source)) return;
    status.textContent = 'Saving...';
    const result = await deps.settings.save({
      source,
      serverAddress: address.value,
      key: key.value === '' ? undefined : key.value,
      debug: debug.checked,
    });
    if (result.ok) {
      key.value = '';
      showSaved(result.settings);
      status.textContent = 'Saved.';
      return;
    }
    // What the person typed stays in the fields; only the message appears beside the right one.
    if (result.field === 'serverAddress') showError(address, addressError, result.message);
    else if (result.field === 'key') showError(key, keyError, result.message);
    status.textContent =
      result.field === 'serverAddress' || result.field === 'key'
        ? 'Not saved. Read the message next to the field.'
        : result.message;
    if (result.kind === 'permission-denied') showSaved(await deps.settings.load());
  }

  removeKey.addEventListener('click', () => {
    void (async () => {
      clearErrors();
      const result = await deps.settings.save({
        source: saved.source ?? 'jev',
        serverAddress: saved.serverAddress ?? '',
        key: '',
      });
      if (result.ok) {
        showSaved(result.settings);
        status.textContent = 'The saved key was removed.';
      } else {
        status.textContent = result.message;
      }
    })();
  });

  test.addEventListener('click', () => {
    void testConnection();
  });

  async function testConnection(): Promise<void> {
    clearErrors();
    const checked = validateServerAddress(address.value);
    if (!checked.ok) {
      showError(address, addressError, checked.error);
      status.textContent = 'Could not test. Read the message next to the field.';
      return;
    }
    const unsaved =
      key.value !== '' ||
      selectedSource() !== (saved.source ?? 'jev') ||
      (checked.address ?? '') !== (saved.serverAddress ?? '');
    if (unsaved) {
      status.textContent = 'You have unsaved changes. Press Save first, then test the connection.';
      return;
    }
    status.textContent = 'Testing...';
    const connection = await deps.settings.getConnection();
    if (!connection.ok) {
      status.textContent = `The connection could not be tested. ${failureReason(connection.kind)}`;
      return;
    }
    const adapter = deps.adapters[connection.connection.source];
    if (!adapter) {
      status.textContent = 'Testing this source is not available yet.';
      return;
    }
    const outcome = await adapter.testConnection(connection.connection);
    status.textContent = outcome.ok
      ? 'The connection works. The server accepted the key.'
      : `The connection failed. ${failureReason(outcome.kind)}`;
  }
}
