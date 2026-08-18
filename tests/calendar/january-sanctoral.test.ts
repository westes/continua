import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// 2029 — every January date below is a clean per-annum year for these
// saints (no Sunday collision), verified against Divinum Officium
// (Monastic Tridentinum 1617) — see data/calendar/saints/*.yml for the
// per-saint source detail.
describe('January sanctoral pull (first pass)', () => {
  it('a saint with real authored propers wins outright and resolves a verified collect', () => {
    const day = resolveDay('2029-01-16');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-marcellus-i',
      name: 'St. Marcellus I, Pope and Martyr',
      rank: 'semiduplex',
    });
    const collect = getDayCollect(day);
    expect(collect.status.en).toBe('verified');
    expect(collect.text.en).toContain('Marcellus');
  });

  it('a saint with no unique propers (Common of Saints only) still wins outright, and resolves via the Common', () => {
    const day = resolveDay('2026-01-17'); // St. Anthony Abbot
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-anthony-abbot',
      name: 'St. Anthony, Abbot',
      rank: 'duplex',
    });
    const collect = getDayCollect(day);
    expect(collect.status.en).toBe('verified');
  });

  it('resolves a real multi-saint day as a winner plus a commemoration, not a collision error', () => {
    const day = resolveDay('2029-01-18'); // Chair of St. Peter at Rome + St. Prisca
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'chair-of-st-peter-at-rome',
      name: 'The Chair of St. Peter at Rome',
      rank: 'duplex-majus',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-prisca', name: 'St. Prisca, Virgin and Martyr', rank: 'simplex' },
    ]);
  });

  it('a simplex saint on an ordinary Sunday is commemorated, not dropped or made to win', () => {
    // Jan 14, 2029 is the Second Sunday after Epiphany (ordinary, not
    // privileged) — St. Felix (simplex) is commemorated per the ordinary-
    // Sunday rule, matching the historical calendar exactly. St. Hilary of
    // Poitiers (Semiduplex, also native to this date) transfers off the
    // Sunday instead, per direct instruction, so he doesn't appear here.
    const day = resolveDay('2029-01-14');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'post-epiphany-2' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-felix-presbyter', name: 'St. Felix, Priest and Martyr', rank: 'simplex' },
    ]);
  });
});
