import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import type { LiturgicalDay } from '../../src/calendar/types';

describe('getDayLabel — ordinal temporal label', () => {
  it("labels an anchor's own partial week as \"Weekday after {Anchor}\"", () => {
    // Not 2026 (Trinity Sunday May 31, so Trinity Monday June 1): that
    // date is now St. Angela Merici's own fixed day (Duplex, added per
    // the full-year sanctoral import), which would win outright and hide
    // this purely-temporal label case. 2027's Trinity Sunday is May 23,
    // so Trinity Monday is May 24 -- free of any sanctoral entry.
    expect(getDayLabel(resolveDay('2027-05-24'))).toBe('Monday after Trinity Sunday (Feria)');
    expect(getDayLabel(resolveDay('2026-01-07'))).toBe('Wednesday after Epiphany (Feria)'); // Epiphany 2026 is a Tuesday
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
    expect(getDayLabel(resolveDay('2026-05-31'))).toBe('The Queenship of the Blessed Virgin Mary (Duplex II Class)');
    expect(getDayLabel(resolveDay('2026-04-05'))).toBe('Easter (Duplex I Class)');
    expect(getDayLabel(resolveDay('2026-02-18'))).toBe('Ash Wednesday');
  });

  it('gives the correct week-after-Trinity ordinal', () => {
    // Not 2026 (Jul 6): that date is now the Octave Day of Ss. Peter and
    // Paul's own fixed day (Duplex majus, added per the full-year
    // sanctoral import), which wins outright. 2027's Trinity Sunday is
    // May 23, so 5 full weeks after the first Sunday-after-Trinity
    // (May 30) is Jun 28 -- free of any sanctoral entry.
    expect(getDayLabel(resolveDay('2027-06-28'))).toBe('Monday in the 5th week after Trinity (Feria)');
  });

  it("Advent's own anchor Sunday is already week 1, not a separate anchor-week case", () => {
    // 2025-11-30 is also St. Andrew's own day (Duplex II. classis) — since
    // the November sanctoral pull, he's correctly commemorated alongside
    // Advent I rather than simply absent (confirmed against the live
    // reference engine, which shows the same pairing), so the label
    // reflects both, feast name first, same pattern as Trinity Sunday's
    // own St. Felix I case above.
    expect(getDayLabel(resolveDay('2025-11-30'))).toBe('St. Andrew, Apostle — The 1st Sunday of Advent (Semiduplex)');
    expect(getDayLabel(resolveDay('2025-12-01'))).toBe('Monday in the 1st week of Advent (Feria)');
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
    // Not 2026 any more: the November sanctoral pull gave fixed real
    // content to Nov 8 (Octave Day of All Saints, Duplex majus) and Nov
    // 15 (St. Albert the Great, Duplex) -- both now permanently win
    // outright over whatever post-Epiphany-overflow Sunday lands there in
    // any given year, the same "real content closed the gap" shape as
    // several other months' collisions. 2024 is a clean overflow year
    // instead: post-epiphany-5 is Nov 10, post-epiphany-6 is Nov 17 (both
    // Sundays) -- see calendar/temporal-id.test.ts for the id-level
    // coverage this label check builds on. Nov 10 itself also carries a
    // Simplex commemoration (Ss. Tryphon, Respicius, and Nympha), shown
    // appended to the Sunday's own label per this app's usual
    // commemorated-Simplex display.
    expect(getDayLabel(resolveDay('2024-11-10'))).toBe(
      'Ss. Tryphon, Respicius, and Nympha, Martyrs — The 5th Sunday after Epiphany (Semiduplex)',
    );
    // 2024-11-11 is St. Martin of Tours (Duplex, pre-existing content) --
    // an ordinary (non-privileged) Monday fully yields to a real winning
    // saint, so the label is just his name, not the ferial fallback; see
    // the 2035-10-29 assertion below for that fallback format on a
    // genuinely saint-free overflow-week Monday instead (no single
    // Nov-dated Monday near this Sunday pair is clean any more, now that
    // Nov 4/8/15/16/20 are all fixed real content).
    expect(getDayLabel(resolveDay('2024-11-11'))).toBe('St. Martin of Tours, Bishop and Confessor (Duplex Majus)');
    expect(getDayLabel(resolveDay('2024-11-17'))).toBe('The 6th Sunday after Epiphany (Semiduplex)');
    // 2024-11-18 is the Dedication of the Basilicas of Ss. Peter and Paul
    // (pre-existing fixed content) -- again a real winning saint, not the
    // ferial fallback.
    expect(getDayLabel(resolveDay('2024-11-18'))).toBe('Dedication of the Basilicas of Ss. Peter and Paul (Duplex)');
    // 2035-10-29, a Monday in the 3rd week of a different overflow
    // stretch, is genuinely clean (no sanctoral entry, no commemoration)
    // -- covers the ferial "Monday in the Nth week after Epiphany" format
    // itself, independent of the specific 5th/6th Sunday pair above.
    expect(getDayLabel(resolveDay('2035-10-29'))).toBe('Monday in the 3rd week after Epiphany (Feria)');
  });

  it('the fixed final Sunday of the year always shows the fixed 23rd-after-Trinity ordinal, not a raw elapsed-week count', () => {
    // 2026-11-22 is the fixed post-pentecost-24 Sunday (Sunday XXIV after
    // Pentecost's own fixed formulary; this app's Trinity-counted display
    // is one week off from that Pentecost-counted id, so XXIV - 1 = 23).
    // Every year 1900-2100 lands on this same id for its own last Sunday
    // before Advent, so this ordinal is fixed, not overflow-year-specific
    // -- confirmed against a non-overflow year (1943) too.
    expect(getDayLabel(resolveDay('2026-11-22'))).toBe('The 23rd Sunday after Trinity (Semiduplex)');
    // 1943-11-21 is also the Presentation of the BVM (Duplex Majus, added
    // 2026-08 — see presentation-of-the-bvm.yml), which meets this app's
    // existing privileged-Sunday rank threshold (commemorations.ts's
    // `privileged-sunday` case requires only duplex-majus+) and so wins
    // outright rather than being commemorated — a pre-existing rule, not
    // new behavior from adding her. 2026-11-22 above (no saint collision)
    // still covers the fixed-ordinal label itself.
    expect(getDayLabel(resolveDay('1943-11-21'))).toBe('The Presentation of the Blessed Virgin Mary (Duplex Majus)');
  });
});

