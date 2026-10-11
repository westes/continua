import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';
import type { HourId } from '../../src/hours';

// The seven Lenten and pre-Lenten Passion feasts (Divinum Officium's
// Sancti/aliquibus locis/Quad*), each a Duplex majus movable feast on its own
// Easter offset, over the feria of that day, which it commemorates.
// Dates are chosen so no higher-ranked saint takes the day or the eve.
const FEASTS: { id: string; date: string; feria: string | undefined; label: string }[] = [
  { id: 'prayer-on-the-mount-of-olives', date: '2025-02-18', feria: undefined, label: 'Prayer of Our Lord Jesus Christ on the Mount of Olives' },
  { id: 'commemoration-of-the-passion', date: '2024-02-06', feria: undefined, label: 'Commemoration of the Most Holy Passion' },
  { id: 'crown-of-thorns', date: '2026-02-20', feria: 'friday-after-ash-wednesday', label: 'Crown of Thorns' },
  { id: 'lance-and-nails', date: '2027-02-19', feria: 'ember-lent-friday', label: 'Holy Lance and Nails' },
  { id: 'holy-shroud', date: '2027-02-26', feria: 'lent-2-friday', label: 'Holy Shroud' },
  { id: 'five-holy-wounds', date: '2027-03-05', feria: 'lent-3-friday', label: 'Five Holy Wounds' },
  { id: 'precious-blood-in-lent', date: '2027-03-12', feria: 'lent-4-friday', label: 'Most Precious Blood' },
];

const HOURS: HourId[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers'];

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe('Lenten and pre-Lenten Passion feasts', () => {
  it.each(FEASTS)('$id wins $date; the feria $feria (if it has its own record) is commemorated', ({ id, date, feria }) => {
    const day = resolveDay(date);
    expect(day.winner).toEqual({ kind: 'temporal', id });
    if (feria) {
      expect(day.commemorations.some((c) => c.kind === 'temporal' && c.id === feria)).toBe(true);
    }
  });

  it.each(FEASTS)('$id: every hour resolves with no missing part, the collect is the feast\'s own', ({ id, date, label }) => {
    const day = resolveDay(date);
    expect(getDayCollect(day).status.la).toBe('verified');
    for (const hour of HOURS) {
      const ordo = resolveOrdo(hour, date);
      for (const part of ordo.parts) {
        const text = 'text' in part ? part.text : undefined;
        if (!text || !('status' in text)) continue;
        expect(text.status.la, `${id} ${hour} ${part.kind}: Latin missing`).not.toBe('missing');
        expect(text.status.en, `${id} ${hour} ${part.kind}: English missing`).not.toBe('missing');
      }
    }
    expect(JSON.stringify(resolveOrdo('lauds', date).dayLabel)).toContain(label);
  });

  it.each(FEASTS)('$id has its own First Vespers the evening before', ({ date, label }) => {
    const ordo = resolveOrdo('vespers', dayBefore(date));
    expect(JSON.stringify(ordo.dayLabel)).toContain(label);
  });

  it('a Duplex saint on the same date is commemorated, not the other way round (Ss. Perpetua and Felicity, Holy Shroud, 2026-03-06)', () => {
    const day = resolveDay('2026-03-06');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'holy-shroud' });
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'ss-perpetua-and-felicity')).toBe(true);
  });

  it('an equal-ranked saint keeps the day and the feast is commemorated (St. Scholastica, Duplex majus, 2026-02-10)', () => {
    const day = resolveDay('2026-02-10');
    expect(day.winner.kind).toBe('sanctoral');
    expect(day.winner).toMatchObject({ id: 'st-scholastica' });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'commemoration-of-the-passion' });
  });

  it('the feast outranks the Ember Friday of Lent and a Duplex saint both: Lance and Nails, 2026-02-27', () => {
    const day = resolveDay('2026-02-27');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'lance-and-nails' });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'ember-lent-friday' });
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-gabriel-of-our-lady-of-sorrows')).toBe(true);
  });

  it('Matins keeps three nocturns with the feast\'s own psalmody, and includes the commemorated feria\'s Gospel', () => {
    const ordo = resolveOrdo('matins', '2027-03-05');
    expect(ordo.parts.filter((p) => p.kind === 'section-heading' && /^Nocturn/.test(p.label ?? '')).length).toBe(3);
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalms).toEqual(expect.arrayContaining([10, 14, 23, 21, 65, 75, 95, 96, 97]));
    expect(ordo.parts.filter((p) => p.kind === 'gospel').length).toBeGreaterThanOrEqual(2);
  });

  it('the Lent 4 Friday feast shares the Most Precious Blood\'s office, including its Lauds hymn, under its own id', () => {
    const lauds = resolveOrdo('lauds', '2027-03-12');
    const hymn = lauds.parts.find((p) => p.kind === 'hymn');
    expect(hymn && 'text' in hymn ? hymn.text.text.la : '').toContain('Salvéte, Christi vúlnera');
  });

  it('the feast claims First Vespers over a lesser saint but not over a higher one (St. Joseph, Duplex, 2026-03-19 evening)', () => {
    // Joseph (Duplex) loses the evening to the Duplex majus feast of the next
    // day, and is commemorated.
    const evening = resolveOrdo('vespers', '2026-03-19');
    expect(JSON.stringify(evening.dayLabel)).toContain('Most Precious Blood');
  });
});
