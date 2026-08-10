import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Clean per-annum dates, verified against Divinum Officium (Monastic
// Tridentinum 1617) to have no sanctoral override — see
// data/psalter-distribution.yml and data/hours/*-antiphons.yml for how
// each was chosen.
const SUNDAY = '2026-08-09';
const MONDAY = '2026-08-31';
const TUESDAY = '2026-10-13';

const LITTLE_HOURS = ['terce', 'sext', 'none'] as const;
const PSALMS_BY_HOUR: Record<(typeof LITTLE_HOURS)[number], [number, number, number]> = {
  terce: [119, 120, 121],
  sext: [122, 123, 124],
  none: [125, 126, 127],
};

describe.each(LITTLE_HOURS)('resolveOrdo(%s, ...)', (hourId) => {
  it('is implemented', () => {
    const ordo = resolveOrdo(hourId, TUESDAY);
    expect(ordo.notImplemented).toBeUndefined();
    expect(ordo.hourId).toBe(hourId);
  });

  it('resolves three psalms from the gradual set on a plain weekday, framed by one antiphon', () => {
    const ordo = resolveOrdo(hourId, TUESDAY);
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm');
    expect(psalmParts.map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined))).toEqual(
      PSALMS_BY_HOUR[hourId],
    );
    expect(psalmParts[0]?.kind === 'psalm' ? psalmParts[0].antiphon?.status.en : undefined).toBe('verified');
    // No closing repeat of the antiphon — confirmed against the real engine.
    expect(psalmParts[1]?.kind === 'psalm' ? psalmParts[1].antiphon : undefined).toBeUndefined();
    expect(psalmParts[2]?.kind === 'psalm' ? psalmParts[2].antiphon : undefined).toBeUndefined();
    expect(ordo.parts.some((p) => p.kind === 'antiphon')).toBe(false);
  });

  it('slices Psalm 118 by section on Sunday and Monday instead of the gradual set', () => {
    const sunday = resolveOrdo(hourId, SUNDAY);
    const sundayPsalms = sunday.parts.filter((p) => p.kind === 'psalm');
    expect(sundayPsalms.every((p) => (p.kind === 'psalm' ? p.psalmNumber === 118 : false))).toBe(true);

    const monday = resolveOrdo(hourId, MONDAY);
    const mondayPsalms = monday.parts.filter((p) => p.kind === 'psalm');
    expect(mondayPsalms.every((p) => (p.kind === 'psalm' ? p.psalmNumber === 118 : false))).toBe(true);

    // Different sections, not a repeat of Sunday's.
    const sundayVerseNs = sundayPsalms[0]?.kind === 'psalm' ? sundayPsalms[0].verses.map((v) => v.n) : [];
    const mondayVerseNs = mondayPsalms[0]?.kind === 'psalm' ? mondayPsalms[0].verses.map((v) => v.n) : [];
    expect(sundayVerseNs).not.toEqual(mondayVerseNs);
  });

  it('resolves the hymn as fully self-contained, verified text (no seasonal doxology append)', () => {
    const ordo = resolveOrdo(hourId, TUESDAY);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn && hymn.kind === 'hymn' ? hymn.text.status.en : undefined).toBe('verified');
    expect(hymn && hymn.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Amen.');
  });

  it('resolves the per-annum capitulum with its citation', () => {
    const ordo = resolveOrdo(hourId, TUESDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.status.en : undefined).toBe('verified');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBeDefined();
  });

  it("resolves the day's own collect as the closing prayer", () => {
    const ordo = resolveOrdo(hourId, SUNDAY); // post-pentecost-11 — real, verified collect
    const prayer = ordo.parts.find((p) => p.kind === 'prayer');
    expect(prayer && prayer.kind === 'prayer' ? prayer.text.status.en : undefined).toBe('verified');
    expect(prayer && prayer.kind === 'prayer' ? prayer.text.text.en : undefined).toContain('Let us pray.');
  });

  it('ends with the shared Little Hour conclusion, identical across all three hours', () => {
    const ordo = resolveOrdo(hourId, TUESDAY);
    const conclusion = ordo.parts.find((p) => p.kind === 'preces' && p.label === 'Conclusion');
    expect(conclusion && conclusion.kind === 'preces' ? conclusion.text.text.en : undefined).toContain(
      'Let us bless the Lord.',
    );
  });
});
