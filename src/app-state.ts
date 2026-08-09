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

const state: AppState = {
  date: todayIso(),
  selectedHour: 'prime',
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

export function goToToday(): void {
  setDate(todayIso());
}

export function shiftDate(days: number): void {
  const d = new Date(`${state.date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  setDate(d.toISOString().slice(0, 10));
}

export function setSelectedHour(hourId: HourId): void {
  state.selectedHour = hourId;
  notify();
}

export function setLanguages(languages: AppState['languages']): void {
  state.languages = languages;
  notify();
}
