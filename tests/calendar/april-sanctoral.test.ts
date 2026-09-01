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

  it('St. Mark is only ever commemorated, never wins, within the Easter Octave', () => {
    const day = resolveDay('2030-04-25');
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-mark', name: 'St. Mark, Evangelist', nameLa: 'Sanctus Marcus, Evangelista', rank: 'duplex-2-classis' },
    ]);
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
