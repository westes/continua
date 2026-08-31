import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';

// A 1925 addition, not in the Monastic Tridentinum 1617 base this project
// otherwise targets -- content sourced from "Monastic Divino 1930"
// instead. Always wins the last Sunday of October, commemorating
// whichever Sunday after Pentecost it displaces.
describe('Christ the King (applyChristTheKing)', () => {
  it('wins outright on the last Sunday of October, commemorating the Sunday it displaces', () => {
    const day = resolveDay('2026-10-25'); // last Sunday of October 2026
    expect(day.winner).toEqual({ kind: 'temporal', id: 'christ-the-king' });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'post-pentecost-22' });
    // Live-verified (Divino Afflatu 1954): the day's own commemoration
    // line also names whichever sanctoral entry the ordinary Sunday was
    // already carrying (Ss. Chrysanthus and Daria, Simplex, per the next
    // test below) -- this app's day label now surfaces every commemorated
    // saint, not just the Sunday itself.
    expect(getDayLabel(day).en).toBe('Christ the King (Duplex I Class) — Ss. Chrysanthus and Daria, Martyrs');
  });

  it('preserves a nested commemoration: a Simplex saint already commemorated under the ordinary Sunday stays commemorated', () => {
    // Ss. Chrysanthus and Daria, Simplex, land on 2026-10-25 -- already
    // commemorated under the Sunday per the ordinary-sunday rule before
    // Christ the King further displaces that Sunday itself.
    const day = resolveDay('2026-10-25');
    expect(day.commemorations).toContainEqual({
      kind: 'sanctoral',
      id: 'ss-chrysanthus-and-daria',
      name: 'Ss. Chrysanthus and Daria, Martyrs',
      nameLa: 'Sancti Chrysanthus et Daria, Martyres',
      rank: 'simplex',
    });
  });

  it('does not apply on any other Sunday in October', () => {
    const day = resolveDay('2026-10-18');
    expect(day.winner).not.toEqual({ kind: 'temporal', id: 'christ-the-king' });
  });

  it('correctly finds a different last Sunday of October in a year where Oct 31 itself is a Sunday', () => {
    const day = resolveDay('2027-10-31'); // 2027-10-31 is a Sunday
    expect(day.winner).toEqual({ kind: 'temporal', id: 'christ-the-king' });
  });
});
