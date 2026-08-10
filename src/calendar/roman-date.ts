const MONTH_GENITIVE = [
  'Januárii',
  'Februárii',
  'Mártii',
  'Aprílis',
  'Maji',
  'Júnii',
  'Júlii',
  'Augústi',
  'Septémbris',
  'Octóbris',
  'Novémbris',
  'Decémbris',
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// "MMJO" months (March, May, July, October) push Nones/Ides two days later
// than every other month.
const LONG_NONES_IDES_MONTHS = new Set([3, 5, 7, 10]);

function nonesDay(month: number): number {
  return LONG_NONES_IDES_MONTHS.has(month) ? 7 : 5;
}

function idesDay(month: number): number {
  return LONG_NONES_IDES_MONTHS.has(month) ? 15 : 13;
}

// The "ante diem N" ordinal, for N = 3..19 (N=1 has no numbered form — see
// romanDateLatin's "Pridie" handling below). Additive compounds through 16
// fuse into one word (tertiodecimo..sextodecimo); 17-19 split into two
// words in the opposite order (decimo septimo, not septimodecimo) — this
// isn't a guess, both irregularities are exactly what's attested across the
// entire verified Martyrologium dataset (363 of 365 real headings matched
// this table exactly; the other 2 were the source's own missing accents).
const ANTE_DIEM_ORDINALS: Record<number, string> = {
  3: 'Tértio',
  4: 'Quarto',
  5: 'Quinto',
  6: 'Sexto',
  7: 'Séptimo',
  8: 'Octávo',
  9: 'Nono',
  10: 'Décimo',
  11: 'Undécimo',
  12: 'Duodécimo',
  13: 'Tertiodécimo',
  14: 'Quartodécimo',
  15: 'Quintodécimo',
  16: 'Sextodécimo',
  17: 'Décimo séptimo',
  18: 'Décimo octávo',
  19: 'Décimo nono',
};

function anteDiemOrdinal(n: number): string {
  const word = ANTE_DIEM_ORDINALS[n];
  if (!word) {
    throw new Error(`no ante-diem ordinal for ${n} (expected 3-19)`);
  }
  return word;
}

/**
 * Formats a Gregorian date as a traditional Roman Kalends/Nones/Ides phrase
 * (e.g. "Séptimo Kaléndas Septémbris", "Idibus Mártii", "Prídie Kaléndas
 * Januárii") — verified against Divinum Officium's real Martyrologium
 * headings across all 365 non-leap-day dates (see the ordinal table's
 * comment). This is the Latin-only convention; there's no English
 * equivalent — English dates are just given in plain Gregorian form.
 *
 * Feb 29 (leap years only) is a special case: it repeats Feb 24's phrase
 * exactly ("Sexto Kaléndas Mártii") rather than the "Prídie Kaléndas
 * Mártii" that plain day-counting would give it. This is the historical
 * "bis sextus" (doubled sixth day before the Kalends of March) — the
 * origin of the word "bissextile" — and it's why Regula and Martyrology
 * both need special handling for 2/24-2/29, not just a generic leap-year
 * day-count adjustment.
 *
 * Crucially, this means the Kalends-of-March countdown for Feb 1-28 is
 * *always* computed as if February had 28 days, leap year or not — the
 * traditional calendar doesn't extend the countdown range in a leap year,
 * it inserts an extra (repeated) day. `year` only matters for that Feb 29
 * check; it's otherwise unused, which is deliberate, not an oversight.
 */
export function romanDateLatin(month: number, day: number, year: number): string {
  if (month === 2 && day === 29) {
    return romanDateLatin(2, 24, year);
  }

  const monthGenitive = MONTH_GENITIVE[month - 1];
  if (!monthGenitive) {
    throw new Error(`invalid month: ${month}`);
  }
  const nextMonthGenitive = MONTH_GENITIVE[month === 12 ? 0 : month]!;
  const daysInMonth = DAYS_IN_MONTH[month - 1]!;
  const nones = nonesDay(month);
  const ides = idesDay(month);

  if (day === 1) {
    return `Kaléndis ${monthGenitive}`;
  }
  if (day === nones) {
    return `Nonis ${monthGenitive}`;
  }
  if (day === ides) {
    return `Idibus ${monthGenitive}`;
  }
  if (day === nones - 1) {
    return `Prídie Nonas ${monthGenitive}`;
  }
  if (day === ides - 1) {
    return `Prídie Idus ${monthGenitive}`;
  }
  if (day === daysInMonth) {
    return `Prídie Kaléndas ${nextMonthGenitive}`;
  }
  if (day < nones) {
    return `${anteDiemOrdinal(nones - day + 1)} Nonas ${monthGenitive}`;
  }
  if (day < ides) {
    return `${anteDiemOrdinal(ides - day + 1)} Idus ${monthGenitive}`;
  }
  return `${anteDiemOrdinal(daysInMonth - day + 2)} Kaléndas ${nextMonthGenitive}`;
}
