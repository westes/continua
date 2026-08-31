import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveEveningDay } from '../../src/calendar/vespers';
import { getDayLabel, getVespersStatusLabel } from '../../src/calendar/day-label';
import type { LiturgicalDay } from '../../src/calendar/types';

describe('getDayLabel — ordinal temporal label', () => {
  it("labels an anchor's own partial week as \"Weekday after {Anchor}\"", () => {
    // Not 2026 (Trinity Sunday May 31, so Trinity Monday June 1): that
    // date is now St. Angela Merici's own fixed day (Duplex, added per
    // the full-year sanctoral import), which would win outright and hide
    // this purely-temporal label case. 2027's Trinity Sunday is May 23,
    // so Trinity Monday is May 24 -- free of any sanctoral entry.
    expect(getDayLabel(resolveDay('2027-05-24')).en).toBe('Monday after Trinity Sunday (Feria)');
    expect(getDayLabel(resolveDay('2026-01-07')).en).toBe('Wednesday after Epiphany (Feria)'); // Epiphany 2026 is a Tuesday
    // Latin: spelled-out ferial weekday name (not roman numerals) and the
    // "Feria" rank label, which is already the real Latin word.
    expect(getDayLabel(resolveDay('2027-05-24')).la).toBe('Feria Secunda post Dominica Sanctissimae Trinitatis (Feria)');
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
    // not Trinity Sunday itself — but Trinity Sunday is still
    // commemorated in return (`decideOccurrence`'s own `ordinary-sunday`
    // branch), by bare name only — a commemoration never carries a rank
    // parenthetical, only the day's own winner does.
    expect(getDayLabel(resolveDay('2026-05-31')).en).toBe(
      'The Queenship of the Blessed Virgin Mary (Duplex II Class) — Trinity Sunday',
    );
    expect(getDayLabel(resolveDay('2026-04-05')).en).toBe(
      "Easter (Duplex I Class) — St. Vincent Ferrer, Confessor (transferred away)",
    );
    expect(getDayLabel(resolveDay('2026-02-18')).en).toBe(
      "Ash Wednesday — St. Simeon, Bishop and Martyr (transferred away)",
    );
    // Latin: the winner now has a real authored nameLa (see
    // calendar/data/calendar/saints/queenship-of-the-bvm.yml), so this is
    // real Latin throughout — the rank label ("Duplex II. Classis") and
    // the commemorated Sunday's own name ("Dominica Sanctissimae
    // Trinitatis") were already real Latin before this.
    expect(getDayLabel(resolveDay('2026-05-31')).la).toBe(
      'Beata Maria Virgo Regina (Duplex II. Classis) — Dominica Sanctissimae Trinitatis',
    );
    expect(getDayLabel(resolveDay('2026-04-05')).la).toBe(
      'Pascha (Duplex I. Classis) — Sanctus Vincentius Ferrerius, Confessor (translata alio)',
    );
    expect(getDayLabel(resolveDay('2026-02-18')).la).toBe(
      'Feria Quarta Cinerum — Sanctus Simeon, Episcopus et Martyr (translata alio)',
    );
  });

  it('gives the correct week-after-Trinity ordinal', () => {
    // Not 2026 (Jul 6): that date is now the Octave Day of Ss. Peter and
    // Paul's own fixed day (Duplex majus, added per the full-year
    // sanctoral import), which wins outright. 2027's Trinity Sunday is
    // May 23, so 5 full weeks after the first Sunday-after-Trinity
    // (May 30) is Jun 28 -- free of any sanctoral entry.
    expect(getDayLabel(resolveDay('2027-06-28')).en).toBe('Monday in the 5th week after Trinity (Feria)');
  });

  it("Advent's own anchor Sunday is already week 1, not a separate anchor-week case", () => {
    // 2025-11-30 is also St. Andrew's own day (Duplex II. classis) — since
    // the November sanctoral pull, he's correctly commemorated alongside
    // Advent I rather than simply absent (confirmed against the live
    // reference engine, which shows the same pairing), so the label
    // reflects both, winner (Advent I, so privileged nothing can displace
    // it) first, commemorated saint after.
    expect(getDayLabel(resolveDay('2025-11-30')).en).toBe('The 1st Sunday of Advent (Semiduplex) — St. Andrew, Apostle');
    // Advent drops the redundant leading weekday word now that the header
    // always shows the weekday on its own (see temporalLabel's
    // `dropWeekdayPrefix`).
    expect(getDayLabel(resolveDay('2025-12-01')).en).toBe('In the 1st week of Advent (Feria)');
    // Latin: same weekday-drop, and the season-ordinal genitive
    // construction ("Hebdomada prima Adventus") needs no extra linking
    // word — 4th-declension "Adventus" has the same genitive form.
    expect(getDayLabel(resolveDay('2025-12-01')).la).toBe('In hebdomada prima Adventus (Feria)');
  });

  it('falls back to weekday + season name for seasons with no ordinal convention modeled', () => {
    // 2026-05-15 is now St. John Baptist de la Salle's own fixed day
    // (Duplex, added per the full-year sanctoral import); May 21 is now
    // Ascension's own octave closing day (Ascension now modeled as a
    // real TemporalFeastRecord with an octave, Easter+39 through +46 —
    // see TODO.md's 2026-08-26 entry), and May 22/23 both carry a fixed
    // saint of their own -- 2028-06-03 (Easter+48, the day before
    // Pentecost) is the nearest genuinely free Ascensiontide day: past
    // Ascension's own octave, no fixed saint, still short of Pentecost.
    expect(getDayLabel(resolveDay('2028-06-03')).en).toContain('in Ascensiontide');
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
    // trailing after the Sunday's own winning label per this app's usual
    // winner-first display.
    expect(getDayLabel(resolveDay('2024-11-10')).en).toBe(
      'The 5th Sunday after Epiphany (Semiduplex) — Ss. Tryphon, Respicius, and Nympha, Martyrs',
    );
    // 2024-11-11 is St. Martin of Tours (Duplex, pre-existing content) --
    // an ordinary (non-privileged) Monday fully yields to a real winning
    // saint, so the label is just his name (plus St. Menna, Simplex, also
    // real and commemorated alongside him -- live-verified, Divino
    // Afflatu 1954), not the ferial fallback; see the 2035-10-29 assertion
    // below for that fallback format on a genuinely saint-free
    // overflow-week Monday instead (no single Nov-dated Monday near this
    // Sunday pair is clean any more, now that Nov 4/8/15/16/20 are all
    // fixed real content).
    expect(getDayLabel(resolveDay('2024-11-11')).en).toBe(
      'St. Martin of Tours, Bishop and Confessor (Duplex Majus) — St. Menna, Martyr',
    );
    expect(getDayLabel(resolveDay('2024-11-17')).en).toBe(
      "The 6th Sunday after Epiphany (Semiduplex) — St. Gregory Thaumaturgus, Bishop and Confessor (transferred away)",
    );
    // 2024-11-18 is the Dedication of the Basilicas of Ss. Peter and Paul
    // (pre-existing fixed content) -- again a real winning saint, not the
    // ferial fallback -- with St. Gregory Thaumaturgus (Semiduplex,
    // native to Nov 17 above) commemorated alongside it instead: per
    // direct instruction, a Semiduplex feast on an ordinary Sunday
    // transfers to the next open day rather than being commemorated in
    // place, and Nov 18 is that day.
    expect(getDayLabel(resolveDay('2024-11-18')).en).toBe(
      'Dedication of the Basilicas of Ss. Peter and Paul (Duplex) — St. Gregory Thaumaturgus, Bishop and Confessor (transferred)',
    );
    // 2035-10-29, a Monday in the 3rd week of a different overflow
    // stretch, is genuinely clean (no sanctoral entry, no commemoration)
    // -- covers the ferial "Monday in the Nth week after Epiphany" format
    // itself, independent of the specific 5th/6th Sunday pair above.
    expect(getDayLabel(resolveDay('2035-10-29')).en).toBe('Monday in the 3rd week after Epiphany (Feria)');
  });

  it('the fixed final Sunday of the year always shows the fixed 23rd-after-Trinity ordinal, not a raw elapsed-week count', () => {
    // 2026-11-22 is the fixed post-pentecost-24 Sunday (Sunday XXIV after
    // Pentecost's own fixed formulary; this app's Trinity-counted display
    // is one week off from that Pentecost-counted id, so XXIV - 1 = 23).
    // Every year 1900-2100 lands on this same id for its own last Sunday
    // before Advent, so this ordinal is fixed, not overflow-year-specific
    // -- confirmed against a non-overflow year (1943) too.
    // St. Cecilia (Semiduplex, her real date) transfers off this Sunday
    // rather than being commemorated in place -- same rule as St. Gregory
    // Thaumaturgus above -- landing on 2026-11-23 instead, where St.
    // Clement already natively wins; Cecilia loses that tied collision
    // (both Semiduplex) and joins St. Felicitas as a commemoration there.
    expect(getDayLabel(resolveDay('2026-11-22')).en).toBe(
      "The 23rd Sunday after Trinity (Semiduplex) — St. Cecilia, Virgin and Martyr (transferred away)",
    );
    expect(getDayLabel(resolveDay('2026-11-23')).en).toBe(
      'St. Clement I, Pope and Martyr (Semiduplex) — St. Felicitas, Martyr — St. Cecilia, Virgin and Martyr (transferred)',
    );
    // 1943-11-21 is also the Presentation of the BVM (Duplex Majus, added
    // 2026-08 — see presentation-of-the-bvm.yml). It's `ordinary-sunday`
    // here (this app's Trinitytide Sundays, including the fixed final
    // one, carry no special first-class standing of their own), so
    // commemorations.ts's `ordinary-sunday` case's plain Duplex+ threshold
    // is what lets her win outright rather than being commemorated — a
    // pre-existing rule, not new behavior from adding her. This case
    // additionally confirms the displaced Sunday is still commemorated in
    // return, using the same fixed 23rd-after-Trinity ordinal, not a raw
    // elapsed-week count recomputed for 1943.
    expect(getDayLabel(resolveDay('1943-11-21')).en).toBe(
      'The Presentation of the Blessed Virgin Mary (Duplex Majus) — The 23rd Sunday after Trinity',
    );
  });
});

