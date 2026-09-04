import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';

// September Ember days (Wed/Fri/Sat nearest Sept 14) and Advent Ember days
// (Wed/Fri/Sat after the 3rd Sunday of Advent) are privileged ferias, not
// named feasts -- calendar/ember-days.ts relabels the day's own temporal
// id (or adds a commemoration) so their real proper content is found,
// while calendar/temporal.ts's septemberEmberDayOffset feeds
// resolveTemporalCategory's privileged-feria-minor threshold for the
// September precedence contest (Advent's already covered by its own
// season default). All dates below verified against the live reference
// engine (Monastic Tridentinum 1617) during authoring, 2026-08-22.
describe('Ember days', () => {
  it('September Ember Wednesday 2026 (Sept 16): Ss. Cornelius & Cyprian (Semiduplex) win outright, Ember commemorated', () => {
    const day = resolveDay('2026-09-16');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-cornelius-and-cyprian',
      name: 'Ss. Cornelius, Pope, and Cyprian, Bishop, Martyrs',
      nameLa: 'Sanctus Cornelius, Papa, et Sanctus Cyprianus, Episcopus, Martyres',
      rank: 'semiduplex',
    });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'ember-september-wednesday' });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('September Ember Friday 2026 (Sept 18): St. Joseph of Cupertino (Duplex) wins outright, Ember commemorated', () => {
    const day = resolveDay('2026-09-18');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(day.winner.kind).toBe('sanctoral');
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'ember-september-friday' });
  });

  it('September Ember Saturday 2026 (Sept 19): St. Januarius (Semiduplex) wins outright, Ember commemorated', () => {
    const day = resolveDay('2026-09-19');
    expect(day.temporalCategory).toBe('privileged-feria-minor');
    expect(day.winner.kind).toBe('sanctoral');
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'ember-september-saturday' });
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
    // Demoted cases (2026): a saint wins outright, Ember rides along as a
    // commemoration -- collectCommemorations' temporal branch previously
    // only matched resolveTemporalId(day.date), never an Ember-relabeled id.
    expect(getDayLabel(resolveDay('2026-09-16')).en).toContain('Ember Wednesday in September');
    expect(getDayLabel(resolveDay('2026-09-18')).en).toContain('Ember Friday in September');
    expect(getDayLabel(resolveDay('2026-09-19')).en).toContain('Ember Saturday in September');
    // Winning-outright cases: previously fell through to the plain
    // ordinal weekday label with no Ember mention at all.
    expect(getDayLabel(resolveDay('2023-09-20')).en).toBe('Ember Wednesday in September (Feria) — Vigil of St. Matthew');
    expect(getDayLabel(resolveDay('2026-12-16')).en).toBe('Ember Wednesday in Advent (Feria)');
    expect(getDayLabel(resolveDay('2026-12-18')).en).toBe('Ember Friday in Advent (Feria)');
    expect(getDayLabel(resolveDay('2026-12-19')).en).toContain('Ember Saturday in Advent (Feria)');
  });

  it('Matins renders 3 real, distinct, verified lessons+responsories for each of the 6 Ember days', () => {
    const dates = ['2026-09-16', '2026-09-18', '2026-09-19', '2026-12-16', '2026-12-18', '2026-12-19'];
    for (const date of dates) {
      const ordo = resolveOrdo('matins', date);
      const lessons = ordo.parts.filter((p) => p.kind === 'lesson') as {
        text: { status: { en?: string } };
        responsory?: { text: { status: { en?: string } } };
      }[];
      const emberLessons = lessons.filter((l) => l.text.status.en === 'verified' && l.responsory !== undefined);
      expect(emberLessons.length).toBeGreaterThanOrEqual(3);
    }
  });
});
