import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import type { LiturgicalDay } from '../../src/calendar/types';

describe('getDayLabel — ordinal temporal label', () => {
  it("labels an anchor's own partial week as \"Weekday after {Anchor}\"", () => {
    // Trinity Sunday 2026 is May 31.
    expect(getDayLabel(resolveDay('2026-06-01'))).toBe('Monday after Trinity Sunday');
    expect(getDayLabel(resolveDay('2026-01-07'))).toBe('Wednesday after Epiphany'); // Epiphany 2026 is a Tuesday
  });

  it('names the anchor day itself, not "day after itself"', () => {
    // Trinity Sunday 2026 (May 31) is now also the Queenship of the
    // Blessed Virgin Mary's own fixed day (Duplex II Classis, added per
    // the full-year sanctoral import) — since this app models Trinitytide
    // Sundays as plain `ordinary-sunday` with no special first-class
    // standing of their own, the Duplex+ sanctoral feast wins outright
    // here per the normal ordinary-Sunday rule (see
    // tests/calendar/transfer.test.ts's own May 31 case for the full
    // winner/commemorations breakdown), so the label now reflects her,
    // not Trinity Sunday itself.
    expect(getDayLabel(resolveDay('2026-05-31'))).toBe('The Queenship of the Blessed Virgin Mary');
    expect(getDayLabel(resolveDay('2026-04-05'))).toBe('Easter');
    expect(getDayLabel(resolveDay('2026-02-18'))).toBe('Ash Wednesday');
  });

  it('gives the correct week-after-Trinity ordinal', () => {
    // Trinity Sunday 2026 is May 31; Jul 6 falls 5 full weeks after the
    // first Sunday-after-Trinity (Jun 7).
    expect(getDayLabel(resolveDay('2026-07-06'))).toBe('Monday in the 5th week after Trinity');
  });

  it("Advent's own anchor Sunday is already week 1, not a separate anchor-week case", () => {
    // 2025-11-30 is also St. Andrew's own day (Duplex II. classis) — since
    // the November sanctoral pull, he's correctly commemorated alongside
    // Advent I rather than simply absent (confirmed against the live
    // reference engine, which shows the same pairing), so the label
    // reflects both, feast name first, same pattern as Trinity Sunday's
    // own St. Felix I case above.
    expect(getDayLabel(resolveDay('2025-11-30'))).toBe('St. Andrew, Apostle — The 1st Sunday of Advent');
    expect(getDayLabel(resolveDay('2025-12-01'))).toBe('Monday in the 1st week of Advent');
  });

  it('falls back to weekday + season name for seasons with no ordinal convention modeled', () => {
    // 2026-05-15 is now St. John Baptist de la Salle's own fixed day
    // (Duplex, added per the full-year sanctoral import) -- moved to
    // May 21, still within Ascensiontide 2026 (May 14-23) and still
    // free of any sanctoral entry.
    expect(getDayLabel(resolveDay('2026-05-21'))).toContain('in Ascensiontide');
  });
});

describe('getDayLabel — resumed post-Epiphany Sunday (overflow years)', () => {
  it('labels a resumed Sunday/weekday as "after Epiphany", not the next Trinity-counted number', () => {
    // 2026: post-epiphany-5 is Nov 8, post-epiphany-6 is Nov 15 (both
    // Sundays) -- see calendar/temporal-id.test.ts for the id-level
    // coverage this label check builds on.
    expect(getDayLabel(resolveDay('2026-11-08'))).toBe('The 5th Sunday after Epiphany');
    // 2026-11-09 is also the Dedication of the Basilica of the Most Holy
    // Savior (Duplex II Classis, added 2026-08 — see
    // dedication-of-the-basilica-of-the-most-holy-savior.yml) — an
    // ordinary (non-privileged) Monday fully yields to a real winning
    // saint, so the label is just her name, not the ferial fallback; the
    // 11-16 assertion below covers that fallback format on a genuinely
    // saint-free day instead.
    expect(getDayLabel(resolveDay('2026-11-09'))).toBe(
      'Dedication of the Basilica of the Most Holy Savior (the Lateran)',
    );
    expect(getDayLabel(resolveDay('2026-11-15'))).toBe('The 6th Sunday after Epiphany');
    expect(getDayLabel(resolveDay('2026-11-16'))).toBe('Monday in the 6th week after Epiphany');
  });

  it('the fixed final Sunday of the year always shows the fixed 23rd-after-Trinity ordinal, not a raw elapsed-week count', () => {
    // 2026-11-22 is the fixed post-pentecost-24 Sunday (Sunday XXIV after
    // Pentecost's own fixed formulary; this app's Trinity-counted display
    // is one week off from that Pentecost-counted id, so XXIV - 1 = 23).
    // Every year 1900-2100 lands on this same id for its own last Sunday
    // before Advent, so this ordinal is fixed, not overflow-year-specific
    // -- confirmed against a non-overflow year (1943) too.
    expect(getDayLabel(resolveDay('2026-11-22'))).toBe('The 23rd Sunday after Trinity');
    // 1943-11-21 is also the Presentation of the BVM (Duplex Majus, added
    // 2026-08 — see presentation-of-the-bvm.yml), which meets this app's
    // existing privileged-Sunday rank threshold (commemorations.ts's
    // `privileged-sunday` case requires only duplex-majus+) and so wins
    // outright rather than being commemorated — a pre-existing rule, not
    // new behavior from adding her. 2026-11-22 above (no saint collision)
    // still covers the fixed-ordinal label itself.
    expect(getDayLabel(resolveDay('1943-11-21'))).toBe('The Presentation of the Blessed Virgin Mary');
  });
});

