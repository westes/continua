import { getState, setSelectedHour } from '../app-state';
import { HOUR_IDS, resolveOrdo, type HourId } from '../hours';
import { hourLabel } from './format';

export function renderHourList(container: HTMLElement): void {
  const { date, selectedHour } = getState();

  const items = HOUR_IDS.map((hourId) => {
    const ordo = resolveOrdo(hourId, date);
    const isSelected = hourId === selectedHour;
    const isReady = !ordo.notImplemented;
    return `
      <li>
        <button
          type="button"
          class="hour-item${isSelected ? ' is-selected' : ''}${isReady ? '' : ' is-pending'}"
          data-hour="${hourId}"
          aria-current="${isSelected ? 'true' : 'false'}"
        >
          <span class="hour-name">${hourLabel(hourId)}</span>
          ${isReady ? '' : '<span class="hour-status">coming soon</span>'}
        </button>
      </li>
    `;
  }).join('');

  container.innerHTML = `<ul class="hour-list">${items}</ul>`;

  container.querySelectorAll<HTMLButtonElement>('[data-hour]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setSelectedHour(btn.dataset.hour as HourId);
    });
  });
}
