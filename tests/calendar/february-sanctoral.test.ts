import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision, and for
// Feb 14/Feb 15 specifically, clear of the movable Ash-Wednesday-adjacent
// ferias too) — see data/calendar/saints/*.yml for per-saint source detail.
describe('February sanctoral pull (first pass)', () => {
  it("St. Titus (Divino Afflatu's own occupant of this MM-DD slot, added alongside St. Dorothea) wins outright at Duplex over Dorothea's Simplex, commemorating her instead", () => {
    const day = resolveDay('2029-02-06');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-titus',
      name: 'St. Titus, Bishop and Confessor',
      nameLa: 'Sanctus Titus, Episcopus et Confessor',
      rank: 'duplex',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-dorothea', name: 'St. Dorothea, Virgin and Martyr', nameLa: 'Sancta Dorothea, Virgo et Martyr', rank: 'simplex' },
    ]);
  });

  it('a saint with a proper antiphon but no proper collect resolves the collect via its Common category (collectCommon), not missing', () => {
    // Her own [Oratio] is @Commune/C6::s/N\./Agathæ/ -- a name-substituted
    // reference, not unique text -- confirmed identical to collect-c6.yml's
    // own template; wired via collectCommon (2026-08), postdating this
    // saint's own original authoring, which is why this used to be missing.
    // 2029 was the original proof year, but St. Andrew Corsini (added
    // 2026-08 -- see st-andrew-corsini.yml) transfers onto Feb 5 in years
    // where Sexagesima falls on his own Feb 4, and outranks Agatha
    // (Duplex vs. Semiduplex) when it does -- 2029 is now one of those
    // years. 2025 has no such collision.
    const day = resolveDay('2025-02-05'); // St. Agatha
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-agatha',
      name: 'St. Agatha, Virgin and Martyr',
      nameLa: 'Sancta Agatha, Virgo et Martyr',
      rank: 'semiduplex',
    });
    const collect = getDayCollect(day);
    expect(collect.status.en).toBe('verified');
    expect(collect.text.en).toContain('Agatha');
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
