import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
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
