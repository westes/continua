const MONTHSUP = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dateToYdays(day: number, month: number, year: number): number {
  const monthOffset = MONTHSUP[month - 1] ?? 0;
  return monthOffset + day + (month > 2 && isLeapYear(year) ? 1 : 0);
}

function lunaTable(yday: number, letter: string): number {
  const letters = 'abcdefghiklmnpqrstuABCDERFGHMNP';
  const letterPosition = letters.indexOf(letter) + 1;
  const cycleDay = yday % 59;
  const m = yday < 36 ? 30 : ((yday - 35) % 59 || 59) < 29 ? 29 : 30;
  let i = cycleDay < 36 ? letterPosition : letterPosition - 1;

  if (cycleDay < 36) {
    if (letterPosition > 25) i -= 1;
    if (letterPosition === 25 && cycleDay === 35) i += 1;
  } else if (letterPosition > 25) {
    i -= 2;
  }

  if (yday > 58) {
    if (letterPosition > 25 && cycleDay < 5) i -= 1;
    if (letterPosition === 26 && cycleDay === 5) i -= 1;
  }

  return (((i - 1 + cycleDay) % m) + m) % m + 1;
}

/**
 * The traditional Martyrology's "Luna N" (day of the moon) — ported from
 * Divinum Officium's _luna_day/_luna_table (a Golden-Number/epact-based
 * lunar calendar algorithm, not a real astronomical calculation). Verified
 * against 3 known engine outputs: 2026-08-26 -> 13, 2026-12-25 -> 16,
 * 2027-03-02 -> 24.
 */
export function lunaDay(month: number, day: number, year: number): number {
  let lettersForAurea: string;
  if (year < 1700) {
    lettersForAurea = 'amDdqGgtNkBbnEerHhu';
  } else if (year < 1900) {
    lettersForAurea = 'PlCcpFfsMiAamDdqGgt';
  } else if (year < 2200) {
    lettersForAurea = 'NkBbnEerHhuPlCcpRfs';
  } else {
    lettersForAurea = 'MiAamDdqGgtNkBbnEer';
  }

  const aureaNumber = (year % 19) + 1;
  const letter = lettersForAurea[aureaNumber - 1];
  if (!letter) {
    throw new Error(`unreachable: no aurea letter for year ${year}`);
  }

  let yday = dateToYdays(day, month, year);
  if (isLeapYear(year) && (month > 2 || (month === 2 && day > 23))) {
    yday -= 1;
  }

  let luna = lunaTable(yday, letter);
  if (aureaNumber === 1 && month === 1 && letter !== 'P' && day + lunaTable(1, letter) < 32) {
    luna -= 1;
  }
  return luna;
}

const LATIN_ORDINALS = [
  'prima',
  'secúnda',
  'tértia',
  'quarta',
  'quinta',
  'sexta',
  'séptima',
  'octáva',
  'nona',
  'décima',
  'undécima',
  'duodécima',
  'tértia décima',
  'quarta décima',
  'quinta décima',
  'sexta décima',
  'décima séptima',
  'duodevicésima',
  'undevicésima',
  'vicésima',
  'vicésima prima',
  'vicésima secúnda',
  'vicésima tértia',
  'vicésima quarta',
  'vicésima quinta',
  'vicésima sexta',
  'vicésima séptima',
  'vicésima octáva',
  'vicésima nona',
  'tricésima',
];

export function lunaOrdinalLatin(n: number): string {
  const ordinal = LATIN_ORDINALS[n - 1];
  if (!ordinal) {
    throw new Error(`luna day out of range: ${n}`);
  }
  return ordinal;
}

function englishOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) {
    return 'th';
  }
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function lunaOrdinalEnglish(n: number): string {
  return `${n}${englishOrdinalSuffix(n)}`;
}