describe('getDayLabel — active octave', () => {
  it('shows the octave day itself as the primary label, plus a lesser saint commemorated alongside it', () => {
    // St. Lawrence's own octave (Aug 10-17); Aug 12 is day 3, and also St.
    // Clare's own day -- Simplex, below the octave's semiduplex threshold,
    // so she's commemorated rather than winning. Matches the live engine's
    // own title for this date directly (see saints/st-clare.yml).
    expect(getDayLabel(resolveDay('2026-08-12'))).toBe(
      '3rd Day within the Octave of St. Lawrence, Martyr (Semiduplex) — St. Clare, Virgin',
    );
  });

  it('shows the octave day alone when nothing is separately commemorated that day', () => {
    // Not Aug 17 (day 8, the last day, of St. Lawrence's octave): that
    // date is also within the Assumption's own overlapping octave (day 3)
    // and St. Hyacinth's own fixed day (Duplex) is commemorated there too
    // — see the "picks the higher-ranked octave" case below for that
    // three-way combination. Not Nov 8 either
    // (day 8, the last day, of All Saints' own octave): the November
    // sanctoral pull gave that day its own real feast, the Octave Day of
    // All Saints itself (Duplex majus, own proper Nocturn 2-3 content --
    // see saints/octave-of-all-saints.yml), which now wins outright there
    // too -- every year's Nov 8 is permanently claimed by it, the same
    // "real content closed the gap" shape as August's Lawrence/Assumption
    // overlap. Day 3 of the same octave (2028-11-03, a Friday) is still
    // genuinely open -- no sanctoral entry, no separate commemoration.
    expect(getDayLabel(resolveDay('2028-11-03'))).toBe('3rd Day within the Octave of All Saints (Semiduplex)');
  });

  it("a season's own named anchor day outranks an active octave, even though Trinity Sunday is technically also day 8 of Pentecost's own octave", () => {
    // Not 2026 (May 31, the Queenship of the Blessed Virgin Mary's own
    // fixed day, see tests/calendar/transfer.test.ts) and not 2023
    // (June 4, now St. Francis Caracciolo's own fixed day) -- both would
    // muddy this specifically octave-vs-anchor-day check with a sanctoral
    // winner. 2030's Trinity Sunday (June 16) has no sanctoral entry at
    // all, isolating the octave interaction cleanly.
    expect(getDayLabel(resolveDay('2030-06-16'))).toBe('Trinity Sunday (Duplex I Class)');
  });

  it("a temporal day with real standing of its own (not ordinary-feria) never shows an octave name at all, even with one active -- live-verified counterexample: the Christmas Octave's own stack (Dec 30) titles itself off the Sunday, never any of the four octaves layered on top of it", () => {
    const day = resolveDay('2033-12-30');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(getDayLabel(day)).not.toContain('Octave');
    expect(getDayLabel(day)).toBe('Friday in Christmastide (Feria)');
  });

  it("picks the higher-ranked of two genuinely overlapping octaves for the label -- St. Lawrence's own elevated closing day (Aug 17) over the Assumption's ordinary day 3, even though the Assumption's octave started later and the Assumption is the higher-ranked feast overall -- with St. Hyacinth (Duplex, tied with Lawrence's own elevated rank) commemorated rather than winning outright", () => {
    // Live-verified against the reference engine directly (Monastic
    // Tridentinum 1617, command=prayMatutinum): Aug 17 is "In Octava S.
    // Laurentii Martyris ~ Duplex" -- Lawrence's own elevated closing day
    // wins outright, with Hyacinth's own alternate-rubric block titled
    // "Commemoratio S. Hyacinthi Confessoris" confirming he's the one
    // merely commemorated there. A tie against an octave's own elevated
    // closing day favors the octave (calendar/index.ts's applyOctaves),
    // unlike an ordinary mid-octave day's tie, which still favors an
    // occurring saint (see octaves.test.ts and the December/September
    // sanctoral tests for those counterexamples). The Assumption's own
    // day 3 (semiduplex, genuinely active but outranked by Lawrence's
    // elevated duplex) still gets named, not dropped, alongside it.
    expect(getDayLabel(resolveDay('2026-08-17'))).toBe(
      'Octave of St. Lawrence, Martyr (Duplex) — The Assumption of the Blessed Virgin Mary — St. Hyacinth, Confessor',
    );
    expect(getDayLabel(resolveDay('2026-08-18'))).toBe(
      '4th Day within the Octave of The Assumption of the Blessed Virgin Mary (Semiduplex)',
    );
  });

  it('a real Sunday with standing of its own wins over both octaves entirely, showing the plain ordinal Sunday label -- not an octave name at all', () => {
    // 2026-08-16 is a Sunday genuinely within both St. Lawrence's and the
    // Assumption's overlapping octave windows.
    const day = resolveDay('2026-08-16');
    expect(day.weekday).toBe('sunday');
    expect(getDayLabel(day)).not.toContain('Octave');
  });

  it("a foreign octave superimposed on a privileged season still governs the label when its own effective rank clears that season's real threshold, with the season's own losing saint commemorated alongside it", () => {
    // The Immaculate Conception's own octave (Dec 8-15) always falls
    // inside Advent, a `privileged-feria-minor` season -- unlike every
    // other octave here (Lawrence/Assumption/All Saints/Nativity BVM),
    // which always sit entirely within ordinary time. Live-verified
    // (Divino Afflatu 1954): Dec 15, the octave's own closing day, is
    // "In Octava Concept. Immac. Beatæ Mariæ Virginis ~ Duplex majus" --
    // outright winning against Advent -- with St. Eusebius of Vercelli
    // (Semiduplex, real per calendar/data/calendar/saints/
    // st-eusebius-of-vercelli.yml -- Monastic Tridentinum 1617 places him
    // here via a same-day kalendar redirect, not Dec 16 like the general
    // Roman calendar) merely commemorated, not winning, since he's below
    // the octave's own closing-day threshold. See
    // calendar/octaves.ts's octaveGoverningPrivilegedDay for the shared
    // mechanism (also used by hours/resolve-common.ts's
    // resolveOfficeWinner for the actual office content, not just this
    // label).
    expect(getDayLabel(resolveDay('2026-12-15'))).toBe(
      'Octave of The Immaculate Conception of the Blessed Virgin Mary (Duplex) — St. Eusebius of Vercelli, Bishop and Martyr',
    );
  });

  it("the Christmas Octave's own stack never lets any of its four constituent octaves outrank Christmastide's own temporal identity, even though it's the same privileged-feria-minor category the Immaculate Conception's octave *does* outrank Advent with", () => {
    // Same live-verified Dec 30 counterexample as the test above (Friday
    // in Christmastide) -- restated here specifically against the new
    // octaveGoverningPrivilegedDay mechanism, to pin down that its
    // `christmastide` exclusion actually holds now that privileged
    // categories are no longer an unconditional "never" for every octave.
    const day = resolveDay('2033-12-30');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(day.season).toBe('christmastide');
    expect(getDayLabel(day)).not.toContain('Octave');
  });

  it('a sanctoral winner that outright displaces the only active octave still shows that octave with its full "Nth Day within the Octave" phrasing, not a bare feast name -- and without a rank, since the octave is riding along under the winning duplex rather than asserting its own rank', () => {
    // Live-verified against the reference engine (Divino Afflatu 1954,
    // prayMatutinum): Aug 19 is "S. Joannis Eudes Confessoris ~ Duplex"
    // with the commemoration read as plain "Quinta die infra Octavam S.
    // Assumptionis Beatæ Mariæ Virginis" -- no rank at all -- i.e. the
    // octave's real DO title even when it lost outright, not a bare "The
    // Assumption of the Blessed Virgin Mary" (this app's previous
    // behavior, reusing `otherActiveOctaveNames`'s plain-name formatting
    // -- correct for a *secondary* octave alongside another *octave* that
    // won, see the Aug 17/18 cases above, but wrong here where the octave
    // itself is what's being commemorated against a winning saint) and
    // also not `octaveLabel`'s own rank parenthetical (that belongs only
    // to an octave day when it's the day's own primary winner).
    expect(getDayLabel(resolveDay('2026-08-19'))).toBe(
      'St. John Eudes, Confessor (Duplex) — 5th Day within the Octave of The Assumption of the Blessed Virgin Mary',
    );
  });
});

