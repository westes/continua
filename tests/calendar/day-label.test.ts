import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveEveningDay } from '../../src/calendar/vespers';
import { getDayLabel, getVespersStatusLabel, temporalLabel } from '../../src/calendar/day-label';
import type { LiturgicalDay } from '../../src/calendar/types';

describe('getDayLabel — ordinal temporal label', () => {
  it("labels an anchor's own partial week as \"Weekday after {Anchor}\"", () => {
    // Not 2026 (Trinity Sunday May 31, so Trinity Monday June 1): that
    // date is now St. Angela Merici's own fixed day (Duplex, added per
    // the full-year sanctoral import), which would win outright and hide
    // this purely-temporal label case. 2027's Trinity Sunday is May 23,
    // so Trinity Monday is May 24 -- free of any sanctoral entry.
    expect(getDayLabel(resolveDay('2027-05-24')).en).toBe('Monday after Trinity Sunday (Feria)');
    // (Epiphany's own partial week is now the Octave of the Epiphany, so it
    // no longer produces this label.)
    // Latin: spelled-out ferial weekday name (not roman numerals) and the
    // "Feria" rank label, which is already the real Latin word.
    expect(getDayLabel(resolveDay('2027-05-24')).la).toBe('Feria Secunda post Dominica Sanctissimae Trinitatis (Feria)');
  });

  it('names the anchor day itself, not "day after itself"', () => {
    // Trinity Sunday 2026 (May 31) is now also the Queenship of the
    // Blessed Virgin Mary's own fixed day (Duplex II Classis, added per
    // the full-year sanctoral import). Trinity Sunday itself used to be
    // modeled as plain `ordinary-sunday` with no special first-class
    // standing of its own, purely a cosmetic label overlay -- fixed
    // 2026-09-04 with a real `trinity-sunday` temporal-feast record
    // (calendar/data/calendar/temporal-feasts/trinity-sunday.yml),
    // `unconditional: true` per direct instruction (a principal Sunday
    // shouldn't lose to a same-rank fixed-date collision, same shape as
    // christ-the-king.yml). Trinity Sunday now wins outright and the
    // Queenship is commemorated instead, by bare name only — a
    // commemoration never carries a rank parenthetical, only the day's
    // own winner does.
    expect(getDayLabel(resolveDay('2026-05-31')).en).toBe(
      'The Most Holy Trinity (Duplex II Class) — St. Petronilla, Virgin — The Queenship of the Blessed Virgin Mary',
    );
    // St. Vincent Ferrer is only Duplex, below the Easter-octave backlog's
    // duplex-majus floor (calendar/index.ts's `EASTER_OCTAVE_BACKLOG_FLOOR`)
    // -- he never actually lands anywhere and simply lapses for the year,
    // so the label says so plainly instead of claiming an "elsewhere" that
    // doesn't exist.
    expect(getDayLabel(resolveDay('2026-04-05')).en).toBe(
      "Easter (Duplex I Class) — St. Vincent Ferrer, Priest (omitted this year)",
    );
    expect(getDayLabel(resolveDay('2026-02-18')).en).toBe(
      "Ash Wednesday — St. Simeon, Bishop and Martyr (transferred away)",
    );
    // Latin: the winner now has a real authored nameLa (see
    // calendar/data/calendar/saints/queenship-of-the-bvm.yml and
    // temporal-feasts/trinity-sunday.yml's own "Sanctissima Trinitas"),
    // so this is real Latin throughout — the rank label ("Duplex II.
    // Classis") was already real Latin before this.
    expect(getDayLabel(resolveDay('2026-05-31')).la).toBe(
      'Sanctissima Trinitas (Duplex II. Classis) — Sancta Petronilla, Virgo — Beata Maria Virgo Regina',
    );
    expect(getDayLabel(resolveDay('2026-04-05')).la).toBe(
      'Pascha (Duplex I. Classis) — Sanctus Vincentius Ferrerius, Presbyter (omissa hoc anno)',
    );
    expect(getDayLabel(resolveDay('2026-02-18')).la).toBe(
      'Feria Quarta Cinerum — Sanctus Simeon, Episcopus et Martyr (translata alio)',
    );
  });

  it('gives the correct week-after-Trinity ordinal', () => {
    // July itself is no longer a safe month for this case: between the
    // full-year sanctoral import and the two "hidden saint" finds landed
    // here in the same 2026-09 session (St. Irenaeus at Jun 28, St.
    // Camillus de Lellis at Jul 18), every week-N Monday after Trinity
    // that could fall in July now collides with a real saint in at least
    // one nearby year -- confirmed by scanning 2024-2060 directly rather
    // than guessing. 2028's Trinity Sunday is June 4, so the Monday of
    // the 12th week after Trinity (Sep 4) lands safely in September,
    // clear of any sanctoral entry.
    expect(getDayLabel(resolveDay('2028-09-04')).en).toBe('Monday in the 12th week after Trinity (Feria)');
  });

  it("Advent's own anchor Sunday is already week 1, not a separate anchor-week case", () => {
    // 2025-11-30 is also St. Andrew's own day (Duplex II. classis) — a
    // privileged Sunday transfers *everything*, no rank exception
    // (live-verified 2026-09-01, correcting an earlier, inaccurate claim
    // that he was commemorated in place: the real Monastic 1617 engine
    // shows "Transfer: S. Andreæ Apostoli", not a commemoration), so the
    // label shows him as transferred away rather than paired alongside
    // Advent I.
    expect(getDayLabel(resolveDay('2025-11-30')).en).toBe('The 1st Sunday of Advent (Semiduplex) — St. Andrew, Apostle (transferred away)');
    // Dec 1 is where Andrew's own transfer actually lands (the next open
    // day, `privileged-feria-advent`'s Duplex threshold easily clears
    // for a Duplex II. classis) — live-verified 2026-09-01, the real
    // Monastic 1617 engine shows "S. Andreæ Apostoli ~ Duplex II. classis"
    // there outright, "Tempora: Feria II infra Hebdomadam I Adventus"
    // underneath, matching this. The plain "In the 1st week of Advent"
    // feria commemoration this day also carries internally (day.commemorations
    // still has it) is no longer shown in the label (2026-09-05: a plain
    // temporal commemoration is dropped from the label whenever anything
    // else is already being celebrated — general, not Ember-specific).
    expect(getDayLabel(resolveDay('2025-12-01')).en).toBe('St. Andrew, Apostle (Duplex II Class, transferred)');
    // Dec 4 (St. Barbara, merely commemorated, not high-ranked enough to
    // win outright) is a clean example of the season-ordinal label itself.
    // Advent drops the redundant leading weekday word now that the header
    // always shows the weekday on its own (see temporalLabel's
    // `dropWeekdayPrefix`).
    expect(getDayLabel(resolveDay('2025-12-04')).en).toBe('In the 1st week of Advent (Feria) — St. Barbara, Virgin and Martyr');
    // Latin: same weekday-drop, and the season-ordinal genitive
    // construction ("Hebdomada prima Adventus") needs no extra linking
    // word — 4th-declension "Adventus" has the same genitive form.
    expect(getDayLabel(resolveDay('2025-12-04')).la).toBe('In hebdomada prima Adventus (Feria) — Sancta Barbara, Virgo et Martyr');
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
  it('labels a resumed Sunday/weekday as "after Epiphany, resumed", not the next Trinity-counted number', () => {
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
      'The 5th Sunday after Epiphany, resumed (Semiduplex) — Ss. Tryphon, Respicius, and Nympha, Martyrs',
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
      "The 6th Sunday after Epiphany, resumed (Semiduplex) — St. Gregory Thaumaturgus, Bishop and Confessor (transferred away)",
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
    expect(getDayLabel(resolveDay('2035-10-29')).en).toBe('Monday in the 3rd week after Epiphany, resumed (Feria)');
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
    // pre-existing rule, not new behavior from adding her. The displaced
    // Sunday is commemorated both internally (day.commemorations) and in
    // the label itself, using the same fixed 23rd-after-Trinity ordinal,
    // not a raw elapsed-week count recomputed for 1943.
    expect(getDayLabel(resolveDay('1943-11-21')).en).toBe(
      'The Presentation of the Blessed Virgin Mary (Duplex Majus) — The 23rd Sunday after Trinity — St. Columban, Abbot',
    );
  });
});

describe('getDayLabel — commemorated Sunday/feria under a sanctoral winner', () => {
  it('a saint winning outright on a privileged-feria-advent day still leaves that feria commemorated internally, but the label no longer restates it', () => {
    // 2027-12-07, a Tuesday of Advent: St. Ambrose (Duplex) clears
    // privileged-feria-advent's own Duplex threshold and wins
    // outright, and Advent's own feria is still commemorated in return
    // internally (`decideOccurrence`'s `privileged-feria-advent` branch) --
    // live-verified shape, same mechanism as the ordinary-Sunday case
    // above, for the feria-tier branch instead. But per the 2026-09-05
    // label rule, a plain temporal commemoration (a bare "In the Nth week
    // of Advent") is dropped from the label once something else already
    // has the primary slot -- it isn't Ember-specific, and it applies here
    // too even though this is a feria, not an Ember day.
    expect(getDayLabel(resolveDay('2027-12-07')).en).toBe('St. Ambrose, Bishop, Confessor and Doctor of the Church (Duplex)');
  });
});

describe('getDayLabel — active octave', () => {
  it('shows the octave day itself as the primary label, plus a lesser saint commemorated alongside it', () => {
    // St. Lawrence's own octave (Aug 10-17); Aug 12 is day 3, and also St.
    // Clare's own day -- Simplex, below the octave's semiduplex threshold,
    // so she's commemorated rather than winning. Matches the live engine's
    // own title for this date directly (see saints/st-clare.yml).
    expect(getDayLabel(resolveDay('2026-08-12')).en).toBe(
      'Octave of St. Lawrence, Deacon and Martyr (3rd Day, Semiduplex) — St. Clare, Virgin',
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
    expect(getDayLabel(resolveDay('2028-11-03')).en).toBe('Octave of All Saints (3rd Day, Semiduplex)');
  });

  it("Trinity Sunday itself outranks Pentecost's own octave, which is technically still active on the same day (day 8)", () => {
    // Not 2026 (May 31, the Queenship of the Blessed Virgin Mary's own
    // fixed day, see tests/calendar/transfer.test.ts) and not 2023
    // (June 4, now St. Francis Caracciolo's own fixed day) -- both would
    // muddy this specifically octave-vs-anchor-day check with a sanctoral
    // winner. 2030's Trinity Sunday (June 16) has no sanctoral entry at
    // all, isolating the octave interaction cleanly. Since 2026-09-04,
    // Trinity Sunday is a real, unconditional-winning temporal-feast
    // (see the test above) rather than a purely cosmetic label overlay,
    // so this is now a real occurrence result, not just a label choice --
    // Duplex II Class, its own live-verified rank, not the earlier
    // (never-verified) "Duplex I Class" placeholder this test used to
    // assert.
    expect(getDayLabel(resolveDay('2030-06-16')).en).toBe('The Most Holy Trinity (Duplex II Class)');
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
    // it -- with its own full "Octave of X (Nth Day)" phrasing, not a
    // bare name: live-verified directly (Divino Afflatu 1954, where
    // Aug 17's real winner is Hyacinth himself, not Lawrence's octave -- a
    // different rubric-track outcome, but the same commemoration phrasing
    // question): "Commemoratio: Tertia die infra Octavam S. Assumptionis
    // Beatæ Mariæ Virginis", not a bare "The Assumption of the Blessed
    // Virgin Mary".
    // Commemoration order is most-recent-date-first (2026-09-13 user
    // decision, calendar/commemoration-order.ts): St. Hyacinth's own day
    // is Aug 17 itself, more recent than the Assumption octave's Day 3
    // (whose governing start date is Aug 15), so he now sorts ahead of it.
    expect(getDayLabel(resolveDay('2026-08-17')).en).toBe(
      'Octave of St. Lawrence, Deacon and Martyr (Duplex) — St. Hyacinth, Confessor — Octave of the Assumption of the Blessed Virgin Mary (3rd Day)',
    );
    expect(getDayLabel(resolveDay('2026-08-18')).en).toBe(
      'Octave of the Assumption of the Blessed Virgin Mary (4th Day, Duplex) — St. Agapitus, Martyr',
    );
  });

  it('a sanctoral winner on a Sunday still shows the Sunday commemorated, but neither octave it also happens to overlap', () => {
    // 2026-08-16 is a Sunday genuinely within both St. Lawrence's and the
    // Assumption's overlapping octave windows -- St. Joachim (Duplex II
    // Class) wins outright per the ordinary-Sunday Duplex+ threshold, not
    // the Sunday itself (this test's own name was wrong about that before
    // this case existed). Live-verified against Divino Afflatu 1954: the
    // commemoration line reads only "Dominica XII Post Pentecosten" (this
    // app's own Trinity-counted display is one week off from that
    // Pentecost-counted number, so "11th ... after Trinity" internally) --
    // no octave named at all, even though both are technically active,
    // same as this app's own established `ordinary-feria`-only gate for
    // octave mentions alongside a sanctoral winner. A 2026-09-05 change
    // had wrongly dropped the Sunday name from the label too (not just
    // the octave) -- corrected 2026-09-05 (user: "the label for the day
    // doesn't mention the sunday being commemorated"), restoring exactly
    // what the reference's own commemoration line shows: the Sunday
    // named, no octave.
    const day = resolveDay('2026-08-16');
    expect(day.weekday).toBe('sunday');
    expect(getDayLabel(day).en).toBe(
      'St. Joachim, Confessor, Father of the Blessed Virgin Mary (Duplex II Class) — The 11th Sunday after Trinity',
    );
    expect(getDayLabel(day).en).not.toContain('Octave');
  });

  it("a foreign octave superimposed on a privileged season still governs the label when its own effective rank clears that season's real threshold, with the season's own losing saint commemorated alongside it", () => {
    // The Immaculate Conception's own octave (Dec 8-15) always falls
    // inside Advent, a `privileged-feria-advent` season -- unlike every
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
      'Octave of the Immaculate Conception of the Blessed Virgin Mary (Duplex) — St. Eusebius of Vercelli, Bishop and Martyr',
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
    // outright as Duplex) -- see this project's "not a reconstruction" note.
    expect(getDayLabel(resolveDay('2026-08-19')).en).toBe(
      'Octave of the Assumption of the Blessed Virgin Mary (5th Day, Duplex) — St. John Eudes, Confessor',
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

// Every day from Passion Sunday through Holy Saturday used to render the
// same generic "Weekday in Passiontide" label (no `passiontide` entry in
// ORDINAL_SEASONS) -- fixed 2026-09-06 by giving each of the 14 days its
// own real winner id (calendar/movable-feasts.ts's anchor-based override,
// same mechanism Corpus Christi/Ascension already use) plus a
// temporal-feasts display record. Checked via `getDayLabel` (the actual
// on-screen header), not `temporalLabel` (which recomputes the plain
// temporal identity straight from `resolveTemporalId`, ignoring any
// winner-id override, so it still shows the old generic phrase here on
// purpose -- a different, narrower function, not itself part of this
// fix). A `startsWith` check (not exact equality) tolerates a real
// same-day sanctoral winner/commemoration riding along -- some of these
// 2026 dates are won outright by a real Duplex+ saint (St. Gabriel the
// Archangel, the Annunciation) or carry a transferred-away saint, which
// is expected/correct (see calendar/movable-feasts.ts's Passiontide
// override doc comment), not a bug in this labeling fix.
describe('getDayLabel — Passiontide (Passion Sunday through Holy Saturday)', () => {
  it.each([
    ['2026-03-22', 'Passion Sunday'],
    ['2026-03-23', 'Monday of Passion Week'],
    ['2026-03-24', 'Tuesday of Passion Week'],
    ['2026-03-25', 'Wednesday of Passion Week'],
    ['2026-03-26', 'Thursday of Passion Week'],
    ['2026-03-27', 'Friday of Passion Week'],
    ['2026-03-28', 'Saturday of Passion Week'],
    ['2026-03-29', 'Palm Sunday'],
    ['2026-03-30', 'Monday of Holy Week'],
    ['2026-03-31', 'Tuesday of Holy Week'],
    ['2026-04-01', 'Spy Wednesday'],
    ['2026-04-02', 'Maundy Thursday'],
    ['2026-04-03', 'Good Friday'],
    ['2026-04-04', 'Holy Saturday'],
  ])('%s has its own distinct name starting with "%s", not a generic weekday-in-Passiontide phrase', (date, expectedName) => {
    const day = resolveDay(date);
    const label = getDayLabel(day);
    if (day.winner.kind === 'temporal') {
      expect(label.en?.startsWith(expectedName)).toBe(true);
    }
    expect(label.en).not.toMatch(/in Passiontide/);
    expect(label.la?.length).toBeGreaterThan(0);
    // The plain temporal identity (independent of who wins) is also
    // always this day's own real name now, via `temporalLabel` directly.
    expect(temporalLabel(day).en).toBe(expectedName);
  });

  it('Passion Sunday and Palm Sunday show their real name via getDayLabel on a real date', () => {
    expect(getDayLabel(resolveDay('2026-03-22')).en).toBe('Passion Sunday (Semiduplex)');
    expect(getDayLabel(resolveDay('2026-03-29')).en).toBe('Palm Sunday (Semiduplex)');
  });
});
