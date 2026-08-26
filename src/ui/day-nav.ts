import { getState, shiftDate, goToToday, addDays, todayIso } from '../app-state';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { urlFor } from '../router';
import { formatDateLong, renderBilingual } from './format';

/** Renders navigation plus the merged "when" header: the civil date/
 * weekday and the liturgical day-being-celebrated, together in one place
 * — previously the date lived here while the day-being-celebrated text
 * was repeated separately inside every hour's own view. The day-being-
 * celebrated text is hour-independent (the same LiturgicalDay for every
 * hour on a given date), so it's resolved directly here via `resolveDay`
 * rather than through any particular hour's `resolveOrdo`. */
export function renderDayNav(container: HTMLElement): void {
  const { date, selectedHour, languages } = getState();
  const day = resolveDay(date);
  const dateLabel = formatDateLong(date);
  const dayLabel = getDayLabel(day);
  const prevUrl = urlFor(addDays(date, -1), selectedHour, languages);
  const nextUrl = urlFor(addDays(date, 1), selectedHour, languages);
  const todayUrl = urlFor(todayIso(), selectedHour, languages);
  container.innerHTML = `
    <nav class="day-nav" aria-label="Day navigation">
      <a href="${prevUrl}" class="day-nav-btn" data-action="prev" aria-label="Previous day">&larr;</a>
      <a href="${todayUrl}" class="day-nav-btn day-nav-today" data-action="today">Today</a>
      <div class="day-nav-header">
        ${renderBilingual(dateLabel, languages, 'day-nav-date')}
        ${renderBilingual(dayLabel, languages, 'day-nav-label')}
      </div>
      <a href="${nextUrl}" class="day-nav-btn" data-action="next" aria-label="Next day">&rarr;</a>
    </nav>
  `;

  const bindNav = (action: string, mutate: () => void): void => {
    container.querySelector<HTMLAnchorElement>(`[data-action="${action}"]`)?.addEventListener('click', (event) => {
      // Let modifier/middle clicks fall through to normal browser navigation
      // (open in new tab, etc.) — only plain left-clicks are SPA-routed.
      if (event.defaultPrevented || (event as MouseEvent).button !== 0 || (event as MouseEvent).metaKey || (event as MouseEvent).ctrlKey || (event as MouseEvent).shiftKey || (event as MouseEvent).altKey) {
        return;
      }
      event.preventDefault();
      mutate();
    });
  };
  bindNav('prev', () => shiftDate(-1));
  bindNav('next', () => shiftDate(1));
  bindNav('today', () => goToToday());
}