describe('getDayLabel — active octave', () => {
  it('shows the octave day itself as the primary label, plus a lesser saint commemorated alongside it', () => {
    // St. Lawrence's own octave (Aug 10-17); Aug 12 is day 3, and also St.
    // Clare's own day -- Simplex, below the octave's semiduplex threshold,
    // so she's commemorated rather than winning. Matches the live engine's
    // own title for this date directly (see saints/st-clare.yml).
    expect(getDayLabel(resolveDay('2026-08-12'))).toBe('3rd Day within the Octave of St. Lawrence, Martyr — St. Clare, Virgin');
  });

  it('shows the octave day alone when nothing is separately commemorated that day', () => {
    // Aug 17 is day 8 (the last day) of St. Lawrence's octave, with no
    // sanctoral candidate of its own in this app's calendar.
    expect(getDayLabel(resolveDay('2026-08-17'))).toBe('8th Day within the Octave of St. Lawrence, Martyr');
  });

  it("a season's own named anchor day outranks an active octave, even though Trinity Sunday is technically also day 8 of Pentecost's own octave", () => {
    // Not 2026 (May 31): that year's Trinity Sunday now coincides with the
    // Queenship of the Blessed Virgin Mary's own fixed day (Duplex II
    // Classis, added per the full-year sanctoral import), which wins
    // outright and would muddy this specifically octave-vs-anchor-day
    // check (see tests/calendar/transfer.test.ts's own May 31 case for
    // that). 2023's Trinity Sunday (June 4) has no sanctoral entry at all,
    // isolating the octave interaction cleanly.
    expect(getDayLabel(resolveDay('2023-06-04'))).toBe('Trinity Sunday');
  });

  it("a temporal day with real standing of its own (not ordinary-feria) never shows an octave name at all, even with one active -- live-verified counterexample: the Christmas Octave's own stack (Dec 30) titles itself off the Sunday, never any of the four octaves layered on top of it", () => {
    const day = resolveDay('2033-12-30');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(getDayLabel(day)).not.toContain('Octave');
    expect(getDayLabel(day)).toBe('Friday in Christmastide');
  });

  it("picks the higher-ranked of two genuinely overlapping octaves for the label -- St. Lawrence's own elevated closing day (Aug 17) over the Assumption's ordinary day 3, even though the Assumption's octave started later and the Assumption is the higher-ranked feast overall", () => {
    expect(getDayLabel(resolveDay('2026-08-17'))).toBe('8th Day within the Octave of St. Lawrence, Martyr');
    expect(getDayLabel(resolveDay('2026-08-18'))).toBe('4th Day within the Octave of The Assumption of the Blessed Virgin Mary');
  });

  it('a real Sunday with standing of its own wins over both octaves entirely, showing the plain ordinal Sunday label -- not an octave name at all', () => {
    // 2026-08-16 is a Sunday genuinely within both St. Lawrence's and the
    // Assumption's overlapping octave windows.
    const day = resolveDay('2026-08-16');
    expect(day.weekday).toBe('sunday');
    expect(getDayLabel(day)).not.toContain('Octave');
  });
});

describe('getDayLabel — feast name combination', () => {
  const base: LiturgicalDay = {
    date: '2026-06-15',
    weekday: 'monday',
    season: 'trinitytide',
    temporalCategory: 'ordinary-feria',
    winner: { kind: 'temporal', id: 'post-pentecost-02' },
    commemorations: [],
  };

  it('shows just the feast name when it wins outright', () => {
    const day: LiturgicalDay = {
      ...base,
      winner: { kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex' },
    };
    expect(getDayLabel(day)).toBe('St. Ereden');
  });

  it('shows both, feast first, when the feast is merely commemorated', () => {
    const day: LiturgicalDay = {
      ...base,
      commemorations: [{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex-2-classis' }],
    };
    expect(getDayLabel(day)).toBe('St. Ereden — Monday in the 2nd week after Trinity');
  });

  it('shows just the temporal label when nothing is commemorated at all', () => {
    expect(getDayLabel(base)).toBe('Monday in the 2nd week after Trinity');
  });
});
