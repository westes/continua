import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';

// Direct instruction: on a free Saturday, "Our Lady's Saturday" mirrors
// privileged-feria-minor exactly — Semiduplex-or-higher still wins
// outright (Marian Saturday doesn't happen); below that (Simplex, and
// Vigil, since both are below semiduplex in the FeastClass scale), the
// saint loses and is commemorated instead.
describe('Marian Saturday (applyMarianSaturday)', () => {
  it('wins outright, with no commemoration, on a Saturday with nothing else at all going on', () => {
    const day = resolveDay('2026-10-24');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.commemorations).toEqual([]);
    expect(getDayLabel(day)).toBe("Our Lady's Saturday");
  });

  it('wins over a Simplex saint, who is commemorated instead of winning outright', () => {
    const day = resolveDay('2026-06-20'); // St. Silverius, Pope and Martyr, Simplex
    expect(day.winner).toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-silverius', name: 'St. Silverius, Pope and Martyr', rank: 'simplex' },
    ]);
  });

  it('wins over a Vigil too (below semiduplex, same as Simplex) -- can commemorate more than one loser at once', () => {
    const day = resolveDay('2025-11-29'); // St. Saturninus (Simplex) + Vigil of St. Andrew
    expect(day.winner).toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-saturninus', name: 'St. Saturninus, Martyr', rank: 'simplex' },
      { kind: 'sanctoral', id: 'vigil-of-st-andrew', name: 'Vigil of St. Andrew', rank: 'vigil' },
    ]);
  });

  it('loses outright to a Semiduplex-or-higher saint -- Marian Saturday does not apply at all', () => {
    const day = resolveDay('2026-09-19'); // St. Januarius, Semiduplex
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-januarius',
      name: 'St. Januarius, Bishop, and Companions, Martyrs',
      rank: 'semiduplex',
    });
  });

  it('never applies to a Saturday with real standing of its own (privileged season, Ember days, ...)', () => {
    const day = resolveDay('2026-02-28'); // Lenten Ember Saturday
    expect(day.winner).not.toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.temporalCategory).toBe('privileged-feria');
  });

  it('never applies while an octave is active, even on an otherwise-eligible Saturday (Pentecost Ember Saturday stays governed by its octave)', () => {
    const day = resolveDay('2026-05-30');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'pentecost-sunday' });
  });

  it('never applies on a weekday other than Saturday', () => {
    const day = resolveDay('2026-10-23'); // the Friday before the clean Marian Saturday above
    expect(day.winner).not.toEqual({ kind: 'temporal', id: 'marian-saturday' });
  });
});
