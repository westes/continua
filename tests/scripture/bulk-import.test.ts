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

  it.each(chapters.map((c) => [`${c.book} ${c.chapter}`, c] as const))(
    '%s has verified la/en text for every verse, in ascending order, with at most a couple of isolated en gaps',
    (_label, chapter) => {
      expect(chapter.verses.length).toBeGreaterThan(0);
      const seenNumbers = new Set<number>();
      let distinctMissingEn = 0;
      for (const verse of chapter.verses) {
        expect(verse.status.la).toBe('verified');
        expect(verse.text.la?.length).toBeGreaterThan(0);
        // A repeated verse number is a pointing-split half-verse (see
        // isa-33.yml/sir-36.yml): the Douay-Rheims translation isn't split
        // the same way, so it's attached wholly to the first half and the
        // second half is deliberately left without its own en text. A
        // handful of chapters also carry a genuine, isolated single-verse
        // gap in the "Unbound Bible" Douay-Rheims source itself (e.g. an
        // in-file "Transfer interrupted!" corruption artifact at matt-12:43)
        // -- tolerated the same honest-missing way, distinct from the
        // source's occasional *block* corruption (several consecutive
        // verses mislabeled/merged), which the bulk-import script refuses
        // to author from at all rather than risk silently misnumbered text.
        if (!seenNumbers.has(verse.n)) {
          if (verse.status.en === 'verified' || verse.status.en === 'draft') {
            // 'draft' covers a handful of verses the source's own English
            // file left untranslated (2026-09-14 sweep) -- real text
            // supplied by hand rather than sourced from Divinum Officium,
            // so marked draft, not verified, but never blank.
            expect(verse.text.en?.length).toBeGreaterThan(0);
          } else {
            expect(verse.status.en).toBe('missing');
            expect(verse.text.en ?? '').toBe('');
            distinctMissingEn += 1;
          }
        }
        seenNumbers.add(verse.n);
      }
      expect(distinctMissingEn).toBeLessThanOrEqual(2);
      const numbers = chapter.verses.map((v) => v.n);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    },
  );
});
