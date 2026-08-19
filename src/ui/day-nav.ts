import { getState, shiftDate, goToToday } from '../app-state';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { formatDateLong, renderBilingual } from './format';

/** Renders navigation plus the merged "when" header: the civil date/
 * weekday and the liturgical day-being-celebrated, together in one place
 * — previously the date lived here while the day-being-celebrated text
 * was repeated separately inside every hour's own view. The day-being-
 * celebrated text is hour-independent (the same LiturgicalDay for every
 * hour on a given date), so it's resolved directly here via `resolveDay`
 * rather than through any particular hour's `resolveOrdo`. */
export function renderDayNav(container: HTMLElement): void {
  const { date, languages } = getState();
  const day = resolveDay(date);
  const dateLabel = formatDateLong(date);
  const dayLabel = getDayLabel(day);
  container.innerHTML = `
    <nav class="day-nav" aria-label="Day navigation">
      <button type="button" class="day-nav-btn" data-action="prev" aria-label="Previous day">&larr;</button>
      <button type="button" class="day-nav-btn day-nav-today" data-action="today">Today</button>
      <div class="day-nav-header">
        ${renderBilingual(dateLabel, languages, 'day-nav-date')}
        ${renderBilingual(dayLabel, languages, 'day-nav-label')}
      </div>
      <button type="button" class="day-nav-btn" data-action="next" aria-label="Next day">&rarr;</button>
    </nav>
  `;
  container.querySelector('[data-action="prev"]')?.addEventListener('click', () => shiftDate(-1));
  container.querySelector('[data-action="next"]')?.addEventListener('click', () => shiftDate(1));
  container.querySelector('[data-action="today"]')?.addEventListener('click', () => goToToday());
}
