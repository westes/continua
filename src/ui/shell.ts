import { getState, subscribe } from '../app-state';
import { resolveDay } from '../calendar';
import { resolveEveningDay } from '../calendar/vespers';
import { getDayLabel, getDayTitleName } from '../calendar/day-label';
import { renderDayNav } from './day-nav';
import { renderHourList } from './hour-list';
import { renderHourView } from './hour-view';
import { renderLanguageToggle } from './bilingual-toggle';
import { mountAboutPanel } from './about-panel';
import { documentTitle } from './format';

// The "C" glyph from EB Garamond 700 (the same font/weight as .site-title),
// extracted as a path so the header mark matches the wordmark's letterforms
// exactly and can recolor via `currentColor` for light/dark mode.
const LOGO_MARK_SVG = `<svg class="site-logo" viewBox="29 -664 629 678" fill="currentColor" role="img" aria-hidden="true"><path transform="scale(1,-1)" d="M405 -14Q327 -14 259.0 9.5Q191 33 139.0 76.5Q87 120 58.0 181.0Q29 242 29 316Q29 385 56.5 447.5Q84 510 137.0 558.5Q190 607 264.5 635.5Q339 664 433 664Q465 664 497.5 659.5Q530 655 560.5 647.0Q591 639 616 630Q625 626 631.5 619.5Q638 613 639 601Q643 568 645.0 537.0Q647 506 647 481Q647 470 639.0 466.0Q631 462 621.5 465.5Q612 469 608 481Q601 504 591.5 527.0Q582 550 563 567Q543 587 507.5 600.0Q472 613 422 613Q371 613 329.5 591.0Q288 569 258.5 531.0Q229 493 213.0 445.0Q197 397 197 345Q197 279 211.0 222.5Q225 166 254.0 125.0Q283 84 325.0 61.0Q367 38 424 38Q498 38 544.0 69.5Q590 101 621 166Q629 184 643.5 183.0Q658 182 658 166Q658 153 655.5 134.5Q653 116 648.0 95.0Q643 74 636 52Q632 40 625.5 33.5Q619 27 609 22Q571 6 519.0 -4.0Q467 -14 405 -14Z"/></svg>`;

export function mountShell(root: HTMLElement): void {
  root.innerHTML = `
    <header class="site-header">
      <div class="site-brand">
        ${LOGO_MARK_SVG}
        <span class="site-title">Continua</span>
      </div>
      <div data-slot="language-toggle"></div>
      <div data-slot="about-panel"></div>
    </header>
    <div data-slot="day-nav"></div>
    <main id="main" class="app-main">
      <nav data-slot="hour-list" class="hour-list-nav" aria-label="Hours"></nav>
      <div data-slot="hour-view" class="hour-view-region"></div>
    </main>
  `;

  const dayNavEl = root.querySelector<HTMLElement>('[data-slot="day-nav"]');
  const hourListEl = root.querySelector<HTMLElement>('[data-slot="hour-list"]');
  const hourViewEl = root.querySelector<HTMLElement>('[data-slot="hour-view"]');
  const languageToggleEl = root.querySelector<HTMLElement>('[data-slot="language-toggle"]');
  const aboutPanelEl = root.querySelector<HTMLElement>('[data-slot="about-panel"]');
  if (!dayNavEl || !hourListEl || !hourViewEl || !languageToggleEl || !aboutPanelEl) {
    throw new Error('shell markup is missing an expected slot');
  }
  mountAboutPanel(aboutPanelEl);

  function render(): void {
    renderDayNav(dayNavEl!);
    renderHourList(hourListEl!);
    renderHourView(hourViewEl!);
    renderLanguageToggle(languageToggleEl!);

    const { date, selectedHour, languages } = getState();
    const isEveningHour = selectedHour === 'vespers' || selectedHour === 'compline';
    const day = isEveningHour ? resolveEveningDay(date) : resolveDay(date);
    document.title = documentTitle(selectedHour, getDayLabel(day), languages, getDayTitleName(day));
  }

  render();
  subscribe(render);
}
