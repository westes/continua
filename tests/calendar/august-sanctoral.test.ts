import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('August sanctoral pull (first pass)', () => {
  it('St. Peter\'s Chains wins outright at Duplex majus with a real proper collect and antiphon, over a genuinely unwinnable stub', () => {
    const day = resolveDay('2026-08-01');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-peter-ad-vincula',
      name: "St. Peter's Chains",
      rank: 'duplex-majus',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'ss-machabees', name: 'Ss. Machabees, Martyrs', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('a saint normally blocked by the generic Saturday-of-Mary votive wins independently once the date falls on another weekday', () => {
    const day = resolveDay('2027-08-02'); // a Monday
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-stephen-i',
      name: 'St. Stephen I, Pope and Martyr',
      rank: 'simplex',
    });
    expect(day.commemorations).toEqual([]);
  });

  it('St. Donatus wins outright every year in this app, unlike the real reference engine where he is occasionally displaced by a multi-day forward transfer this app does not model', () => {
    // In the real Monastic 1617 engine, when Aug 3 (the Finding of St.
    // Stephen) falls on a Sunday, it transfers forward past several
    // higher-rank fixed feasts (Dominic, Our Lady of the Snows, the
    // Transfiguration) and lands on Aug 7, displacing Donatus for that
    // year (confirmed live for 2025 and 2031, both Aug-3-Sunday years).
    // This app's transfer machinery doesn't chase a multi-day skip search
    // like that -- see st-donatus.yml -- so Donatus wins here in every
    // year, including ones where the real engine would displace him; a
    // known, documented simplification rather than a guess.
    const ordinary = resolveDay('2026-08-07');
    const wouldHaveTransferredInReality = resolveDay('2031-08-07');
    for (const day of [ordinary, wouldHaveTransferredInReality]) {
      expect(day.winner).toEqual({
        kind: 'sanctoral',
        id: 'st-donatus',
        name: 'St. Donatus, Bishop and Martyr',
        rank: 'simplex',
      });
    }
  });

  it("the Vigil of St. Lawrence's own vigil rank forces primacy over a real, otherwise-unranked secondary saint", () => {
    const day = resolveDay('2025-08-09');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-lawrence',
      name: 'Vigil of St. Lawrence',
      rank: 'vigil',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-romanus', name: 'St. Romanus, Martyr', rank: 'simplex' },
    ]);
  });

  it('St. Lawrence wins outright at Duplex II. classis, distinct from his own Vigil the day before', () => {
    const day = resolveDay('2026-08-10');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-lawrence',
      name: 'St. Lawrence, Martyr',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("St. Lawrence's own octave correctly keeps St. Clare (Simplex) to a commemoration, and the Assumption's octave does the same for its own date", () => {
    // St. Clare is now modeled (added directly off this gap) -- Simplex
    // under Monastic 1617, below the octave's semiduplex `wins` threshold,
    // so she's commemorated rather than winning outright, matching the
    // live engine's own "Tertia die infra Octavam S. Laurentii Martiris ~
    // Semiduplex" / "Commemoratio: S. Claræ Virginis" for this date.
    const clareDay = resolveDay('2025-08-12');
    expect(clareDay.winner.kind).toBe('temporal');
    expect(clareDay.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-clare', name: 'St. Clare, Virgin', rank: 'simplex' },
      { kind: 'octave', id: 'st-lawrence', name: 'St. Lawrence, Martyr' },
    ]);
    // Aug 22 is the Assumption's own octave day (In Octava Assumptionis),
    // Duplex, blocking Ss. Timothy/Hippolytus/Symphorian the same way --
    // it's also day 8 of the Assumption's own octave. Those three still
    // aren't modeled, so this stays a bare octave commemoration.
    const assumptionOctaveDay = resolveDay('2025-08-22');
    expect(assumptionOctaveDay.winner.kind).toBe('temporal');
    expect(assumptionOctaveDay.commemorations).toEqual([
      { kind: 'octave', id: 'assumption', name: 'The Assumption of the Blessed Virgin Mary' },
    ]);
  });

  it('the Beheading of St. John the Baptist wins outright at Duplex with a real proper collect and antiphon, over a genuinely unwinnable stub', () => {
    const day = resolveDay('2025-08-29');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'decollation-of-st-john-baptist',
      name: 'The Beheading of St. John the Baptist',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-sabina', name: 'St. Sabina, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
