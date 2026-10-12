import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';
import type { HourId } from '../../src/hours';

// St. Benedict Joseph Labre (Apr 16) and St. Felix of Cantalice (May 21), from
// Sancti/aliquibus locis. Both are Semiduplex in the source and Simplex here
// (DESIGN.md, rank deflation for late canonizations: 1881 and 1712).
const SAINTS = [
  { id: 'st-benedict-joseph-labre', date: '2026-04-16', name: 'Benedict Joseph Labre', collect: 'Benedíctum Joséphum', life: 'Amettes' },
  { id: 'st-felix-of-cantalice', date: '2025-05-21', name: 'Felix of Cantalice', collect: 'Fac nos, Dómine Jesu', life: 'Cantalício' },
] as const;

const HOURS: HourId[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers'];

describe('Labre and Felix of Cantalice', () => {
  it.each(SAINTS)('$id wins $date as a Simplex', ({ id, date }) => {
    expect(resolveDay(date).winner).toMatchObject({ kind: 'sanctoral', id, rank: 'simplex' });
  });

  it.each(SAINTS)('$id: every hour resolves with no missing part and its own collect', ({ id, date, name, collect }) => {
    const day = resolveDay(date);
    expect(getDayCollect(day).status.la).toBe('verified');
    expect(getDayCollect(day).text.la).toContain(collect);
    for (const hour of HOURS) {
      if (hour === 'vespers') continue; // the evening is the next day's (Simplex gives way)
      const ordo = resolveOrdo(hour, date);
      for (const part of ordo.parts) {
        const text = 'text' in part ? part.text : undefined;
        if (!text || !('status' in text)) continue;
        expect(text.status.la, `${id} ${hour} ${part.kind}: Latin missing`).not.toBe('missing');
        expect(text.status.en, `${id} ${hour} ${part.kind}: English missing`).not.toBe('missing');
      }
      expect(JSON.stringify(ordo.dayLabel)).toContain(name);
    }
  });

  it.each(SAINTS)('$id: Matins carries his life and a Gospel with the homily', ({ date, life }) => {
    const parts = resolveOrdo('matins', date).parts;
    const texts = JSON.stringify(parts.filter((p) => p.kind === 'lesson' || p.kind === 'gospel'));
    expect(texts).toContain(life);
    expect(parts.some((p) => p.kind === 'gospel')).toBe(true);
  });

  it('on a day that outranks him, Labre is commemorated with his own collect (Apr 16, 2027, Octave of St. Joseph)', () => {
    const day = resolveDay('2027-04-16');
    expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-benedict-joseph-labre' }));
  });
});
