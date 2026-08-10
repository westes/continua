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
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Mark is only ever commemorated, never wins, within the Easter Octave', () => {
    const day = resolveDay('2030-04-25');
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-mark', name: 'St. Mark, Evangelist', rank: 'duplex-2-classis' },
    ]);
  });

  it('St. Robert beats St. Catherine of Siena on their shared monastic-calendar date', () => {
    const day = resolveDay('2043-04-29');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-robert', name: 'St. Robert, Abbot', rank: 'duplex' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-catherine-of-siena', name: 'St. Catherine of Siena, Virgin', rank: 'simplex' },
    ]);
  });

  it('a privileged Eastertide Sunday bumps even St. Robert (plain Duplex, not Duplex majus) to transfer forward', () => {
    // 2029: Apr 29 is a privileged Sunday in Eastertide, so Robert can't
    // win or be commemorated there — he transfers to Monday and wins the
    // collision against St. Peter Martyr instead.
    const sunday = resolveDay('2029-04-29');
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'easter-5' });
    expect(sunday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-catherine-of-siena', name: 'St. Catherine of Siena, Virgin', rank: 'simplex' },
    ]);

    const monday = resolveDay('2029-04-30');
    expect(monday.winner).toEqual({ kind: 'sanctoral', id: 'st-robert', name: 'St. Robert, Abbot', rank: 'duplex' });
    expect(monday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-peter-martyr', name: 'St. Peter Martyr, Martyr', rank: 'semiduplex' },
    ]);
  });
});
