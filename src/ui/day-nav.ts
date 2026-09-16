import { getState, shiftDate, goToToday, goToNow, addDays, todayIso, defaultHourForTime } from '../app-state';
import { resolveDay } from '../calendar';
import { resolveEveningDay } from '../calendar/vespers';
import { getDayLabelItems, getVespersStatusLabel } from '../calendar/day-label';
import { urlFor } from '../router';
import { formatDateLong, renderBilingual, renderBilingualList } from './format';

/** Renders navigation plus the merged "when" header: the civil date/
 * weekday and the liturgical day-being-celebrated, together in one place
 * — previously the date lived here while the day-being-celebrated text
 * was repeated separately inside every hour's own view. The day-being-
 * celebrated text is hour-independent for the daytime hours (the same
 * `LiturgicalDay` for every hour on a given date) but NOT for Vespers/
 * Compline: those two can belong to *tomorrow's* identity instead (First
 * Vespers anticipation — see `calendar/vespers.ts`'s `resolveEveningDay`),
 * so this header must resolve through that function for those two hours
 * specifically, or it shows the wrong saint (previously always used plain
 * `resolveDay`, silently mismatched against what the hour itself was
 * actually rendering). */
export function renderDayNav(container: HTMLElement): void {
  const { date, selectedHour, languages } = getState();
  const isEveningHour = selectedHour === 'vespers' || selectedHour === 'compline';
  const day = isEveningHour ? resolveEveningDay(date) : resolveDay(date);
  const dateLabel = formatDateLong(date);
  const dayLabelItems = getDayLabelItems(day);
  const vespersStatus = selectedHour === 'vespers' ? getVespersStatusLabel(day, date) : undefined;
  const prevUrl = urlFor(addDays(date, -1), selectedHour, languages);
  const nextUrl = urlFor(addDays(date, 1), selectedHour, languages);
  const todayUrl = urlFor(todayIso(), selectedHour, languages);
  const nowUrl = urlFor(todayIso(), defaultHourForTime(new Date()), languages);
  container.innerHTML = `
    <nav class="day-nav" aria-label="Day navigation">
      <a href="${prevUrl}" class="day-nav-btn" data-action="prev" aria-label="Previous day">&larr;</a>
      <a href="${todayUrl}" class="day-nav-btn day-nav-today" data-action="today">Today</a>
      <a href="${nowUrl}" class="day-nav-btn day-nav-now" data-action="now">Now</a>
      <a href="${nextUrl}" class="day-nav-btn" data-action="next" aria-label="Next day">&rarr;</a>
      <div class="day-nav-header">
        ${renderBilingual(dateLabel, languages, 'day-nav-date')}
        ${renderBilingualList(dayLabelItems, languages, 'day-nav-label')}
        ${vespersStatus ? renderBilingual(vespersStatus, languages, 'day-nav-vespers-status') : ''}
      </div>
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
  bindNav('now', () => goToNow());
}
