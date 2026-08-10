import type { RegulaReading } from './types';
import tableData from '../data/regula/table.yml';

interface Table {
  table: Record<string, [string, string]>;
}

const { table } = tableData as Table;

// Reverse index: any of the 3 recurring dates -> canonical (first) date.
const canonicalDateFor = new Map<string, string>();
for (const [canonical, [repeat1, repeat2]] of Object.entries(table)) {
  canonicalDateFor.set(canonical, canonical);
  canonicalDateFor.set(repeat1, canonical);
  canonicalDateFor.set(repeat2, canonical);
}

const readingModules = import.meta.glob<{ default: RegulaReading }>('../data/regula/[0-9]*.yml', {
  eager: true,
});

const readings = new Map<string, RegulaReading>();
for (const mod of Object.values(readingModules)) {
  readings.set(mod.default.canonicalDate, mod.default);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * @param isoDate "YYYY-MM-DD". Feb 29 only has its own canonical reading in
 * leap years — in a non-leap year, Feb 24–28 shift forward by one day before
 * lookup (mirroring the source engine's own bis-sextus rule), so a plain
 * Feb 28 reads what would otherwise be Feb 29's chapter.
 */
export function getRegulaReadingFor(isoDate: string): RegulaReading {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  let day = Number(dayStr);

  if (month === 2 && day >= 24 && !isLeapYear(year)) {
    day += 1;
  }

  const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const canonicalDate = canonicalDateFor.get(monthDay);
  if (!canonicalDate) {
    return { canonicalDate: monthDay, label: {}, text: {}, status: { la: 'missing', en: 'missing' } };
  }

  return (
    readings.get(canonicalDate) ?? {
      canonicalDate,
      label: {},
      text: {},
      status: { la: 'missing', en: 'missing' },
    }
  );
}

export type { RegulaReading } from './types';
