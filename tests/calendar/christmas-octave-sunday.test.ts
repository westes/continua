import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';

// Per direct instruction: within Dec 26-30 inclusive, exactly one date is
// genuinely the Sunday within the Octave of the Nativity each year. That
// date always wins outright as Nat1-0 (christmas-octave-sunday), no rank
// check at all -- a deliberate departure from Monastic 1617 itself, which
// lets a Duplex-II-classis saint (Stephen/John/Innocents) beat the Sunday
// there (see tests/calendar/december-sanctoral.test.ts's own Dec 31/St.
// Silvester test for where that live-verified rule is still real, outside
// this window). The displaced saint isn't commemorated in place -- he
// reappears in full on Dec 30, the block's one date with no fixed saint of
// its own.
describe('applyChristmasOctaveSunday', () => {
  it('Sunday on Dec 26 (St. Stephen, Duplex II. classis): Nat1-0 wins outright, Stephen not even commemorated, and reappears in full on Dec 30', () => {
    const sunday = resolveDay('2021-12-26');
    expect(sunday.weekday).toBe('sunday');
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'christmas-octave-sunday' });
    expect(sunday.commemorations.some((c) => c.kind === 'sanctoral')).toBe(false);

    const dec30 = resolveDay('2021-12-30');
    expect(dec30.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-stephen-protomartyr',
      name: 'St. Stephen, Protomartyr',
      nameLa: 'Sanctus Stephanus, Protomartyr',
      rank: 'duplex-2-classis',
    });
    // The now-redundant "Octave of St. Stephen" commemoration (which
    // would otherwise have been pushed by applyOctaves, using Dec 30's
    // *original* temporal winner) is dropped -- he's the day's own
    // winner now, not merely commemorated alongside himself.
    expect(dec30.commemorations.some((c) => c.kind === 'octave' && c.id === 'st-stephen-protomartyr')).toBe(false);
    // The other, still-genuinely-separate octaves remain.
    expect(dec30.commemorations.map((c) => (c.kind === 'octave' ? c.id : undefined))).toEqual([
      'christmas-day',
      'st-john-apostle',
      'holy-innocents',
    ]);
  });

  it('Sunday on Dec 27 (St. John, Duplex II. classis): same shape', () => {
    const sunday = resolveDay('2020-12-27');
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'christmas-octave-sunday' });

    const dec30 = resolveDay('2020-12-30');
    expect(dec30.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-john-apostle',
      name: 'St. John, Apostle and Evangelist',
      nameLa: 'Sanctus Joannes, Apostolus et Evangelista',
      rank: 'duplex-2-classis',
    });
    expect(dec30.commemorations.some((c) => c.kind === 'octave' && c.id === 'st-john-apostle')).toBe(false);
  });

  it('Sunday on Dec 28 (Holy Innocents, Duplex II. classis): same shape', () => {
    const sunday = resolveDay('2025-12-28');
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'christmas-octave-sunday' });

    const dec30 = resolveDay('2025-12-30');
    expect(dec30.winner).toEqual({
      kind: 'sanctoral',
      id: 'holy-innocents',
      name: 'The Holy Innocents, Martyrs',
      nameLa: 'Sancti Innocentes, Martyres',
      rank: 'duplex-2-classis',
    });
    expect(dec30.commemorations.some((c) => c.kind === 'octave' && c.id === 'holy-innocents')).toBe(false);
  });

  it('Sunday on Dec 29 (St. Thomas Becket): still fully displaced to Dec 30, same as the Duplex-II-classis saints -- rank never matters for this rule', () => {
    const sunday = resolveDay('2024-12-29');
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'christmas-octave-sunday' });

    const dec30 = resolveDay('2024-12-30');
    expect(dec30.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-thomas-becket',
      name: 'St. Thomas of Canterbury, Bishop and Martyr',
      nameLa: 'Sanctus Thomas Cantuariensis, Episcopus et Martyr',
      rank: 'duplex',
    });
  });

  it('Sunday on Dec 30 itself: nothing to displace, resolves clean', () => {
    const dec30 = resolveDay('2029-12-30');
    expect(dec30.weekday).toBe('sunday');
    expect(dec30.winner).toEqual({ kind: 'temporal', id: 'christmas-octave-sunday' });
    // All four octaves still commemorated normally -- nothing was ever
    // assigned to Dec 30 itself, so there's nothing to drop.
    expect(dec30.commemorations.map((c) => (c.kind === 'octave' ? c.id : undefined))).toEqual([
      'christmas-day',
      'st-stephen-protomartyr',
      'st-john-apostle',
      'holy-innocents',
    ]);
  });

  it('Dec 26-29 keep their own fixed saint outright on a year none of them is the Sunday, unaffected by this rule at all', () => {
    // 2029: the Sunday is Dec 30, so Dec 26-29 each just resolve normally.
    expect(resolveDay('2029-12-26').winner).toEqual({
      kind: 'sanctoral',
      id: 'st-stephen-protomartyr',
      name: 'St. Stephen, Protomartyr',
      nameLa: 'Sanctus Stephanus, Protomartyr',
      rank: 'duplex-2-classis',
    });
    expect(resolveDay('2029-12-29').winner).toEqual({
      kind: 'sanctoral',
      id: 'st-thomas-becket',
      name: 'St. Thomas of Canterbury, Bishop and Martyr',
      nameLa: 'Sanctus Thomas Cantuariensis, Episcopus et Martyr',
      rank: 'duplex',
    });
  });

  it('never touches Dec 31 or Jan 1, outside its own Dec 26-30 scope', () => {
    // St. Silvester (Dec 31) still wins outright via the plain
    // ordinary-sunday rule even in a year Dec 31 is the Sunday -- see
    // tests/calendar/december-sanctoral.test.ts for this one directly.
    const dec31 = resolveDay('2023-12-31');
    expect(dec31.winner.kind).toBe('sanctoral');
  });
});
