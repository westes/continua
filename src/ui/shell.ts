import { subscribe } from '../app-state';
import { renderDayNav } from './day-nav';
import { renderHourList } from './hour-list';
import { renderHourView } from './hour-view';
import { renderLanguageToggle } from './bilingual-toggle';

export function mountShell(root: HTMLElement): void {
  root.innerHTML = `
    <header class="site-header">
      <span class="site-title">vu</span>
      <div data-slot="language-toggle"></div>
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
  if (!dayNavEl || !hourListEl || !hourViewEl || !languageToggleEl) {
    throw new Error('shell markup is missing an expected slot');
  }

  function render(): void {
    renderDayNav(dayNavEl!);
    renderHourList(hourListEl!);
    renderHourView(hourViewEl!);
    renderLanguageToggle(languageToggleEl!);
  }

  render();
  subscribe(render);
}
