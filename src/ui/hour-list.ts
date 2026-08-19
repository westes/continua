import { getState, setSelectedHour } from '../app-state';
import { HOUR_IDS, resolveOrdo, type HourId } from '../hours';
import { hourLabel } from './format';

const BASE = import.meta.env.BASE_URL;

export function renderHourList(container: HTMLElement): void {
  const { date, selectedHour } = getState();

  const items = HOUR_IDS.map((hourId) => {
    const ordo = resolveOrdo(hourId, date);
    const isSelected = hourId === selectedHour;
    const isReady = !ordo.notImplemented;
    return `
      <li>
        <a
          href="${BASE}${date}/${hourId}"
          class="hour-item${isSelected ? ' is-selected' : ''}${isReady ? '' : ' is-pending'}"
          data-hour="${hourId}"
          aria-current="${isSelected ? 'true' : 'false'}"
        >
          <span class="hour-name">${hourLabel(hourId)}</span>
          ${isReady ? '' : '<span class="hour-status">coming soon</span>'}
        </a>
      </li>
    `;
  }).join('');

  container.innerHTML = `<ul class="hour-list">${items}</ul>`;

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
