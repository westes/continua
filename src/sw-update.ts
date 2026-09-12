import { registerSW } from 'virtual:pwa-register';
import { subscribe } from './app-state';

// No periodic polling — that's background network chatter an offline-first
// app shouldn't do. Instead, check for a new service worker whenever the
// user actually does something: brings the app to the foreground
// (`visibilitychange` to 'visible', the "mobile PWA resume" case), or
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
//
// Neither of those covers a tab left open and untouched for a long stretch
// (reading one hour at length, say) -- deliberately not closed with a
// periodic timer (see above), but the About panel's "Check for Updates"
// button (`checkForUpdateManually` below) gives the user an on-demand way
// to ask, rather than the app guessing at an interval.
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

/** Grace window after a manual update check within which `autoUpdate`
 * would already have reloaded the page if it found anything -- see
 * vite-plugin-pwa's client/build/register.ts: a found update installs,
 * activates, and calls `window.location.reload()` on its own well within
 * this window on any real connection. If we're still executing after it,
 * nothing new was found. */
const MANUAL_CHECK_GRACE_MS = 1500;

/**
 * Called from the About panel's "Check for Updates" button. Only ever
 * returns 'up-to-date' or 'unsupported' — an actual update reloads the
 * page automatically before this promise would resolve, so there's no
 * 'updated' case to report back.
 */
export async function checkForUpdateManually(): Promise<'up-to-date' | 'unsupported'> {
  if (!swRegistration) return 'unsupported';
  await swRegistration.update();
  await new Promise((resolve) => setTimeout(resolve, MANUAL_CHECK_GRACE_MS));
  return 'up-to-date';
}
