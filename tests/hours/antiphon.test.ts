import { describe, expect, it } from 'vitest';
import { applyFlexaMark, computeFlexaBoundary } from '../../src/hours/antiphon';
import type { ResolvedText, ResolvedVerse } from '../../src/hours/types';

describe('computeFlexaBoundary', () => {
  it('finds the boundary after an exact word-for-word prefix match', () => {
    const boundary = computeFlexaBoundary(
      'The king rejoices in thy strength, O Lord; * and in thy salvation he shall rejoice exceedingly.',
      'The king rejoices',
    );
    expect(boundary).not.toBeNull();
    expect(boundary).not.toBe('full');
    const text = 'The king rejoices in thy strength, O Lord; * and in thy salvation he shall rejoice exceedingly.';
    expect(text.slice(boundary as number)).toBe('in thy strength, O Lord; * and in thy salvation he shall rejoice exceedingly.');
  });

  it('matches accented Latin words against their unaccented/depunctuated form', () => {
    const boundary = computeFlexaBoundary('Dómine, in virtúte tua lætábitur rex: * et super salutáre tuum exsultábit veheménter.', 'Dómine');
    expect(boundary).not.toBeNull();
    expect(boundary).not.toBe('full');
  });

  it('returns null when the antiphon is longer than the verse', () => {
    const boundary = computeFlexaBoundary('Short verse text here.', 'Short verse text here and then some more words');
    expect(boundary).toBeNull();
  });

  it('returns null when the words diverge', () => {
    const boundary = computeFlexaBoundary('Dixit Dominus Domino meo.', 'Laudate pueri Dominum');
    expect(boundary).toBeNull();
  });

  it("returns 'full' when the antiphon consumes the entire verse", () => {
    const boundary = computeFlexaBoundary('Dixit Dominus Domino meo.', 'Dixit Dominus Domino meo.');
    expect(boundary).toBe('full');
  });

  it('skips over trailing punctuation-only tokens before the boundary', () => {
    // A stray standalone punctuation token between the matched words and
    // the next real word shouldn't become the insertion point itself.
    const text = 'Alpha beta : gamma delta.';
    const boundary = computeFlexaBoundary(text, 'Alpha beta');
    expect(boundary).not.toBeNull();
    expect(boundary).not.toBe('full');
    expect(text.slice(boundary as number)).toBe('gamma delta.');
  });
});

describe('applyFlexaMark', () => {
  const verse = (n: number, la: string, en: string): ResolvedVerse => ({
    n,
    text: { la, en },
    status: { la: 'verified', en: 'verified' },
  });
  const antiphon = (la: string, en: string): ResolvedText => ({
    text: { la, en },
    status: { la: 'verified', en: 'verified' },
  });

  it('inserts the flexa mark into the first verse at the matched boundary, per language', () => {
    const verses = [verse(2, 'Dómine, in virtúte tua lætábitur rex: * et super salutáre tuum exsultábit veheménter.', 'The king rejoices in thy strength, O Lord; * and in thy salvation he shall rejoice exceedingly.')];
    const result = applyFlexaMark(verses, antiphon('Ant. Dómine', 'Ant. The king rejoices'));
    expect(result.verses[0]!.text.la).toBe('Dómine, ‡ in virtúte tua lætábitur rex: * et super salutáre tuum exsultábit veheménter.');
    expect(result.verses[0]!.text.en).toBe('The king rejoices ‡ in thy strength, O Lord; * and in thy salvation he shall rejoice exceedingly.');
  });

  it('also appends the mark to the end of the displayed antiphon text, in both languages', () => {
    const verses = [verse(2, 'Dómine, in virtúte tua lætábitur rex: * et super salutáre tuum exsultábit veheménter.', 'The king rejoices in thy strength, O Lord; * and in thy salvation he shall rejoice exceedingly.')];
    const result = applyFlexaMark(verses, antiphon('Ant. Dómine', 'Ant. The king rejoices'));
    expect(result.antiphon?.text.la).toBe('Ant. Dómine ‡');
    expect(result.antiphon?.text.en).toBe('Ant. The king rejoices ‡');
  });

  it('is a no-op when no antiphon is given', () => {
    const verses = [verse(2, 'Dómine, in virtúte tua lætábitur rex.', 'The king rejoices in thy strength.')];
    const result = applyFlexaMark(verses, undefined);
    expect(result.verses).toBe(verses);
    expect(result.antiphon).toBeUndefined();
  });

  it('is a no-op when the antiphon does not share opening words with the verse', () => {
    const verses = [verse(1, 'Beátus vir qui non ábiit in consílio impiórum.', 'Blessed is the man who hath not walked in the counsel of the ungodly.')];
    const theAntiphon = antiphon('Ant. Fidélia', 'Ant. Faithful');
    const result = applyFlexaMark(verses, theAntiphon);
    expect(result.verses).toEqual(verses);
    expect(result.antiphon).toBe(theAntiphon);
  });

  it('moves the mark to the start of the second verse when the antiphon matches the entire first verse', () => {
    const verses = [
      verse(2, 'Dixit Dóminus Dómino meo:', 'The Lord said to my Lord:'),
      verse(3, 'Sede a dextris meis.', 'Sit thou at my right hand.'),
    ];
    const result = applyFlexaMark(verses, antiphon('Ant. Dixit Dóminus Dómino meo:', 'Ant. The Lord said to my Lord:'));
    expect(result.verses[0]!.text.la).toBe('Dixit Dóminus Dómino meo:');
    expect(result.verses[1]!.text.la).toBe('‡ Sede a dextris meis.');
    expect(result.verses[1]!.text.en).toBe('‡ Sit thou at my right hand.');
    expect(result.antiphon?.text.la).toBe('Ant. Dixit Dóminus Dómino meo: ‡');
  });
});
