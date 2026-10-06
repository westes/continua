import { getState, setSelectedHour } from '../app-state';
import { resolveOrdo, type HourId } from '../hours';
import { hourLabel } from './format';
import { mountDropdown } from './dropdown';

const BASE = import.meta.env.BASE_URL;

// Grouped by weight/character rather than a flat wrapped list: Matins
// alone (by far the longest hour), Lauds/Prime as a middling morning pair,
// Terce/Sext/None as the traditional "Little Hours", Vespers/Compline as
// the evening anchor.
const HOUR_ROWS: readonly { label: string; hours: readonly HourId[] }[] = [
  { label: 'Night Office', hours: ['matins'] },
  { label: 'Morning', hours: ['lauds', 'prime'] },
  { label: 'Little Hours', hours: ['terce', 'sext', 'none'] },
  { label: 'Evening', hours: ['vespers', 'compline'] },
];

export function renderHourList(container: HTMLElement): void {
  const { date, selectedHour } = getState();

  const renderItem = (hourId: HourId): string => {
    const ordo = resolveOrdo(hourId, date);
    const isSelected = hourId === selectedHour;
    const isReady = !ordo.notImplemented;
    return `
      <a
        href="${BASE}${date}/${hourId}"
        class="dropdown-item hour-item${isSelected ? ' is-selected' : ''}${isReady ? '' : ' is-pending'}"
        data-hour="${hourId}"
        aria-current="${isSelected ? 'true' : 'false'}"
      >
        <span class="hour-name">${hourLabel(hourId)}</span>
        ${isReady ? '' : '<span class="hour-status">coming soon</span>'}
      </a>
    `;
  };

  const groups = HOUR_ROWS.map(
    ({ label, hours }) => `
      <div class="hour-row" role="group" aria-label="${label}">
        <span class="hour-row-label" aria-hidden="true">${label}</span>
        ${hours.map(renderItem).join('')}
      </div>
    `
  ).join('');

  mountDropdown(container, {
    label: 'Hour',
    current: hourLabel(selectedHour),
    className: 'hour-dropdown',
    panelHtml: groups,
  });

  container.querySelectorAll<HTMLAnchorElement>('[data-hour]').forEach((link) => {
    link.addEventListener('click', (event) => {
      // Let modifier/middle clicks fall through to normal browser navigation
      // (open in new tab, etc.) — only plain left-clicks are SPA-routed.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      setSelectedHour(link.dataset.hour as HourId);
    });
  });
}
