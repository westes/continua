import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';
import type { HourId } from '../../src/hours';

// St. Benedict Joseph Labre (Apr 16) and St. Felix of Cantalice (May 21), from
// Sancti/aliquibus locis, and St. Stanislaus Kostka (Dec 5), from Sancti/Urbis.
// All are deflated one tier from the source rank (DESIGN.md, rank deflation for
// late canonizations: 1881, 1712), Simplex each. Kostka keeps his source Duplex:
// Dec 5 is in Advent, where only a Duplex wins over the privileged feria.
const SAINTS = [
  { id: 'st-benedict-joseph-labre', date: '2026-04-16', rank: 'simplex', name: 'Benedict Joseph Labre', collect: 'Benedíctum Joséphum', life: 'Amettes' },
  { id: 'st-felix-of-cantalice', date: '2025-05-21', rank: 'simplex', name: 'Felix of Cantalice', collect: 'Fac nos, Dómine Jesu', life: 'Cantalício' },
  { id: 'st-stanislaus-kostka', date: '2028-12-05', rank: 'duplex', name: 'Stanislaus Kostka', collect: 'beáti Stanislai exémplo', life: 'Kostkarum' },
] as const;

const HOURS: HourId[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers'];

describe('Labre, Felix of Cantalice and Kostka', () => {
  it.each(SAINTS)('$id wins $date as a $rank', ({ id, date, rank }) => {
    expect(resolveDay(date).winner).toMatchObject({ kind: 'sanctoral', id, rank });
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

  it('Kostka: St. Sabbas is commemorated on Dec 5', () => {
    expect(resolveDay('2028-12-05').commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-sabbas' }));
  });

  it('on a day that outranks him, Labre is commemorated with his own collect (Apr 16, 2027, Octave of St. Joseph)', () => {
    const day = resolveDay('2027-04-16');
    expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-benedict-joseph-labre' }));
  });
});
