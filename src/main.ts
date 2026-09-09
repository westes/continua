// Latin subset only — this content is Latin/English, no need to ship
// cyrillic/greek glyph data into the offline precache.
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-600.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import './ui/styles.css';
import { registerSW } from 'virtual:pwa-register';
import { initRouter } from './router';
import { mountShell } from './ui/shell';

const root = document.getElementById('app');
if (!root) {
  throw new Error('missing #app root element');
}

initRouter();
mountShell(root);

// No periodic polling — that's background network chatter an offline-first
// app shouldn't do. Instead, check for a new service worker only when the
// app is actually brought to the foreground (`visibilitychange` to
// 'visible'): the one moment a "the page never really reloaded" mobile PWA
// resume needs a nudge, and nothing more than that. `registerType:
// 'autoUpdate'` (vite.config.ts) then takes it from there — once
// `registration.update()` finds a new worker, it activates and reloads on
// its own, no prompt needed.
let swRegistration: ServiceWorkerRegistration | undefined;
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    swRegistration = registration;
  },
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    swRegistration?.update();
  }
});
