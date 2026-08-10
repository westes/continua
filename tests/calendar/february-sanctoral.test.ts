import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision, and for
// Feb 14/Feb 15 specifically, clear of the movable Ash-Wednesday-adjacent
// ferias too) — see data/calendar/saints/*.yml for per-saint source detail.
describe('February sanctoral pull (first pass)', () => {
  it('a saint with a proper collect but no proper antiphon wins outright, antiphon missing', () => {
    const day = resolveDay('2029-02-06'); // St. Dorothea
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-dorothea',
      name: 'St. Dorothea, Virgin and Martyr',
      rank: 'simplex',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("a saint with a proper antiphon but no proper collect resolves the collect as honestly missing", () => {
    const day = resolveDay('2029-02-05'); // St. Agatha
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-agatha',
      name: 'St. Agatha, Virgin and Martyr',
      rank: 'semiduplex',
    });
    expect(getDayCollect(day).status.en).toBe('missing');
  });

  it('the two Chair-of-Peter feasts (Rome, Antioch) are separate records with independently authored, matching content', () => {
    const rome = resolveDay('2029-01-18');
    const antioch = resolveDay('2029-02-22');
    expect(rome.winner.kind).toBe('sanctoral');
    expect(antioch.winner.kind).toBe('sanctoral');
    if (rome.winner.kind === 'sanctoral' && antioch.winner.kind === 'sanctoral') {
      expect(rome.winner.id).not.toBe(antioch.winner.id);
    }
    expect(getDayCollect(rome).text.en).toEqual(getDayCollect(antioch).text.en);
  });

  it('a vigil impeded by a privileged Lenten feria is not forced to win', () => {
    // The Vigil of St. Matthias (Feb 23) lands on the Ember Friday of
    // Lent's first week in 2029 — a privileged feria the vigil can't beat.
    const day = resolveDay('2029-02-23');
    expect(day.winner.kind).toBe('temporal');
  });
});
