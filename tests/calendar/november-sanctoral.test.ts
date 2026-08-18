import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('November sanctoral pull (first pass)', () => {
  it('All Saints wins outright with a real proper collect, backfilled this month', () => {
    const day = resolveDay('2025-11-01');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'all-saints', name: 'All Saints', rank: 'duplex-1-classis' });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Martin of Tours wins outright at Duplex majus with a real proper collect and antiphon, over a genuinely unwinnable stub', () => {
    const day = resolveDay('2025-11-11');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-martin-of-tours',
      name: 'St. Martin of Tours, Bishop and Confessor',
      rank: 'duplex-majus',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-menna', name: 'St. Menna, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('a monastic-calendar-specific reassignment (St. Emilian) displaces what the base Tridentine table gives to St. Martin I, Pope, who moves to a different date entirely', () => {
    const emilianDay = resolveDay('2025-11-12');
    expect(emilianDay.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-emilian',
      name: 'St. Emilian, Abbot',
      rank: 'duplex',
    });
    const martinIDay = resolveDay('2025-11-14');
    expect(martinIDay.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-martin-i',
      name: 'St. Martin I, Pope and Martyr',
      rank: 'semiduplex',
    });
  });

  it('All Saints of the Benedictine Order, a monastic-calendar-only addition absent from the base Tridentine table, wins outright at Duplex II. classis', () => {
    const day = resolveDay('2025-11-13');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'all-saints-of-the-benedictine-order',
      name: 'All Saints of the Order of St. Benedict',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([]);
  });

  it("St. Clement (Semiduplex) is commemorated on his own Sunday rather than transferring, so St. Chrysogonus's own following day is unaffected either way", () => {
    // Corrects an earlier, unverified assumption that a Semiduplex saint
    // landing on an ordinary Sunday transfers forward -- live-verified
    // (Divino Afflatu 1954) St. Clement is commemorated right there on
    // Nov 23 ("Commemoratio: S. Clementis Papæ et Martyris"), same
    // treatment Simplex already got (see calendar/commemorations.ts's
    // `ordinary-sunday` case). St. Felicitas (Simplex, also native to
    // Nov 23) is commemorated alongside him too, per this app's own
    // generous-commemoration design.
    const clean = resolveDay('2032-11-24'); // Nov 23, 2032 is not a Sunday
    expect(clean.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-chrysogonus',
      name: 'St. Chrysogonus, Martyr',
      rank: 'simplex',
    });
    const onceASunday = resolveDay('2025-11-23'); // a Sunday
    expect(onceASunday.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-24' });
    expect(onceASunday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-clement', name: 'St. Clement I, Pope and Martyr', rank: 'semiduplex' },
      { kind: 'sanctoral', id: 'st-felicitas', name: 'St. Felicitas, Martyr', rank: 'simplex' },
    ]);
    // St. Chrysogonus's own following day is untouched either way -- no
    // incoming transfer any more.
    const followingDay = resolveDay('2025-11-24');
    expect(followingDay.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-chrysogonus',
      name: 'St. Chrysogonus, Martyr',
      rank: 'simplex',
    });
    expect(followingDay.commemorations).toEqual([]);
  });

  it('St. Andrew wins outright at Duplex II. classis with a real proper collect and antiphon, commemorating the Advent feria itself in years his fixed date falls within Advent', () => {
    // 2026-11-30 is also the Monday within Advent I's own week that year
    // (privileged-feria-minor, see calendar/types.ts) -- the Advent feria
    // is commemorated back, confirmed against the live reference engine.
    const day = resolveDay('2026-11-30');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-andrew',
      name: 'St. Andrew, Apostle',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([{ kind: 'temporal', id: 'advent-1' }]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
