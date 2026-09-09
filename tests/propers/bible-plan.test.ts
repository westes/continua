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
    expect(readings[2]?.citation.en).toBe('Luke 18:1-23');
    // Latin column uses the Vulgate-canonical book abbreviation, not the
    // English-preferred one the store's own book key is authored with.
    expect(readings[2]?.citation.la).toBe('Luc 18:1-23');
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
    expect(readings[0]?.citation.en).toBe('Jdt 11-13');
    // Latin column: canonicalBook('jdt') -> 'jdth', the Vulgate-canonical form.
    expect(readings[0]?.citation.la).toBe('Jdth 11-13');
    expect(readings[0]?.label?.en).toBe('A reading from the book of Judith');
    expect(readings[0]?.label?.la).toBe('Léctio libri Judith');
  });
});

// The Advent reading plan has 28 rows (advent-1-sunday through
// advent-4-saturday, a full 4-week Advent), but real Advent is never that
// long -- its last real day is always Dec 23 (Dec 24 is the Vigil of
// Christmas's own temporal id), while Advent 1 Sunday itself lands anywhere
// from Nov 27 to Dec 3. Even the longest possible Advent (Nov 27) is 27
// real days, one short of the full plan; the shortest (Dec 3) is 21, a
// whole week short. Whatever doesn't land on its own natural date carries
// forward one reading per day starting Christmas Day, pooled alongside
// whatever Christmastide's own calendar-dated rows already have. User
// direction, 2026-09-05: "for advent only, we need to show all of those
// chapters," accepting the spillover into Christmastide as the trade-off.
describe('Advent reading-plan carryover into Christmastide', () => {
  it('a short Advent (2028: Advent 1 Sunday = Dec 3, latest possible) carries all 7 of week 4\'s readings forward, one per day', () => {
    const isaiahCitations = [25, 26, 27, 28, 29, 30, 31].map(
      (day) => getBiblePlanReadings('christmas-octave-sunday', 'monday', `2028-12-${day}`).find((r) => r.citation.la?.startsWith('Isa'))?.citation.la,
    );
    expect(isaiahCitations).toEqual(['Isa 46-48', 'Isa 49-51', 'Isa 52-54', 'Isa 55-57', 'Isa 58-60', 'Isa 61-63', 'Isa 64-66']);
  });

  it('a long Advent (2027: Advent 1 Sunday = Nov 28, near-earliest) carries only the last 2 readings forward', () => {
    const isaiahCitations = [25, 26, 27, 28].map(
      (day) => getBiblePlanReadings('christmas-octave-sunday', 'monday', `2027-12-${day}`).find((r) => r.citation.la?.startsWith('Isa'))?.citation.la,
    );
    expect(isaiahCitations).toEqual(['Isa 61-63', 'Isa 64-66', undefined, undefined]);
  });

  it('carried-over readings pool alongside Christmastide\'s own calendar-dated rows, never replacing them', () => {
    const readings = getBiblePlanReadings('christmas-octave-sunday', 'friday', '2028-12-25');
    expect(readings.map((r) => r.citation.la)).toEqual(['Cant 1', 'Isa 46-48']);
  });

  it('does not carry anything over before Christmas Day', () => {
    const readings = getBiblePlanReadings('vigil-of-christmas', 'thursday', '2028-12-24');
    expect(readings.find((r) => r.citation.la?.startsWith('Isa'))).toBeUndefined();
  });
});
