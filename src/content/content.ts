import { initContent } from './collector';

initContent(
  {
    extensionId: chrome.runtime.id,
    onMessage: chrome.runtime.onMessage,
    sendMessage: (message) => chrome.runtime.sendMessage(message),
  },
  document,
  location.hostname,
);
