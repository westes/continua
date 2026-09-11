import { APP_VERSION, APP_VERSION_DATE, onVersionChange } from '../version';
import { formatRelativeTime } from './format';

// A short, factual description of what the app is -- not marketing copy.
// Kept at or under ~50 words on purpose (2026-09-11 user decision): this is
// the one piece of "help content" continua ships, scoped to what its sole
// author/user needs to trust and orient in the app, not onboarding for a
// stranger (see CLAUDE.md's "not a reconstruction" section for the full
// methodology this is summarizing).
const ABOUT_BLURB =
  'A bilingual Latin/English Divine Office — Matins through Compline — for any date, ' +
  'blending Monastic structure, Divino Afflatu rubrics, and a merged Tridentine/Divino ' +
  'Afflatu calendar into its own office design. Works fully offline once visited.';

/** Mounted once from `shell.ts` (outside the per-navigation `render()`
 * loop) since its content — version/build metadata — never changes across
 * a session in production (the dev-only `onVersionChange` patch below is
 * the one exception). Uses a native `<dialog>` rather than a custom modal
 * implementation for free focus-trapping, ESC-to-close, and
 * backdrop-click-to-close. */
export function mountAboutPanel(container: HTMLElement): void {
  container.innerHTML = `
    <button type="button" class="about-trigger" aria-haspopup="dialog">${APP_VERSION}</button>
    <dialog class="about-dialog">
      <h2>Continua <span class="about-version">${APP_VERSION}</span></h2>
      <p class="about-updated">Last updated <span class="about-updated-text">${formatRelativeTime(APP_VERSION_DATE)}</span></p>
      <p class="about-blurb">${ABOUT_BLURB}</p>
      <button type="button" class="about-close" autofocus>Close</button>
    </dialog>
  `;

  const dialog = container.querySelector<HTMLDialogElement>('.about-dialog')!;
  container.querySelector('.about-trigger')!.addEventListener('click', () => dialog.showModal());
  container.querySelector('.about-close')!.addEventListener('click', () => dialog.close());
  // Clicking the backdrop lands on the <dialog> element itself (its
  // children fill the content box); clicking inside the panel content
  // doesn't, since that hits one of the child elements instead.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Dev-only: patches the already-rendered version/date text in place when
  // the live commit hash, dirty state, or package.json version changes,
  // instead of a full page reload.
  onVersionChange((version, versionDate) => {
    container.querySelectorAll<HTMLElement>('.about-trigger, .about-version').forEach((el) => {
      el.textContent = version;
    });
    const updated = container.querySelector<HTMLElement>('.about-updated-text');
    if (updated) updated.textContent = formatRelativeTime(versionDate);
  });
}
