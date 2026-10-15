import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';

// Direct instruction: on a free Saturday, "Our Lady's Saturday" is really
// only a Simplex-strength standing — a Simplex saint alone loses to it
// and is commemorated instead; anything Semiduplex-or-higher, or a Vigil
// (which keeps forcing its own primacy the same way it does any other
// day), still wins outright and Marian Saturday doesn't apply at all.
describe('Marian Saturday (applyMarianSaturday)', () => {
  it('wins outright, with no commemoration, on a Saturday with nothing else at all going on', () => {
    // Not 2026-10-24: that date is now St. Raphael the Archangel's own
    // fixed day (Duplex majus, added per the full-year sanctoral
    // import), which wins outright. 2026-07-04 is a genuinely clean
    // Saturday with no sanctoral entry at all (not even a commemorated
    // Simplex).
    const day = resolveDay('2026-07-04');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.commemorations).toEqual([]);
    expect(getDayLabel(day).en).toBe("Our Lady's Saturday (Simplex)");
  });

  it('wins over a Simplex saint, who is commemorated instead of winning outright', () => {
    const day = resolveDay('2026-02-14'); // St. Valentine, Priest and Martyr, Simplex
    expect(day.winner).toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-valentine', name: 'St. Valentine, Priest and Martyr', nameLa: 'Sanctus Valentinus, Presbyter et Martyr', rank: 'simplex' },
    ]);
  });

  it('loses to a Vigil, which keeps forcing its own primacy on a Saturday same as any other day -- Marian Saturday does not apply', () => {
    // 2025-11-29: Vigil of St. Andrew collides with St. Gelasius I
    // (Simplex) via calendar/collision.ts (Vigil outranks Simplex there)
    // before Marian Saturday even gets a look-in -- Vigil wins outright,
    // Gelasius is commemorated as the collision's loser, not by Marian
    // Saturday's own demotion rule.
    const day = resolveDay('2025-11-29');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-andrew',
      name: 'Vigil of St. Andrew',
      nameLa: 'Vigilia Sancti Andreæ',
      rank: 'vigil',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-gelasius-i', name: 'St. Gelasius I, Pope and Confessor', nameLa: 'Sanctus Gelásius I, Papa et Confessor', rank: 'simplex' },
    ]);
  });

  it('loses outright to a Semiduplex-or-higher saint -- Marian Saturday does not apply at all', () => {
    // Not 2026-09-19: that's now September Ember Saturday
    // (`privileged-feria-ember`, Duplex threshold as of 2026-09-18), so
    // St. Januarius (Semiduplex) no longer wins outright there and Marian
    // Saturday's own `ordinary-feria` gate would exclude it anyway.
    // 2026-01-24 is a genuinely ordinary Saturday.
    const day = resolveDay('2026-01-24'); // St. Timothy, Bishop and Martyr, Semiduplex
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-timothy',
      name: 'St. Timothy, Bishop and Martyr',
      nameLa: 'Sanctus Timotheus, Episcopus et Martyr',
      rank: 'semiduplex',
    });
  });

  it('never applies to a Saturday with real standing of its own (privileged season, Ember days, ...)', () => {
    const day = resolveDay('2026-02-28'); // Lenten Ember Saturday
    expect(day.winner).not.toEqual({ kind: 'temporal', id: 'marian-saturday' });
    expect(day.temporalCategory).toBe('privileged-feria');
  });

  it('never applies while an octave is active, even on an otherwise-eligible Saturday (Pentecost Ember Saturday keeps its own real standing, not Marian Saturday\'s)', () => {
    // Previously resolved to the plain octave-governed 'pentecost-sunday'
    // id before Pentecost's own 3 Ember days got real content of their
    // own (calendar/ember-days.ts, 2026-09-19) -- still real standing of
    // its own either way, just now its own rather than the Sunday's.
    const day = resolveDay('2026-05-30');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'ember-pentecost-saturday' });
  });

  it('never applies on a weekday other than Saturday', () => {
    const day = resolveDay('2026-10-23'); // the Friday before the clean Marian Saturday above
    expect(day.winner).not.toEqual({ kind: 'temporal', id: 'marian-saturday' });
  });
});
