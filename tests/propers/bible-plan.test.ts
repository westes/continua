import { describe, expect, it } from 'vitest';
import { getBiblePlanReadings } from '../../src/propers/bible-plan';

describe('getBiblePlanReadings citation labels', () => {
  const readings = getBiblePlanReadings('post-pentecost-14', 'thursday', '2026-09-17');

  it('collapses a consecutive multi-chapter run of the same book into a range', () => {
    expect(readings[0]?.citation.la).toBe('Job 34-37');
    expect(readings[0]?.citation.en).toBe('Job 34-37');
  });

  it('leaves a single-chapter reading unchanged', () => {
    expect(readings[1]?.citation.la).toBe('Sir 42');
  });

  it('leaves a verse-qualified citation unchanged, never merged into a range', () => {
    expect(readings[2]?.citation.la).toBe('Luke 18:1-23');
  });
});

// A reading's `label` (the "Léctio libri..." incipit) previously looked up
// bible-book-incipits.ts's canonical-abbreviation-only table using the raw
// book abbreviation from data/hours/bible-plan/*.yml -- which, for ~30
// books, is one of scripture/index.ts's own English-style aliases (e.g.
// "jdt" for Judith), not the canonical form ("jdth") that table is keyed
// by. The alias resolved verse *text* fine (getScriptureChapter already
// consulted the alias table) but silently missed the label lookup,
// rendering as the generic "Reading" heading instead -- live case: Sept
// 18 2026's own Ember Friday commemoration, `post-pentecost-16-friday`'s
// first reading (Judith 11-13). Fixed 2026-09-03 by routing both the
// incipit and responsory lookups through scripture/index.ts's own
// `canonicalBook`, the same normalization the text lookup already used.
describe('getBiblePlanReadings label uses the same book-alias normalization as verse-text lookup', () => {
  it('an aliased book ("jdt" for Judith) still gets its real incipit label, not the generic fallback', () => {
    const readings = getBiblePlanReadings('post-pentecost-16', 'friday', '2026-09-18');
    expect(readings[0]?.citation.la).toBe('Jdt 11-13');
    expect(readings[0]?.label?.en).toBe('A reading from the book of Judith');
    expect(readings[0]?.label?.la).toBe('Léctio libri Judith');
  });
});
