import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect, getBenedictusAntiphon, getMagnificatAntiphon } from '../../src/hours/resolve-common';

// Relocated off the fixed Aug 22 date (2026-08-22 user decision, see
// TODO.md) -- that date collided outright with the Assumption's own
// octave-closing day. Moved to Easter+69: the Saturday after the Feast of
// the Sacred Heart (Easter+68, always a Friday), the feast's own real
// diocesan date from 1914 until Pius XII's 1944 fixed-date decree, and
// also the date the 1969 reform returned to.
describe('Immaculate Heart of Mary (calendar/movable-feasts.ts, generic Easter-offset resolver)', () => {
  it('wins outright on Easter+69, with real content resolved via the temporal propers store', () => {
    const day = resolveDay('2026-06-13'); // Easter 2026-04-05 + 69 days
    expect(day.winner).toEqual({ kind: 'temporal', id: 'immaculate-heart-of-mary' });
    expect(getDayCollect(day).status.en).toBe('verified');
    expect(getBenedictusAntiphon(day).status.en).toBe('verified');
    expect(getMagnificatAntiphon(day).status.en).toBe('verified');
  });

  it('correctly finds Easter+69 in a different year (early Easter)', () => {
    const day = resolveDay('2027-06-05'); // Easter 2027-03-28 + 69 days
    expect(day.winner).toEqual({ kind: 'temporal', id: 'immaculate-heart-of-mary' });
  });

  it('does not apply on the Saturday before or after', () => {
    const before = resolveDay('2026-06-06');
    const after = resolveDay('2026-06-20');
    expect(before.winner).not.toEqual({ kind: 'temporal', id: 'immaculate-heart-of-mary' });
    expect(after.winner).not.toEqual({ kind: 'temporal', id: 'immaculate-heart-of-mary' });
  });

  it('no longer wins or appears anywhere on Aug 22, which reverts to the Assumption octave alone', () => {
    const day = resolveDay('2026-08-22');
    expect(day.winner).not.toEqual(expect.objectContaining({ id: 'immaculate-heart-of-mary' }));
    expect(day.commemorations).not.toContainEqual(expect.objectContaining({ id: 'immaculate-heart-of-mary' }));
  });
});
