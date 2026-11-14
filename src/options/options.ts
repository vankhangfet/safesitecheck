import { createJevAdapter } from '../adapters/jevAdapter';
import { createSettingsManager } from '../background/settingsManager';
import { wrapPermissions, wrapStorageArea } from '../shared/browser';
import { initOptions } from './optionsView';

const settings = createSettingsManager({
  storage: wrapStorageArea(chrome.storage.local),
  permissions: wrapPermissions(chrome.permissions),
});

void initOptions(document, {
  settings,
  adapters: { jev: createJevAdapter({ fetchFn: (input, init) => fetch(input, init) }) },
});
