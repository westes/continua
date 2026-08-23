import type { DayWinner } from '../calendar/types';
import { isAtLeast } from '../calendar/commemorations';
import type { ResolvedVerse, ResolvedText } from './types';

export interface SplitAntiphon {
  incipit: string;
  full: string;
}

/**
 * Antiphon text is stored as one string with an embedded "*" marking where
 * the incipit (the "half antiphon") ends — the same convention Divinum
 * Officium's own data uses, so no separate half/full fields are needed.
 *
 * The "*" is kept in `full` (by explicit choice — it's a meaningful chant
 * mark, not just an incipit-boundary artifact, even though the reference
 * engine's own rendering happens to strip it there).
 */
export function splitAntiphon(text: string): SplitAntiphon {
  const starIndex = text.indexOf('*');
  if (starIndex === -1) {
    return { incipit: text, full: text };
  }
  const before = text.slice(0, starIndex).trim();
  const after = text.slice(starIndex + 1).trim();
  return { incipit: before.replace(/,$/, '.'), full: `${before} * ${after}` };
}

/**
 * Real practice: the antiphon is said in full both before and after the
 * psalms on a Double-rank feast or higher; below that, only the incipit is
 * said before the psalms (the full text is always said after, regardless
 * of rank).
 *
 * Only asks whether the day's *winner* (not a merely-commemorated feast)
 * is Double-or-higher — a privileged Sunday with nothing winning, or a
 * commemorated low-rank saint, both correctly return false here. A Sunday
 * being "privileged" doesn't by itself make this true; that's a
 * `TemporalCategory` question, not a `FeastClass` one.
 */
export function isDoubleOrHigher(winner: DayWinner): boolean {
  return winner.kind === 'sanctoral' && isAtLeast(winner.rank, 'duplex');
}

/**
 * Normalizes a word for flexa-boundary comparison only (never used for
 * display text): strips chant/sentence punctuation and folds accented Latin
 * vowels and digraphs to their plain form, mirroring Divinum Officium's own
 * `depunct` (see `getantcross` in the reference engine's horas.pl).
 */
function depunctFold(word: string): string {
  return word
    .replace(/[.,:;?!"'*()]/g, '')
    .toLowerCase()
    .replace(/[áà]/g, 'a')
    .replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óòöõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[æǽ]/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/j/g, 'i');
}

/**
 * Finds where, within a psalm's first verse, the words already said as the
 * opening antiphon (in whichever form — incipit or full — is actually being
 * displayed) leave off and the rest of the verse resumes. This is the flexa
 * mark's boundary: ported from Divinum Officium's `getantcross`/`depunct`
 * (horas.pl), which computes this at render time rather than storing it as
 * content, since it depends on which antiphon form the day's rank selects.
 *
 * Returns the character offset into `verseText` to insert the mark at, the
 * literal `'full'` when the antiphon's words consume the entire verse (the
 * mark then belongs at the start of the *next* verse instead — dangling it
 * at the end of this one would be meaningless), or `null` when there's no
 * word-for-word match (including when the antiphon is longer than the
 * verse, per the reference engine's own rule) and so no mark should appear.
 */
export function computeFlexaBoundary(verseText: string, antiphonText: string): number | 'full' | null {
  const verseWords = [...verseText.matchAll(/\S+/g)];
  const antWords = antiphonText.split(/\s+/).filter(Boolean);
  let pind = 0;
  let aind = 0;

  while (aind < antWords.length && pind < verseWords.length) {
    const verseWord = verseWords[pind]![0];
    pind++;
    const item1 = depunctFold(verseWord);
    if (!item1) continue;
    const antWord = antWords[aind]!;
    aind++;
    const item2 = depunctFold(antWord);
    if (!item2) {
      pind--;
      continue;
    }
    if (item1 !== item2) return null;
  }

  if (aind < antWords.length) return null; // antiphon is longer than the verse

  while (pind < verseWords.length && !depunctFold(verseWords[pind]![0])) pind++;
  if (pind >= verseWords.length) return 'full';

  return verseWords[pind]!.index!;
}

export interface FlexaMarked {
  verses: ResolvedVerse[];
  antiphon: ResolvedText | undefined;
}

/**
 * Applies the flexa boundary (see `computeFlexaBoundary`) to a psalm's
 * verses, per language, based on the antiphon actually being displayed for
 * it — and, so the same boundary reads consistently at both ends of it, also
 * appends the mark to the end of the displayed antiphon text itself (the
 * reference engine only ever marks the psalm side — `antetpsalm` in its
 * `specials/psalmi.pl` pushes the antiphon's own display line before ever
 * computing the psalm-side boundary — but showing the mark at the close of
 * the antiphon too, not just where it resumes in the psalm, is this
 * project's own deliberate addition, by direct instruction).
 *
 * A no-op whenever there's no antiphon (only the first psalm in a set
 * carries one — see each hour's `resolvePart`) or no verses to mark.
 */
export function applyFlexaMark(verses: ResolvedVerse[], antiphon: ResolvedText | undefined): FlexaMarked {
  const first = verses[0];
  if (!antiphon || !first) return { verses, antiphon };
  const second = verses[1];

  let firstText = first.text;
  let secondText = second?.text;
  let antiphonText = antiphon.text;

  for (const lang of Object.keys(antiphon.text)) {
    const rawAntText = antiphon.text[lang];
    if (!rawAntText) continue;
    // splitNamedAntiphon bakes an "Ant. " display label directly into the
    // text (same convention as "V."/"R." on versicles) — strip it before
    // comparing, since it's never part of the psalm's own opening words.
    const antText = rawAntText.replace(/^Ant\.\s+/, '');
    const verseText = first.text[lang];
    if (!antText || !verseText) continue;
    const boundary = computeFlexaBoundary(verseText, antText);
    if (boundary === null) continue;

    antiphonText = { ...antiphonText, [lang]: `${rawAntText} ‡` };

    if (boundary === 'full') {
      const nextText = second?.text[lang];
      if (nextText) secondText = { ...secondText, [lang]: `‡ ${nextText}` };
      continue;
    }
    firstText = { ...firstText, [lang]: `${verseText.slice(0, boundary)}‡ ${verseText.slice(boundary)}` };
  }

  if (firstText === first.text && secondText === second?.text && antiphonText === antiphon.text) {
    return { verses, antiphon };
  }

  const updated = [...verses];
  updated[0] = { ...first, text: firstText };
  if (second && secondText) updated[1] = { ...second, text: secondText };
  const updatedAntiphon = antiphonText === antiphon.text ? antiphon : { ...antiphon, text: antiphonText };
  return { verses: updated, antiphon: updatedAntiphon };
}
