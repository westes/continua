import { getState, shiftDate, goToToday } from '../app-state';
import { formatDateLong } from './format';

export function renderDayNav(container: HTMLElement): void {
  const { date } = getState();
  container.innerHTML = `
    <nav class="day-nav" aria-label="Day navigation">
      <button type="button" class="day-nav-btn" data-action="prev" aria-label="Previous day">&larr;</button>
      <button type="button" class="day-nav-btn day-nav-today" data-action="today">Today</button>
      <span class="day-nav-date">${formatDateLong(date)}</span>
      <button type="button" class="day-nav-btn" data-action="next" aria-label="Next day">&rarr;</button>
    </nav>
  `;
  container.querySelector('[data-action="prev"]')?.addEventListener('click', () => shiftDate(-1));
  container.querySelector('[data-action="next"]')?.addEventListener('click', () => shiftDate(1));
  container.querySelector('[data-action="today"]')?.addEventListener('click', () => goToToday());
}
