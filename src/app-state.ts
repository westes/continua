import type { HourId } from './hours/types';
import type { LanguageCode } from './psalter/types';

export interface AppState {
  date: string; // ISO YYYY-MM-DD
  selectedHour: HourId;
  /** Exactly one or two entries — see plan: one-language / two-language layout only. */
  languages: [LanguageCode] | [LanguageCode, LanguageCode];
}

export function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Which hour to default to when the URL doesn't specify one, based on local wall-clock time. */
export function defaultHourForTime(date: Date): HourId {
  const h = date.getHours();
  if (h < 6) return 'matins';
  if (h < 8) return 'lauds';
  if (h < 9) return 'prime';
  if (h < 12) return 'terce';
  if (h < 15) return 'sext';
  if (h < 17) return 'none';
  if (h < 21) return 'vespers';
  return 'compline';
}

const state: AppState = {
  date: todayIso(),
  selectedHour: defaultHourForTime(new Date()),
  languages: ['en'],
};

// Whether `state.date` is auto-following "today" (the default/root-URL
// case, or after explicitly clicking "Today"/"Now") vs. pinned to a date the
// user deliberately navigated to. `setDate()` always unpins; `goToToday()`/
// `goToNow()` always re-pin. Used below to refresh a stale date on tab
// resume without clobbering a deliberately-chosen past/future date.
let followingToday = true;

type Listener = (state: Readonly<AppState>) => void;
const listeners = new Set<Listener>();

export function getState(): Readonly<AppState> {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener(state);
}

export function setDate(date: string): void {
  followingToday = false;
  state.date = date;
  notify();
}

/**
 * "Today" jumps the date to today but leaves the selected hour alone —
 * distinct from "Now" (below), which also snaps the hour to the current
 * time-of-day default. Splitting these was a deliberate response to user
 * feedback that a single "Today" link doing both (jump date, and *also*
 * snap the hour once already on today) was confusing.
 */
export function goToToday(): void {
  const today = todayIso();
  if (state.date !== today) {
    state.date = today;
    notify();
  }
  followingToday = true;
}

/** "Now" jumps to today's date *and* the current time-of-day default hour, always. */
export function goToNow(): void {
  const today = todayIso();
  const hour = defaultHourForTime(new Date());
  if (state.date !== today || state.selectedHour !== hour) {
    state.date = today;
    state.selectedHour = hour;
    notify();
  }
  followingToday = true;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function shiftDate(days: number): void {
  setDate(addDays(state.date, days));
}

export function setSelectedHour(hourId: HourId): void {
  state.selectedHour = hourId;
  notify();
}

export function setLanguages(languages: AppState['languages']): void {
  state.languages = languages;
  notify();
}

// A tab/dev-server session can outlive a sleep/wake that crosses midnight
// while never navigating (no URL date segment, no Prev/Next/Today click) --
// `state.date` above is only ever seeded once, at module load, so without
// this it stays frozen on the old day indefinitely. Mirrors the
// `visibilitychange` pattern in `sw-update.ts`: no periodic timer, just a
// check on actual foreground-resume. Mutates `state` directly (not via
// `setDate`/`setSelectedHour`) so this refresh doesn't itself unpin
// `followingToday`.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (!followingToday) return;
  const today = todayIso();
  if (state.date === today) return;
  state.date = today;
  state.selectedHour = defaultHourForTime(new Date());
  notify();
});
