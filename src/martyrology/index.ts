import type { MartyrologyEntry } from './types';
import { lunaDay, lunaOrdinalLatin, lunaOrdinalEnglish } from './luna';
import { romanDateLatin } from '../calendar/roman-date';

// One file per calendar day (MM-DD.yml) — only a handful exist so far
// (content-authoring the full 366-day Roman Martyrology is a separate,
// later task, same as full psalm-text authoring). Missing days resolve as
// pending rather than throwing.
const modules = import.meta.glob<{ default: MartyrologyEntry }>('../data/martyrology/*.yml', {
  eager: true,
});

const entries = new Map<string, MartyrologyEntry>();
for (const mod of Object.values(modules)) {
  entries.set(mod.default.monthDay, mod.default);
}

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function dayFollowing(isoDate: string): { month: number; day: number; year: number; monthDay: string } {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return { month, day, year, monthDay: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
}

/**
 * The Latin heading uses the real Roman Kalends/Nones/Ides date (see
 * calendar/roman-date.ts); English dates are given in plain Gregorian
 * form — there's no traditional English equivalent of the Kalends system.
 */
function heading(month: number, day: number, year: number): { la: string; en: string } {
  const luna = lunaDay(month, day, year);
  return {
    la: `${romanDateLatin(month, day, year)} Luna ${lunaOrdinalLatin(luna)}. Anno Dómini ${year}.`,
    en: `${ENGLISH_MONTHS[month - 1]} ${day}, ${year} — the ${lunaOrdinalEnglish(luna)} day of the Moon.`,
  };
}

/**
 * Monastic Prime reads *tomorrow's* Martyrology entry (the announcement of
 * the next day's saints), not today's — this computes that offset so callers
 * just pass the ordo's own date.
 */
export function getMartyrologyEntryFor(isoDate: string): MartyrologyEntry {
  const { month, day, year, monthDay } = dayFollowing(isoDate);
  const entry = entries.get(monthDay);
  if (!entry) {
    return { monthDay, text: {}, status: { la: 'missing', en: 'missing' } };
  }

  const head = heading(month, day, year);
  return {
    monthDay,
    text: {
      la: entry.text.la ? `${head.la}\n\n${entry.text.la}` : entry.text.la,
      en: entry.text.en ? `${head.en}\n\n${entry.text.en}` : entry.text.en,
    },
    status: entry.status,
  };
}

export type { MartyrologyEntry } from './types';
