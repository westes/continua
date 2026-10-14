import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';

// September Ember days (Wed/Fri/Sat nearest Sept 14) and Advent Ember days
// (Wed/Fri/Sat after the 3rd Sunday of Advent) are privileged ferias, not
// named feasts -- calendar/ember-days.ts relabels the day's own temporal
// id (or adds a commemoration) so their real proper content is found,
// while calendar/temporal.ts's septemberEmberDayOffset/adventEmberDayOffset
// feed resolveTemporalCategory's privileged-feria-ember Duplex threshold
// for both quarters' precedence contest (raised from Semiduplex 2026-09-18,
// deliberately overriding this file's own earlier live-verified Semiduplex
// evidence -- see calendar/types.ts's TemporalCategory doc comment). All
// dates below originally verified against the live reference engine
// (Monastic Tridentinum 1617) during authoring, 2026-08-22, except where
// noted otherwise for the 2026-09-18 threshold change.
describe('Ember days', () => {
  it('September Ember Wednesday 2026 (Sept 16): Ember wins outright, Ss. Cornelius & Cyprian (Semiduplex, below the Duplex threshold) commemorated', () => {
    const day = resolveDay('2026-09-16');
    expect(day.temporalCategory).toBe('privileged-feria-ember');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'ember-september-wednesday' });
    expect(day.commemorations).toContainEqual({
      kind: 'sanctoral',
      id: 'ss-cornelius-and-cyprian',
      name: 'Ss. Cornelius, Pope, and Cyprian, Bishop, Martyrs',
      nameLa: 'Sanctus Cornelius, Papa, et Sanctus Cyprianus, Episcopus, Martyres',
      rank: 'semiduplex',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('September Ember Friday 2026 (Sept 18): Ember wins outright, St. Joseph of Cupertino (Semiduplex, below the Duplex threshold) commemorated', () => {
    const day = resolveDay('2026-09-18');
    expect(day.temporalCategory).toBe('privileged-feria-ember');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'ember-september-friday' });
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-joseph-of-cupertino')).toBe(true);
  });

  it('September Ember Saturday 2026 (Sept 19): Ember wins outright, St. Januarius (Semiduplex, below the Duplex threshold) commemorated', () => {
    const day = resolveDay('2026-09-19');
    expect(day.temporalCategory).toBe('privileged-feria-ember');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'ember-september-saturday' });
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-januarius')).toBe(true);
  });

  it('September Ember Friday 2023 (Sept 22): Ss. Maurice and Companions (Simplex) loses outright, Ember wins with the saint commemorated', () => {
    // Below privileged-feria-ember's Duplex threshold same as the three
    // Semiduplex cases above, just at a lower rank still -- this is the one
    // real below-threshold candidate found by scanning forward from 2015
    // for a year where the Ember-Friday offset lands on Ss. Maurice and
    // Companions' native Sept 22 date.
    const day = resolveDay('2023-09-22');
    expect(day.temporalCategory).toBe('privileged-feria-ember');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'ember-september-friday' });
    expect(day.commemorations).toContainEqual({
      kind: 'sanctoral',
      id: 'ss-maurice-and-companions',
      name: 'Ss. Maurice and Companions, Martyrs',
      nameLa: 'Sanctus Mauritius et Socii, Martyres',
      rank: 'simplex',
    });
  });

  it('Advent Ember Wednesday/Friday/Saturday 2026 (Dec 16/18/19): no competing saint, the Ember day itself wins outright with real content', () => {
    for (const [date, id] of [
      ['2026-12-16', 'ember-advent-wednesday'],
      ['2026-12-18', 'ember-advent-friday'],
      ['2026-12-19', 'ember-advent-saturday'],
    ] as const) {
      const day = resolveDay(date);
      expect(day.winner).toEqual({ kind: 'temporal', id });
      expect(getDayCollect(day).status.en).toBe('verified');
    }
  });

  it("Lauds' Benedictus antiphon is the Ember day's own proper text on all 6 winning-outright days (2026-08-22 added the mechanism/collect/Matins, but not this -- fixed here)", () => {
    // Wed/Fri/Sat winning outright for the September quarter, one per
    // weekday (2026's own dates are all saint-outranked, see above) --
    // found by scanning forward from 2023, all live-verified against the
    // reference engine.
    const cases: [string, string][] = [
      ['2023-09-20', 'Hoc genus'],
      ['2024-09-20', 'Múlier'],
      ['2025-09-20', 'Illumináre, Dómine'],
      ['2026-12-16', 'Missus est Gábriel'],
      ['2026-12-18', 'Ex quo facta est'],
      ['2026-12-19', 'Quómodo fiet istud'],
    ];
    for (const [date, expectedStart] of cases) {
      const ordo = resolveOrdo('lauds', date);
      const idx = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
      const antiphon = ordo.parts[idx + 1] as { text: { text: { la?: string }; status: { la?: string; en?: string } } };
      expect(antiphon.text.status.la).toBe('verified');
      expect(antiphon.text.status.en).toBe('verified');
      expect(antiphon.text.text.la).toContain(expectedStart);
    }
  });

  it("Vespers' Magnificat antiphon is proper on Ember Wednesday (Sept and Advent) where the reference engine actually renders it, not overridden by a Sunday/O-Antiphon", () => {
    // September Ember Friday/Saturday and Advent Ember Friday/Saturday
    // are excluded here: Saturday's Second Vespers is always ceded to the
    // following Sunday (live-verified), and Advent Ember Friday/Saturday
    // (always Dec 18/19) are always inside the O Antiphons' own
    // unconditional Dec 17-23 window -- both real, not gaps.
    const ordo = resolveOrdo('vespers', '2026-12-16');
    const idx = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'magnificat');
    const antiphon = ordo.parts[idx + 1] as { text: { status: { la?: string; en?: string } } };
    expect(antiphon.text.status.la).toBe('verified');
    expect(antiphon.text.status.en).toBe('verified');
  });

  it("the day label names the Ember day itself, both when it's demoted to a commemoration and when it wins outright -- previously never shown anywhere in the UI (2026-09-03 fix)", () => {
    // These 2026 dates now win outright themselves (privileged-feria-ember's
    // Duplex threshold, since the 2026-09-18 split), covered by the general
    // "wins outright" case below already -- kept here as `toContain` checks
    // since they still exercise the label mechanism with a commemoration
    // riding along, just with the roles reversed from when this test was
    // first written.
    expect(getDayLabel(resolveDay('2026-09-16')).en).toContain('Ember Wednesday in September');
    expect(getDayLabel(resolveDay('2026-09-18')).en).toContain('Ember Friday in September');
    expect(getDayLabel(resolveDay('2026-09-19')).en).toContain('Ember Saturday in September');
    // Winning-outright cases: previously fell through to the plain
    // ordinal weekday label with no Ember mention at all.
    expect(getDayLabel(resolveDay('2023-09-20')).en).toBe('Ember Wednesday in September (Feria) — Vigil of St. Matthew — St. Agapitus I, Pope and Confessor');
    expect(getDayLabel(resolveDay('2026-12-16')).en).toBe('Ember Wednesday in Advent (Feria)');
    expect(getDayLabel(resolveDay('2026-12-18')).en).toBe('Ember Friday in Advent (Feria)');
    expect(getDayLabel(resolveDay('2026-12-19')).en).toContain('Ember Saturday in Advent (Feria)');
  });

  it('the day label names Lent/Pentecost Ember days too, including the Pentecost-octave-headline exception (2026-09-19 fix)', () => {
    expect(getDayLabel(resolveDay('2026-02-25')).en).toBe('Ember Wednesday in Lent (Feria) — St. Felix III, Pope and Confessor');
    // Ember Friday of Lent 1 now always yields to the Holy Lance and Nails
    // (a Duplex majus movable feast, data/calendar/temporal-feasts), which is
    // the winner; the Ember Friday rides along as a commemoration.
    expect(getDayLabel(resolveDay('2025-03-14')).en).toContain('Holy Lance and Nails');
    expect(getDayLabel(resolveDay('2025-03-14')).en).toContain('Ember Friday in Lent');
    expect(getDayLabel(resolveDay('2026-02-28')).en).toBe('Ember Saturday in Lent (Feria)');
    // The demoted-to-commemoration case, Lent's own mirror of the
    // September/Advent "saint wins, Ember commemorated" pattern above.
    expect(getDayLabel(resolveDay('2026-02-27')).en).toContain('Ember Friday in Lent');
    // Pentecost's own 3 Ember days: without the Pentecost-specific
    // exception in getDayLabel's governing-octave gate, these would show
    // the bare "Octave of Pentecost (Nth Day)" headline instead of their
    // own Ember identity -- the Octave still rides along as a
    // commemoration, not dropped.
    expect(getDayLabel(resolveDay('2026-05-27')).en).toContain('Ember Wednesday in Pentecost');
    expect(getDayLabel(resolveDay('2026-05-27')).en).toContain('Octave of Pentecost');
    expect(getDayLabel(resolveDay('2026-05-29')).en).toContain('Ember Friday in Pentecost');
    expect(getDayLabel(resolveDay('2026-05-30')).en).toContain('Ember Saturday in Pentecost');
  });

  it('Lent Ember Wednesday/Saturday 2026 (Feb 25/28): no competing saint, the Ember day itself wins outright with real content', () => {
    // Lent's Ember days are fixed Easter offsets (-39/-37/-36), already
    // at the Duplex threshold via temporal-categories.yml's plain
    // `offsets` table (no separate `privileged-feria-ember` category
    // needed, unlike September/Advent) -- see calendar/ember-days.ts's
    // own doc comment. temporalCategory isn't asserted here since these
    // resolve to plain `privileged-feria`, not `privileged-feria-ember`.
    for (const [date, id] of [
      ['2026-02-25', 'ember-lent-wednesday'],
      ['2026-02-28', 'ember-lent-saturday'],
    ] as const) {
      const day = resolveDay(date);
      expect(day.winner).toEqual({ kind: 'temporal', id });
      expect(getDayCollect(day).status.en).toBe('verified');
    }
  });

  it('Lent Ember Friday 2025 (Mar 14): the Holy Lance and Nails wins, Ember Friday commemorated', () => {
    // The Friday of Lent 1 is always an Ember Friday and always the Lance and
    // Nails (Easter -37), a Duplex majus feast that outranks the privileged
    // Ember feria; the feria keeps its own commemoration (and Matins reading).
    const day = resolveDay('2025-03-14');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'lance-and-nails' });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'ember-lent-friday' });
    expect(getDayCollect(day).status.la).toBe('verified');
  });

  it('Lent Ember Friday 2026 (Feb 27): the Holy Lance and Nails wins, Ember Friday and St. Gabriel of Our Lady of Sorrows (Duplex) both commemorated', () => {
    // The mirror image of the September/Advent "saint wins, Ember
    // commemorated" case documented in calendar/ember-days.ts's own doc
    // comment (2026-09-19 fix) -- confirms the same id-relabeling-of-the-
    // existing-commemoration behavior holds for Lent too. St. Gabriel
    // (Duplex, his native date) used to win here; the Duplex majus feast
    // outranks him.
    const day = resolveDay('2026-02-27');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'lance-and-nails' });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'ember-lent-friday' });
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-gabriel-of-our-lady-of-sorrows')).toBe(true);
  });

  it('Pentecost Ember Wednesday/Friday/Saturday 2026 (May 27/29/30): Ember wins outright over a below-threshold saint, Pentecost Octave still commemorated alongside', () => {
    // Confirms the Pentecost-specific applyEmberDay octave-gate fix
    // (calendar/ember-days.ts): Pentecost's own Ember days fall inside
    // Pentecost's own Octave every year, so `activeOctavesFor` always
    // reports it active there -- without the fix exempting the
    // Pentecost octave itself, these would never get relabeled at all.
    // Below-Duplex saints (St. John I Simplex, St. Mary Magdalene de
    // Pazzi Semiduplex, St. Felix I Simplex) are real 2026 collisions on
    // these dates, same shape as the September Wednesday/Friday/Saturday
    // 2026 cases above -- Ember wins, both the saint and the Octave are
    // commemorated alongside.
    for (const [date, id, saintId] of [
      ['2026-05-27', 'ember-pentecost-wednesday', 'st-john-i'],
      ['2026-05-29', 'ember-pentecost-friday', 'st-mary-magdalene-de-pazzi'],
      ['2026-05-30', 'ember-pentecost-saturday', 'st-felix-i'],
    ] as const) {
      const day = resolveDay(date);
      expect(day.winner).toEqual({ kind: 'temporal', id });
      expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === saintId)).toBe(true);
      expect(day.commemorations).toContainEqual({ kind: 'octave', id: 'pentecost-sunday', name: 'Pentecost', nameLa: 'Dominica Pentecostes' });
      expect(getDayCollect(day).status.en).toBe('verified');
    }
  });

  it("Lauds' Benedictus antiphon is proper for the 6 Lent/Pentecost Ember days too", () => {
    const cases: [string, string][] = [
      ['2026-02-25', 'Generátio'],
      ['2026-02-28', 'Assúmpsit Jesus'],
      ['2026-05-27', 'Ego sum panis vivus'],
      ['2026-05-29', 'Dixit Jesus'],
      ['2026-05-30', 'Cáritas Dei'],
    ];
    for (const [date, expectedStart] of cases) {
      const ordo = resolveOrdo('lauds', date);
      const idx = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
      const antiphon = ordo.parts[idx + 1] as { text: { text: { la?: string }; status: { la?: string; en?: string } } };
      expect(antiphon.text.status.la).toBe('verified');
      expect(antiphon.text.status.en).toBe('verified');
      expect(antiphon.text.text.la).toContain(expectedStart);
    }
  });

  it("Vespers' Magnificat antiphon is proper on Lent/Pentecost Ember Wednesday and Friday", () => {
    // Saturday excluded, same reason as the September/Advent case above
    // (Second Vespers always cedes to the following Sunday).
    for (const date of ['2026-02-25', '2026-05-27', '2026-05-29']) {
      const ordo = resolveOrdo('vespers', date);
      const idx = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'magnificat');
      const antiphon = ordo.parts[idx + 1] as { text: { status: { la?: string; en?: string } } };
      expect(antiphon.text.status.la).toBe('verified');
      expect(antiphon.text.status.en).toBe('verified');
    }
  });

  it('Matins renders real, distinct, verified lessons+responsories for each of the Ember days that win their day', () => {
    // All 6 are now 1, not >=3, since 2026-09-04: every Ember day's own
    // nocturn-readings file was recombined into a single reading -- each
    // is one continuous, unbroken homily, split only to fill the fixed
    // 3-lesson slot count, the same "source doesn't genuinely split"
    // default post-pentecost-15.yml's own doc comment establishes.
    // September Friday was the first fixed; Wednesday/Saturday (September)
    // and Wednesday/Friday/Saturday (Advent) followed the same day once
    // the reference source was checked directly for each and confirmed
    // contiguous.
    const dates: [string, number][] = [
      ['2026-09-16', 1],
      ['2026-09-18', 1],
      ['2026-09-19', 1],
      ['2026-12-16', 1],
      ['2026-12-18', 1],
      ['2026-12-19', 1],
      ['2026-02-25', 1],
      ['2026-02-28', 1],
      ['2026-05-27', 1],
      ['2026-05-29', 1],
      ['2026-05-30', 1],
    ];
    for (const [date, minLessons] of dates) {
      const ordo = resolveOrdo('matins', date);
      const lessons = ordo.parts.filter((p) => p.kind === 'lesson') as {
        text: { status: { en?: string } };
        responsory?: { text: { status: { en?: string } } };
      }[];
      const emberLessons = lessons.filter((l) => l.text.status.en === 'verified' && l.responsory !== undefined);
      expect(emberLessons.length).toBeGreaterThanOrEqual(minLessons);
    }
  });
});