describe('getDayLabel — named temporal feast rank', () => {
  it('shows rank after a named temporal feast winner, sourced from its own TemporalFeastRecord', () => {
    // Not Christmas Day itself: `resolveTemporalId` maps every day of
    // christmastide (Dec 25 included) to `christmas-octave-sunday`, not
    // `christmas-day` — a pre-existing, separate gap (`christmas-day`'s
    // own record only ever surfaces via the octave layer, never as a
    // direct winner id) out of scope here. Pentecost Sunday's own id
    // *does* resolve as the direct winner (`temporal-id.ts`'s
    // EASTER_OFFSET_IDS), so it's a real, clean case for this branch.
    expect(getDayLabel(resolveDay('2026-05-24'))).toBe('Pentecost (Duplex I Class)');
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
    expect(getDayLabel(day)).toBe('St. Ereden (Duplex)');
  });

  it('shows both, feast first, when the feast is merely commemorated', () => {
    const day: LiturgicalDay = {
      ...base,
      commemorations: [{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex-2-classis' }],
    };
    expect(getDayLabel(day)).toBe('St. Ereden — Monday in the 2nd week after Trinity (Feria)');
  });

  it('shows just the temporal label when nothing is commemorated at all', () => {
    expect(getDayLabel(base)).toBe('Monday in the 2nd week after Trinity (Feria)');
  });
});
