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
  state.date = date;
  notify();
}

/**
 * Which hour the "Today" link should point to: if we're already viewing
 * today, the current time-of-day default (as if freshly visiting `/vu`
 * right now); otherwise the hour currently selected, unchanged. Shared by
 * `goToToday()` and the link's `href` (`day-nav.ts`) so a plain click and
 * a right-click-open-in-new-tab land on the same target.
 */
export function todayTargetHour(): HourId {
  return state.date === todayIso() ? defaultHourForTime(new Date()) : state.selectedHour;
}

export function goToToday(): void {
  const today = todayIso();
  const hour = todayTargetHour();
  if (state.date === today) {
    setSelectedHour(hour);
  } else {
    setDate(today);
  }
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
