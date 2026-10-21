import { describe, expect, it } from 'vitest';
import type { ScriptureChapter } from '../../src/scripture';

// Every chapter this project claims to have authored (via the bulk Vulgate/
// Douay-Rheims import, or by hand) must actually carry matching, verified
// text in both languages -- catches a bad join (mismatched verse pairing)
// or a chapter that got written with holes.
const modules = import.meta.glob<{ default: ScriptureChapter }>('../../src/data/scripture/*.yml', {
  eager: true,
});
const chapters = Object.values(modules).map((m) => m.default);

describe('src/data/scripture bulk import', () => {
  it('has at least the ~1000 chapters the bulk import produced', () => {
    expect(chapters.length).toBeGreaterThan(1000);
  });

  it('every chapter has verified la/en text for every verse, in ascending order', () => {
    const bad: string[] = [];
    for (const chapter of chapters) {
      const label = `${chapter.book} ${chapter.chapter}`;
      if (chapter.verses.length === 0) bad.push(`${label}: no verses`);
      const seenNumbers = new Set<number>();
      for (const verse of chapter.verses) {
        if (verse.status.la !== 'verified' || !verse.text.la?.length) bad.push(`${label}:${verse.n} la`);
        // A repeated verse number is a pointing-split half-verse (see
        // isa-33.yml/sir-36.yml): the Douay-Rheims translation isn't split
        // the same way, so it's attached wholly to the first half and the
        // second half is deliberately left without its own en text.
        if (!seenNumbers.has(verse.n) && (!['verified', 'draft'].includes(verse.status.en ?? '') || !verse.text.en?.length)) {
          bad.push(`${label}:${verse.n} en`);
        }
        seenNumbers.add(verse.n);
      }
      const numbers = chapter.verses.map((v) => v.n);
      if (numbers.some((n, i) => i > 0 && n < (numbers[i - 1] as number))) bad.push(`${label}: verses out of order`);
    }
    expect(bad).toEqual([]);
  });

  // The old "Unbound Bible" import sometimes glued a verse number onto the
  // start of the text ("21That they should…"), or put another verse's text or
  // a truncated fragment under a verse ("1O And…", "8oor of Ornan…"). Both
  // showed up as a leading digit. No real verse text begins with one.
  it('no verse text starts with a stray verse number', () => {
    const bad: string[] = [];
    for (const chapter of chapters) {
      for (const verse of chapter.verses) {
        if (/^\d/.test(verse.text.la ?? '')) bad.push(`${chapter.book}-${chapter.chapter}:${verse.n} la`);
        if (/^\d/.test(verse.text.en ?? '')) bad.push(`${chapter.book}-${chapter.chapter}:${verse.n} en`);
      }
    }
    expect(bad).toEqual([]);
  });
});
