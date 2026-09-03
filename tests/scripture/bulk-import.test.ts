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
    '%s has verified la/en text for every verse, in ascending order with no gaps',
    (_label, chapter) => {
      expect(chapter.verses.length).toBeGreaterThan(0);
      const seenNumbers = new Set<number>();
      for (const verse of chapter.verses) {
        expect(verse.status.la).toBe('verified');
        expect(verse.text.la?.length).toBeGreaterThan(0);
        // A repeated verse number is a pointing-split half-verse (see
        // isa-33.yml/sir-36.yml): the Douay-Rheims translation isn't split
        // the same way, so it's attached wholly to the first half and the
        // second half is deliberately left without its own en text.
        if (!seenNumbers.has(verse.n)) {
          expect(verse.status.en).toBe('verified');
          expect(verse.text.en?.length).toBeGreaterThan(0);
        }
        seenNumbers.add(verse.n);
      }
      const numbers = chapter.verses.map((v) => v.n);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    },
  );
});
