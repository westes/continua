import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveEveningDay } from '../../src/calendar/vespers';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';
import type { HourId } from '../../src/hours';

// The Translation of St. Benedict (Jul 11), authored from SanctiM/07-11M.txt,
// with St. Pius I (Simplex, the date's other occupant) commemorated.
const DATE = '2028-07-11'; // a Tuesday, no Sunday collision
const HOURS: HourId[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers'];

describe('Translation of St. Benedict', () => {
  it('wins its own day at Duplex II. classis, commemorating St. Pius I', () => {
    const day = resolveDay(DATE);
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-benedict-translation', rank: 'duplex-2-classis' });
    expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-pius-i' }));
  });

  it('has its own collect', () => {
    const collect = getDayCollect(resolveDay(DATE));
    expect(collect.status.la).toBe('verified');
    expect(collect.text.la).toContain('Translatiónem celebrántibus');
  });

  it('every hour resolves with no missing part', () => {
    for (const hour of HOURS) {
      const ordo = resolveOrdo(hour, DATE);
      for (const part of ordo.parts) {
        const text = 'text' in part ? part.text : undefined;
        if (!text || !('status' in text)) continue;
        expect(text.status.la, `${hour} ${part.kind}: Latin missing`).not.toBe('missing');
        expect(text.status.en, `${hour} ${part.kind}: English missing`).not.toBe('missing');
      }
      expect(JSON.stringify(ordo.dayLabel)).toContain('Translation of St. Benedict');
    }
  });

  it('Matins carries its own invitatory, three nocturns, the Gospel and Peter Damian\'s sermon', () => {
    const ordo = resolveOrdo('matins', DATE);
    const invitatory = ordo.parts.find((p) => p.kind === 'psalm' && (p as { psalmNumber: number }).psalmNumber === 94) as
      | { antiphon?: { text: Record<string, string> } }
      | undefined;
    expect(invitatory?.antiphon?.text.la).toContain('In veneratióne beati Patris nostri Benedícti');
    expect(ordo.parts.filter((p) => p.kind === 'section-heading' && /^Nocturn/.test(p.label ?? '')).length).toBe(3);
    expect(ordo.parts.some((p) => p.kind === 'gospel')).toBe(true);
    const readings = JSON.stringify(ordo.parts.filter((p) => p.kind === 'lesson' || p.kind === 'gospel'));
    expect(readings).toContain('Gloriósi Patris nostri Benedícti dulcíssimum nomen');
    expect(readings).toContain('Solémne verbum, magna promíssio');
  });

  it('Lauds and Vespers carry its own hymns and antiphons', () => {
    const lauds = JSON.stringify(resolveOrdo('lauds', DATE).parts);
    expect(lauds).toContain('Aurora surgit aurea');
    expect(lauds).toContain('Vir Dei Benedictus');
    const vespers = JSON.stringify(resolveOrdo('vespers', DATE).parts);
    expect(vespers).toContain('Gemma cælestis');
    expect(vespers).toContain('O cælestis norma vitæ');
  });

  it('has its own First Vespers the evening before, with its own First Vespers hymn', () => {
    expect(resolveEveningDay('2028-07-10').winner).toMatchObject({ kind: 'sanctoral', id: 'st-benedict-translation' });
    const first = JSON.stringify(resolveOrdo('vespers', '2028-07-10').parts);
    expect(first).toContain('Claris conjúbila Gállia');
    expect(first).not.toContain('Gemma cælestis');
    expect(first).toContain('celebrántes ejus Translatiónem');
    expect(first).toContain('Sanctíssime Conféssor Christi Benedícte');
    expect(JSON.stringify(resolveOrdo('vespers', DATE).parts)).toContain('Sancte Pater Benedícte');
  });
});
