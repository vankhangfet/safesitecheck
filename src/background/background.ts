import { createChromeEnv } from './chromeEnv';
import { registerBackground } from './wiring';

// Listeners are registered while this file loads, as Manifest V3 requires.
registerBackground(createChromeEnv(chrome));
