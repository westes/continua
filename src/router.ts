import { getState, setDate, setSelectedHour, setLanguages, subscribe, type AppState } from './app-state';
import { HOUR_IDS, type HourId } from './hours/types';

// Real paths (continua.reground.org/2026-08-09/prime), not hash routing — the
// container's Caddy does SPA fallback via try_files, so there's no need to
// avoid a rewrite rule the way a bare static docroot would have.
const BASE = import.meta.env.BASE_URL;

function isHourId(value: string): value is HourId {
  return (HOUR_IDS as readonly string[]).includes(value);
}

function parseLanguages(value: string | null): AppState['languages'] | undefined {
  if (!value) return undefined;
  const langs = value.split(',').filter(Boolean);
  if (langs.length === 1) return [langs[0]!];
  if (langs.length === 2) return [langs[0]!, langs[1]!];
  return undefined;
}

function parseLocation(): { date?: string; hour?: HourId; languages?: AppState['languages'] } {
  const path = window.location.pathname;
  if (!path.startsWith(BASE)) return {};
  const [date, hour] = path.slice(BASE.length).split('/').filter(Boolean);
  const languages = parseLanguages(new URLSearchParams(window.location.search).get('lang'));
  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    hour: hour && isHourId(hour) ? hour : undefined,
    languages,
  };
}

/** Exported for reuse by day-nav/bilingual-toggle so they can render real
 * `<a href>` links (right-click / open-in-new-tab / copy-link) instead of
 * reimplementing this path-building logic. */
export function urlFor(date: string, hour: HourId, languages: AppState['languages']): string {
  const base = `${BASE}${date}/${hour}`;
  // Omit the query string for the default single-English case to keep the
  // common-case URL clean.
  if (languages.length === 1 && languages[0] === 'en') return base;
  return `${base}?lang=${languages.join(',')}`;
}

let lastUrl = '';

function pushUrl(): void {
  const { date, selectedHour, languages } = getState();
  const url = urlFor(date, selectedHour, languages);
  if (url === lastUrl) return;
  lastUrl = url;
  window.history.pushState(null, '', url);
}

export function initRouter(): void {
  const { date, hour, languages } = parseLocation();
  if (date) setDate(date);
  if (hour) setSelectedHour(hour);
  if (languages) setLanguages(languages);

  const { date: currentDate, selectedHour, languages: currentLanguages } = getState();
  lastUrl = urlFor(currentDate, selectedHour, currentLanguages);
  window.history.replaceState(null, '', lastUrl);

  subscribe(() => pushUrl());

  window.addEventListener('popstate', () => {
    const parsed = parseLocation();
    // Set lastUrl first so the notify() inside setDate/setSelectedHour below
    // doesn't turn this back-navigation into a new forward pushState.
    lastUrl = window.location.pathname + window.location.search;
    if (parsed.date) setDate(parsed.date);
    if (parsed.hour) setSelectedHour(parsed.hour);
    if (parsed.languages) setLanguages(parsed.languages);
  });
}
