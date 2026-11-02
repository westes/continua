import { describe, expect, it } from 'vitest';
import { octaveReadingRecords } from '../../src/propers/store';
import { getOctaveReading } from '../../src/propers/octave-readings';
import { resolveOrdo } from '../../src/hours';

describe('scripture readings always carry a citation', () => {
  const scripture = [...octaveReadingRecords.keys()]
    .map((id) => {
      const m = id.match(/^(.*)-octave-day-(\d+)(-gospel)?$/);
      return m ? { id, octaveId: m[1]!, day: Number(m[2]) , suffix: m[3] } : undefined;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((x) => getOctaveReading(x.octaveId, x.day))
    .filter((r) => r && (r.isScripture || r.isGospel));

  it('finds scripture octave readings to check', () => {
    expect(scripture.length).toBeGreaterThan(10);
  });

  it.each(scripture.map((r) => [r!.id, r!] as const))('%s has a citation in both languages', (_id, r) => {
    expect(r.citation?.la).toBeTruthy();
    expect(r.citation?.en).toBeTruthy();
  });

  it('shows the Ezekiel citation on All Saints octave day 2 (Nov 2 2026) Matins', () => {
    const lesson = resolveOrdo('matins', '2026-11-02').parts.find(
      (p) => p.kind === 'lesson' && JSON.stringify(p.label ?? '').includes('Ezekiel'),
    );
    expect(lesson?.kind === 'lesson' && lesson.text.citation?.en).toBe('Ezek 1:1-9');
  });
});
