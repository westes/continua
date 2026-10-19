import { easterOffsetOf } from '../calendar/temporal';
import type { ResolvedText } from './types';

/**
 * The reference engine's Paschaltide rule for saints' and Commons' Lauds and
 * Vespers (horas.pl's postprocess_ant / postprocess_vr /
 * postprocess_short_resp, helpers in LanguageTextTools.pm): from Easter
 * through the Saturday after Pentecost every antiphon ends in one Alleluia,
 * the versicle and its response each end in one, and a short responsory
 * takes the double-Alleluia form. All three are idempotent, so text that
 * already carries its Alleluia (the Apostles' Paschaltide Common, a
 * Paschaltide feast's own) passes through unchanged.
 */

const ALLELUIA = { la: 'allelúia', en: 'alleluia' } as const;
const ENDS_IN_ALLELUIA = /allelú?ia\p{P}?\)?\s*$/iu;
const ENDS_IN_DOUBLE = /allelú?ia[,.]\s+allelú?ia\p{P}?\s*$/iu;

function capitalized(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** One Alleluia, unless the text already ends in one. */
export function ensureSingleAlleluia(text: string, lang: 'la' | 'en'): string {
  if (!text || ENDS_IN_ALLELUIA.test(text)) return text;
  return text.replace(/\p{P}?\s*$/u, `, ${ALLELUIA[lang]}.`);
}

/** A short responsory's refrain in its Paschal form: "X, * Y." becomes
 * "X, y, * Allelúia, allelúia." */
export function ensureDoubleAlleluia(line: string, lang: 'la' | 'en'): string {
  if (ENDS_IN_DOUBLE.test(line)) return line;
  const moved = line.replace(/\s*\*\s*(.)/, (_m, c: string) => ` ${c.toLowerCase()}`);
  const a = ALLELUIA[lang];
  return moved.replace(/\p{P}?\s*$/u, `, * ${capitalized(a)}, ${a}.`);
}

function mapLangs(text: ResolvedText, fn: (t: string, lang: 'la' | 'en') => string): ResolvedText {
  const out: Partial<Record<string, string>> = { ...text.text };
  for (const lang of ['la', 'en'] as const) {
    const t = out[lang];
    if (t) out[lang] = fn(t, lang);
  }
  return { ...text, text: out };
}

/** Psalm or canticle antiphon text. */
export function paschalizeAntiphon(text: Partial<Record<string, string>>): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = { ...text };
  for (const lang of ['la', 'en'] as const) {
    const t = out[lang];
    if (t) out[lang] = ensureSingleAlleluia(t, lang);
  }
  return out;
}

/** "V. …\nR. …" -- each line ends in one Alleluia. */
export function paschalizeVersicle(text: ResolvedText): ResolvedText {
  return mapLangs(text, (t, lang) =>
    t
      .split('\n')
      .map((line) => (/^\s*[VR]\./.test(line) ? ensureSingleAlleluia(line.replace(/\s+$/, ''), lang) : line))
      .join('\n'),
  );
}

/** The six-line short responsory (R.br., R., V., R., V. Gloria, R.). */
export function paschalizeResponsory(text: ResolvedText): ResolvedText {
  return mapLangs(text, (t, lang) => {
    const lines = t.split('\n');
    if (!/^R\.br\./.test(lines[0] ?? '') || /allel/i.test(lines[0] ?? '')) return t;
    const duplex = `R. ${capitalized(ALLELUIA[lang])}, ${ALLELUIA[lang]}.`;
    let seenVerse = false;
    let afterVerse = false;
    return lines
      .map((line, i) => {
        if (i === 0) return ensureDoubleAlleluia(line, lang);
        if (/^V\./.test(line)) {
          seenVerse = true;
          return line;
        }
        if (!/^R\./.test(line)) return line;
        if (seenVerse && !afterVerse) {
          afterVerse = true;
          return duplex;
        }
        return ensureDoubleAlleluia(line, lang);
      })
      .join('\n');
  });
}

/** Engine rule (horasscripts.pl Benedicamus_Domino): Lauds/Vespers of Easter
 * week, and Saturday Vespers before Septuagesima, say "Benedicámus Dómino,
 * allelúia, allelúia". `governingDate` is the date of the day whose office is
 * being said (an anticipated evening governs from the next day). */
export function usesAlleluiaDismissal(hour: 'lauds' | 'vespers', date: string, governingDate: string): boolean {
  const inEasterWeek = (d: string) => easterOffsetOf(d) >= 0 && easterOffsetOf(d) <= 6;
  if (hour === 'lauds') return inEasterWeek(governingDate);
  return (inEasterWeek(date) && inEasterWeek(governingDate)) || easterOffsetOf(date) === -64;
}