describe('getDayLabel — commemorated Sunday/feria under a sanctoral winner', () => {
  it('a saint winning outright on a privileged-feria-minor day still leaves that feria commemorated', () => {
    // 2027-12-07, a Tuesday of Advent: St. Ambrose (Duplex) clears
    // privileged-feria-minor's own Semiduplex+ threshold and wins
    // outright, but Advent's own feria is still commemorated in return
    // (`decideOccurrence`'s `privileged-feria-minor` branch) -- live-
    // verified shape, same mechanism as the ordinary-Sunday case above,
    // for the feria-tier branch instead.
    // Advent drops the redundant leading weekday word (see the Dec 1 case
    // above).
    expect(getDayLabel(resolveDay('2027-12-07')).en).toBe(
      'St. Ambrose, Bishop, Confessor and Doctor of the Church (Duplex) — In the 2nd week of Advent',
    );
  });
});

describe('getDayLabel — active octave', () => {
  it('shows the octave day itself as the primary label, plus a lesser saint commemorated alongside it', () => {
    // St. Lawrence's own octave (Aug 10-17); Aug 12 is day 3, and also St.
    // Clare's own day -- Simplex, below the octave's semiduplex threshold,
    // so she's commemorated rather than winning. Matches the live engine's
    // own title for this date directly (see saints/st-clare.yml).
    expect(getDayLabel(resolveDay('2026-08-12')).en).toBe(
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
    expect(getDayLabel(resolveDay('2028-11-03')).en).toBe('3rd Day within the Octave of All Saints (Semiduplex)');
  });

  it("a season's own named anchor day outranks an active octave, even though Trinity Sunday is technically also day 8 of Pentecost's own octave", () => {
    // Not 2026 (May 31, the Queenship of the Blessed Virgin Mary's own
    // fixed day, see tests/calendar/transfer.test.ts) and not 2023
    // (June 4, now St. Francis Caracciolo's own fixed day) -- both would
    // muddy this specifically octave-vs-anchor-day check with a sanctoral
    // winner. 2030's Trinity Sunday (June 16) has no sanctoral entry at
    // all, isolating the octave interaction cleanly.
    expect(getDayLabel(resolveDay('2030-06-16')).en).toBe('Trinity Sunday (Duplex I Class)');
  });

  it("a temporal day with real standing of its own (not ordinary-feria) never shows an octave name at all, even with one active -- live-verified counterexample: the Christmas Octave's own stack (Dec 30) titles itself off the Sunday, never any of the four octaves layered on top of it", () => {
    const day = resolveDay('2033-12-30');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(getDayLabel(day).en).not.toContain('Octave');
    expect(getDayLabel(day).en).toBe('Friday in Christmastide (Feria)');
  });

  it("picks St. Lawrence's own elevated closing day (Aug 17) over the Assumption's ordinary day 3, both duplex now that Assumption's octave is strengthened, via the closing-day tie-break -- with St. Hyacinth (Duplex, tied with Lawrence's own elevated rank) commemorated rather than winning outright", () => {
    // Live-verified against the reference engine directly (Monastic
    // Tridentinum 1617, command=prayMatutinum): Aug 17 is "In Octava S.
    // Laurentii Martyris ~ Duplex" -- Lawrence's own elevated closing day
    // wins outright, with Hyacinth's own alternate-rubric block titled
    // "Commemoratio S. Hyacinthi Confessoris" confirming he's the one
    // merely commemorated there. A tie against an octave's own elevated
    // closing day favors the octave (calendar/index.ts's applyOctaves),
    // unlike an ordinary mid-octave day's tie, which still favors an
    // occurring saint (see octaves.test.ts and the December/September
    // sanctoral tests for those counterexamples). Octave-vs-octave, the
    // same closing-day precedence applies (2026-08 user instruction,
    // octaves.ts's pickWinningOctave): now that Assumption's own octave
    // is strengthened to `wins: duplex`, its ordinary day 3 ties
    // Lawrence's elevated closing day in rank, and the closing day wins
    // that tie regardless of which octave started more recently. The
    // Assumption's own day 3 still gets named, not dropped, alongside
    // it -- with its own full "Nth Day within the Octave of X" phrasing,
    // not a bare name: live-verified directly (Divino Afflatu 1954, where
    // Aug 17's real winner is Hyacinth himself, not Lawrence's octave -- a
    // different rubric-track outcome, but the same commemoration phrasing
    // question): "Commemoratio: Tertia die infra Octavam S. Assumptionis
    // Beatæ Mariæ Virginis", not a bare "The Assumption of the Blessed
    // Virgin Mary".
    expect(getDayLabel(resolveDay('2026-08-17')).en).toBe(
      'Octave of St. Lawrence, Martyr (Duplex) — 3rd Day within the Octave of The Assumption of the Blessed Virgin Mary — St. Hyacinth, Confessor',
    );
    expect(getDayLabel(resolveDay('2026-08-18')).en).toBe(
      '4th Day within the Octave of The Assumption of the Blessed Virgin Mary (Duplex)',
    );
  });

  it('a sanctoral winner on a Sunday still leaves the Sunday commemorated, but neither octave it also happens to overlap -- not an octave name at all', () => {
    // 2026-08-16 is a Sunday genuinely within both St. Lawrence's and the
    // Assumption's overlapping octave windows -- St. Joachim (Duplex II
    // Class) wins outright per the ordinary-Sunday Duplex+ threshold, not
    // the Sunday itself (this test's own name was wrong about that before
    // this case existed). Live-verified against Divino Afflatu 1954: the
    // commemoration line reads only "Dominica XII Post Pentecosten" (this
    // app's own Trinity-counted display is one week off from that
    // Pentecost-counted number, so "11th ... after Trinity" here) -- no
    // octave named at all, even though both are technically active, same
    // as this app's own established `ordinary-feria`-only gate for
    // octave mentions alongside a sanctoral winner.
    const day = resolveDay('2026-08-16');
    expect(day.weekday).toBe('sunday');
    expect(getDayLabel(day).en).toBe(
      'St. Joachim, Confessor, Father of the Blessed Virgin Mary (Duplex II Class) — The 11th Sunday after Trinity',
    );
    expect(getDayLabel(day).en).not.toContain('Octave');
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
    expect(getDayLabel(resolveDay('2026-12-15')).en).toBe(
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
    expect(getDayLabel(day).en).not.toContain('Octave');
  });

  it('the Assumption octave, strengthened to `wins: duplex`, now outright displaces St. John Eudes (demoted to Semiduplex) on its own ordinary day 5 -- he is merely commemorated, not won as the day\'s own winner', () => {
    // 2026-08 user decision: St. John Eudes demoted from the reference
    // engine's own Duplex to Semiduplex (see st-john-eudes.yml), and the
    // Assumption's octave strengthened from the shared default
    // (`wins: semiduplex`) to `wins: duplex` (see assumption.yml, same
    // pattern as pentecost-sunday.yml's own override) specifically so an
    // ordinary-day tie no longer favors the occurring saint here: Eudes's
    // Semiduplex now loses outright to the octave's Duplex threshold,
    // rather than tying and winning. This deliberately diverges from the
    // reference engine's own live behavior (which has Eudes winning
    // outright as Duplex) -- see CLAUDE.md's "not a reconstruction" note.
    expect(getDayLabel(resolveDay('2026-08-19')).en).toBe(
      '5th Day within the Octave of The Assumption of the Blessed Virgin Mary (Duplex) — St. John Eudes, Confessor',
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
    expect(getDayLabel(resolveDay('2026-05-24')).en).toBe('Pentecost (Duplex I Class)');
  });
});

describe('getDayLabel — feast name combination', () => {
  // 2026-06-15 (the "2nd week after Trinity" Monday, Easter+71) used to
  // be free of any octave; now it's day 4 of Sacred Heart's own octave
  // (Easter+68 through +75, added 2026-08-26 -- see TODO.md), and that
  // offset range is fixed relative to Easter every year, not just this
  // one, so no year-swap avoids it for "2nd week after Trinity"
  // specifically. Moved to the "3rd week after Trinity" Monday
  // (Easter+78) instead, clear of Ascension's (+39..+46) and the
  // Corpus Christi/Sacred Heart combined (+60..+75) octave ranges.
  const base: LiturgicalDay = {
    date: '2026-06-22',
    weekday: 'monday',
    season: 'trinitytide',
    temporalCategory: 'ordinary-feria',
    winner: { kind: 'temporal', id: 'post-pentecost-03' },
    commemorations: [],
  };

  it('shows just the feast name when it wins outright', () => {
    const day: LiturgicalDay = {
      ...base,
      winner: { kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex' },
    };
    expect(getDayLabel(day).en).toBe('St. Ereden (Duplex)');
  });

  it('shows both, winner first, when a feast is merely commemorated', () => {
    const day: LiturgicalDay = {
      ...base,
      commemorations: [{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex-2-classis' }],
    };
    expect(getDayLabel(day).en).toBe('Monday in the 3rd week after Trinity (Feria) — St. Ereden');
  });

  it('shows just the temporal label when nothing is commemorated at all', () => {
    expect(getDayLabel(base).en).toBe('Monday in the 3rd week after Trinity (Feria)');
  });
});

describe('getDayLabel/getVespersStatusLabel — Vespers evening with a temporal (Sunday) winner', () => {
  it('2026-08-29 (Decollation of St. John Baptist, plain Duplex, below keepsOwnSecondVespers threshold) anticipates the following ordinary Sunday, which wins outright over Ss. Felix and Adauctus (Simplex) -- the Sunday must lead the label, with both real commemorations (Felix/Adauctus and the displaced Decollation) trailing, and the status must read First, not Second, Vespers', () => {
    // Regression test: getDayLabel's temporal-fallback branch used to list
    // commemorations *before* the winner, so this read "Ss. Felix and
    // Adauctus, Martyrs -- The Beheading of St. John the Baptist (of
    // today) -- The 13th Sunday after Trinity (Semiduplex)", making the
    // actual winner (the Sunday) look like an afterthought and the
    // Sunday's own rank label ("Semiduplex") look like it belonged to
    // Felix and Adauctus instead. And getVespersStatusLabel used to say
    // "Second Vespers (of today)" here since its old detection
    // (`winner.vespersFrom`) only ever fires for a *sanctoral*
    // tomorrow-winner, never a temporal one like this Sunday.
    const day = resolveEveningDay('2026-08-29');
    expect(day.date).toBe('2026-08-30');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-14' });
    expect(getDayLabel(day).en).toBe(
      "The 13th Sunday after Trinity (Semiduplex) — Ss. Felix and Adauctus, Martyrs — The Beheading of St. John the Baptist (of today) — St. Rose of Lima, Virgin (transferred away)",
    );
    expect(getVespersStatusLabel(day, '2026-08-29').en).toBe('First Vespers (of tomorrow)');
  });

  it("a plain kept evening (no anticipation) still reads Second Vespers", () => {
    // 2026-08-17, St. Lawrence's own octave closing day (Duplex), keeps
    // its own evening outright -- sanity check that the date-comparison
    // rewrite of getVespersStatusLabel didn't flip the non-anticipating
    // case too.
    const day = resolveEveningDay('2026-08-17');
    expect(day.date).toBe('2026-08-17');
    expect(getVespersStatusLabel(day, '2026-08-17').en).toBe('Second Vespers (of today)');
  });
});
