import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

describe('resolveOrdo("prime", ...)', () => {
  it('is implemented and resolves a psalm from the weekday-variable slot', () => {
    const ordo = resolveOrdo('prime', '2026-08-09');
    expect(ordo.notImplemented).toBeUndefined();
    expect(ordo.hourId).toBe('prime');

    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm');
    expect(psalmParts.length).toBeGreaterThan(0);
    expect(psalmParts[0]).toMatchObject({ kind: 'psalm', psalmNumber: 1 });
  });

  it('resolves fixed parts (hymn, chapter, prayer) as pending until propers data exists', () => {
    const ordo = resolveOrdo('prime', '2026-08-09');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn).toBeDefined();
    if (hymn && hymn.kind === 'hymn') {
      expect(hymn.text.status.en).toBe('missing');
    }
  });

  it('surfaces verified/draft/missing status per language, per verse', () => {
    const ordo = resolveOrdo('prime', '2026-08-09');
    const psalm = ordo.parts.find((p) => p.kind === 'psalm');
    expect(psalm && psalm.kind === 'psalm' ? psalm.verses.length : 0).toBe(3);
    if (psalm && psalm.kind === 'psalm') {
      expect(psalm.verses[0]?.status.en).toBe('draft');
      expect(psalm.verses[2]?.status.en).toBe('missing');
    }
  });
});

describe('resolveOrdo for not-yet-built hours', () => {
  it('flags compline as not implemented rather than throwing', () => {
    const ordo = resolveOrdo('compline', '2026-08-09');
    expect(ordo.notImplemented).toBe(true);
    expect(ordo.parts).toEqual([]);
  });
});
