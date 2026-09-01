import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision, and clear of
// the movable Holy Week/Easter Octave that usually overshadows several of
// them) — see data/calendar/saints/*.yml for per-saint source detail.
describe('April sanctoral pull (first pass)', () => {
  it('St. Mark wins outright with a real proper collect on an ordinary date', () => {
    const day = resolveDay('2042-04-25');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-mark',
      name: 'St. Mark, Evangelist',
      nameLa: 'Sanctus Marcus, Evangelista',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Mark gets nothing at all within the Easter Octave — not even a bare commemoration — and surfaces on the 1st day of the Easter-octave backlog instead', () => {
    // Corrected 2026-09-01: nothing is ever commemorated anywhere from
    // Palm Sunday through Low Sunday, no exception for any rank (direct
    // instruction; live-verified against the Annunciation on Holy
    // Thursday and Chair of St. Peter at Antioch on Ash Wednesday, both
    // Duplex-majus+ and both transferring with zero commemoration). Per
    // further direct instruction the same day, this doesn't cascade
    // day-by-day looking for a free day: the Nth day after Low Sunday
    // celebrates the Nth candidate that cleared the backlog's own
    // duplex-majus+ floor that year (native-date order), winning
    // outright and demoting whatever would have natively been there to
    // a commemoration — see calendar/index.ts's `applyEasterOctaveBacklog`.
    // Mark (Duplex II. classis, well above the floor) is the only
    // candidate in 2030's own backlog, so he lands the 1st day after Low
    // Sunday (Apr 28 that year) outright.
    const native = resolveDay('2030-04-25');
    expect(native.winner).toEqual({ kind: 'temporal', id: 'easter-sunday' });
    expect(native.commemorations).toEqual([]);
    expect(native.transferredAway?.candidate.id).toBe('st-mark');

    const landing = resolveDay('2030-04-29');
    expect(landing.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-mark',
      name: 'St. Mark, Evangelist',
      nameLa: 'Sanctus Marcus, Evangelista',
      rank: 'duplex-2-classis',
      transferredFrom: '2030-04-25',
    });
    // St. Robert, native to this day, is demoted to a commemoration
    // rather than winning or being skipped past.
    expect(landing.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-robert')).toBe(true);
  });

  it('St. Robert beats St. Catherine of Siena on their shared monastic-calendar date', () => {
    const day = resolveDay('2043-04-29');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-robert', name: 'St. Robert, Abbot', nameLa: 'Sanctus Robertus, Abbas', rank: 'duplex' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-catherine-of-siena', name: 'St. Catherine of Siena, Virgin', nameLa: 'Sancta Catharina Senensis, Virgo', rank: 'simplex' },
    ]);
  });

  it('an ordinary Eastertide Sunday (not Easter Day, not within its Octave) still lets St. Robert (plain Duplex) win outright, same as any weekday', () => {
    // 2029: Apr 29 is an ordinary (not privileged) Sunday in Eastertide —
    // live-verified 2026-09-01 (`eastertide`'s own `bySeason` entry, see
    // data/calendar/temporal-categories.yml): "S. Roberti Abbatis ~
    // Duplex" wins outright there, same as data/calendar/temporal-
    // categories.yml's `ordinary-sunday` rule for any other season, with
    // the Sunday itself only noted as a `Scriptura` line, not primary.
    const sunday = resolveDay('2029-04-29');
    expect(sunday.winner).toEqual({ kind: 'sanctoral', id: 'st-robert', name: 'St. Robert, Abbot', nameLa: 'Sanctus Robertus, Abbas', rank: 'duplex' });
    expect(sunday.commemorations).toEqual([
      { kind: 'temporal', id: 'easter-5' },
      { kind: 'sanctoral', id: 'st-catherine-of-siena', name: 'St. Catherine of Siena, Virgin', nameLa: 'Sancta Catharina Senensis, Virgo', rank: 'simplex' },
    ]);

    // Apr 30 resolves St. Peter Martyr cleanly on his own day — no
    // transferred-Robert collision, since Robert already won on the 29th.
    const monday = resolveDay('2029-04-30');
    expect(monday.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-peter-martyr',
      name: 'St. Peter Martyr, Martyr',
      nameLa: 'Sanctus Petrus Martyr, Martyr',
      rank: 'semiduplex',
    });
    expect(monday.commemorations).toEqual([]);
  });
});
