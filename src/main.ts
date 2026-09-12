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
import { subscribe } from './app-state';
import { initRouter } from './router';
import { mountShell } from './ui/shell';

const root = document.getElementById('app');
if (!root) {
  throw new Error('missing #app root element');
}

initRouter();
mountShell(root);

// No periodic polling — that's background network chatter an offline-first
// app shouldn't do. Instead, check for a new service worker whenever the
// user actually does something: brings the app to the foreground
// (`visibilitychange` to 'visible', the "mobile PWA resume" case) or
// navigates within the app (an hour/date/language change via app-state's
// `subscribe` — this is a same-page SPA route change, not a real
// navigation, so the browser's own per-navigation update check never fires
// for it on its own). Live-verified gap, 2026-09-12: switching from Lauds
// back to Matins in an already-open tab stayed on the stale version
// indefinitely, while a fresh tab load picked up the new one immediately —
// visibilitychange alone never covers "tab stayed visible and focused the
// whole time, user just clicked around." `registerType: 'autoUpdate'`
// (vite.config.ts) takes it from there — once `registration.update()`
// finds a new worker, it activates and reloads on its own, no prompt
// needed.
let swRegistration: ServiceWorkerRegistration | undefined;
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    swRegistration = registration;
  },
});

function checkForUpdate(): void {
  swRegistration?.update();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});
subscribe(checkForUpdate);
