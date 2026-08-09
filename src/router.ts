import { getState, setDate, setSelectedHour, subscribe } from './app-state';
import { HOUR_IDS, type HourId } from './hours/types';

// Real paths (reground.org/vu/2026-08-09/prime), not hash routing — the
// container's Caddy does SPA fallback via try_files, so there's no need to
// avoid a rewrite rule the way a bare static docroot would have.
const BASE = import.meta.env.BASE_URL;

function isHourId(value: string): value is HourId {
  return (HOUR_IDS as readonly string[]).includes(value);
}

function parseLocation(): { date?: string; hour?: HourId } {
  const path = window.location.pathname;
  if (!path.startsWith(BASE)) return {};
  const [date, hour] = path.slice(BASE.length).split('/').filter(Boolean);
  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    hour: hour && isHourId(hour) ? hour : undefined,
  };
}

function urlFor(date: string, hour: HourId): string {
  return `${BASE}${date}/${hour}`;
}

let lastUrl = '';

function pushUrl(): void {
  const { date, selectedHour } = getState();
  const url = urlFor(date, selectedHour);
  if (url === lastUrl) return;
  lastUrl = url;
  window.history.pushState(null, '', url);
}

export function initRouter(): void {
  const { date, hour } = parseLocation();
  if (date) setDate(date);
  if (hour) setSelectedHour(hour);

  const { date: currentDate, selectedHour } = getState();
  lastUrl = urlFor(currentDate, selectedHour);
  window.history.replaceState(null, '', lastUrl);

  subscribe(() => pushUrl());

  window.addEventListener('popstate', () => {
    const parsed = parseLocation();
    // Set lastUrl first so the notify() inside setDate/setSelectedHour below
    // doesn't turn this back-navigation into a new forward pushState.
    lastUrl = window.location.pathname;
    if (parsed.date) setDate(parsed.date);
    if (parsed.hour) setSelectedHour(parsed.hour);
  });
}
