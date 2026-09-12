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
let registrationError: unknown;
let resolveRegistrationSettled: () => void;
// Resolves once the initial registerSW() call has either succeeded or
// failed — not on a timer, but on whichever of the two callbacks below
// actually fires. Awaited by checkForUpdateManually so an early click (the
// About panel opened and clicked within the first moment of a page load,
// before registration has had a chance to complete) waits for the real
// outcome instead of reporting "unsupported" for something that's actually
// still in flight.
const registrationSettled = new Promise<void>((resolve) => {
  resolveRegistrationSettled = resolve;
});
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    swRegistration = registration;
    resolveRegistrationSettled();
  },
  onRegisterError(error) {
    registrationError = error;
    resolveRegistrationSettled();
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

/** How long to wait for the initial registration to settle before giving
 * up on it — generous, since a slow network fetching sw.js is exactly the
 * kind of case worth waiting out rather than misreporting. If registration
 * is ever actually broken (not just slow), this is how long a click on the
 * button takes to say so, not how long the app is unusable for — the
 * initial `registerSW()` call above keeps trying independently of this. */
const REGISTRATION_WAIT_TIMEOUT_MS = 5000;

async function waitForRegistration(): Promise<'settled' | 'timed-out'> {
  return Promise.race([
    registrationSettled.then((): 'settled' => 'settled'),
    new Promise<'timed-out'>((resolve) => setTimeout(() => resolve('timed-out'), REGISTRATION_WAIT_TIMEOUT_MS)),
  ]);
}

/**
 * Called from the About panel's "Check for Updates" button. Only ever
 * returns 'up-to-date', 'dev', 'unsupported', or 'error' — an actual
 * update reloads the page automatically before this promise would resolve,
 * so there's no 'updated' case to report back.
 *
 * 'dev' vs. 'unsupported' vs. 'error' matters in the UI: `swRegistration`
 * can stay unset for three unrelated reasons, and lumping them together
 * (as an earlier version of this function did) produces a misleading
 * message for two of the three. In order:
 * - 'dev': vite-plugin-pwa doesn't register a real service worker in dev
 *   mode at all (no `devOptions.enabled` — see vite.config.ts), regardless
 *   of what the browser supports. Checked first, before waiting on
 *   anything, since dev mode's `registerSW()` is a total no-op stub that
 *   never calls either callback below — `registrationSettled` would hang
 *   forever if we waited on it here.
 * - 'unsupported': this browser has no `serviceWorker` API at all (very
 *   old browsers, a non-HTTPS context, certain locked-down iframes/private
 *   modes) — checked directly rather than inferred, since `register()`
 *   (vite-plugin-pwa's build/register.ts) also never calls either callback
 *   in this case, for the same reason as 'dev' above.
 * - 'error': registration was attempted and failed (`onRegisterError`) —
 *   a real problem worth its own message, not indistinguishable from the
 *   browser simply not supporting service workers.
 *
 * Otherwise, waits (up to `REGISTRATION_WAIT_TIMEOUT_MS`) for the initial
 * registration to actually finish before concluding anything — live-
 * verified gap, 2026-09-12: clicking the button in the first moment after
 * a page load, before registration had completed, reported "unsupported"
 * for something that was in fact about to succeed.
 */
export async function checkForUpdateManually(): Promise<'up-to-date' | 'dev' | 'unsupported' | 'error'> {
  if (import.meta.env.DEV) return 'dev';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const outcome = await waitForRegistration();
  if (outcome === 'timed-out') return 'unsupported';
  if (registrationError) return 'error';
  if (!swRegistration) return 'unsupported';
  await swRegistration.update();
  await new Promise((resolve) => setTimeout(resolve, MANUAL_CHECK_GRACE_MS));
  return 'up-to-date';
}
