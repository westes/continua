import { describe, expect, it } from 'vitest';
import { getScriptureChapter, getScriptureVerses } from '../../src/scripture';

describe('getScriptureVerses', () => {
  it('resolves a verse range within an authored chapter', () => {
    const verses = getScriptureVerses('ezek', 1, '4-6');
    expect(verses.map((v) => v.n)).toEqual([4, 5, 6]);
    expect(verses[0]?.text.la).toContain('túrbinis');
  });

  it('resolves the whole chapter when no range is given', () => {
    expect(getScriptureVerses('ezek', 1).length).toBe(9);
  });

  it('includes a verse that appears twice in the source at the same number (a real Vulgate numbering quirk, not a bug)', () => {
    const verses = getScriptureVerses('sap', 4, '13-16');
    expect(verses.filter((v) => v.n === 14).length).toBe(2);
  });

  it('is empty, not throwing, for an unauthored book/chapter', () => {
    expect(getScriptureVerses('gen', 1)).toEqual([]);
    expect(getScriptureChapter('gen', 1)).toBeUndefined();
  });
});
