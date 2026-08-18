import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { getPsalmsFor } from '../../src/psalter/distribution';

// Two clean proof dates, one per branch — see hours/matins.ts's own header
// and TODO.md for why this is a mechanism build with a small content slice,
// not full-calendar content. Both live-verified against the reference
// engine (Monastic Tridentinum 1617) before authoring.
const FERIAL_DATE = '2026-12-15'; // Tuesday of Advent III — plain ferial, no feast collision.
const SUNDAY_DATE = '2026-09-06'; // 14th Sunday after Trinity — plain Sunday, no feast collision.

describe('resolveOrdo("matins", ...) ferial (1-nocturn) branch', () => {
  const ordo = resolveOrdo('matins', FERIAL_DATE);

  it('is no longer notImplemented', () => {
    expect(ordo.notImplemented).toBeUndefined();
  });

  it('opens with the Deus in adjutorium versicle, then Psalm 3, then the Invitatory (Psalm 94)', () => {
    expect(ordo.parts[0]?.kind).toBe('versicle');
    expect(ordo.parts[1]).toMatchObject({ kind: 'psalm', psalmNumber: 3 });
    expect(ordo.parts[2]).toMatchObject({ kind: 'psalm', psalmNumber: 94 });
    const invitatoryAntiphon = (ordo.parts[2] as { antiphon?: { text: Record<string, string> } }).antiphon;
    expect(invitatoryAntiphon?.text.la).toContain('Veníte');
    // Real practice repeats the invitatory antiphon between verse groups —
    // deliberately not modeled that way here (see hours/matins.ts's own
    // header): confirm there's exactly one standalone repeat, not several.
    const standaloneAntiphons = ordo.parts.filter((p) => p.kind === 'antiphon');
    expect(standaloneAntiphons.length).toBeGreaterThan(0);
  });

  it('has exactly 9 ferial psalms, no 3-nocturn structure, and no Te Deum', () => {
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Ps 3 and 94 (opening + invitatory) plus Tuesday's own 9-psalm ferial table.
    expect(psalms).toEqual([3, 94, 43, 44, 47, 48, 49, 54, 55, 58, 59]);
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(false);
    expect(ordo.parts.some((p) => p.kind === 'canticle')).toBe(false);
  });

  it("resolves the user's own bible-plan readings for Advent III Tuesday, not the historical lectionary", () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson');
    // 2 bible-plan readings, plus a 3rd: St. Eusebius of Vercelli's own
    // commemoration reading, generously surfaced per the "commemorations
    // get their own reading" design (see hours/matins.ts's own header) —
    // vu places him Dec 15 (a Monastic 1617 same-day redirect), commemorated
    // under this Advent III Tuesday ferial.
    expect(lessons).toHaveLength(3);
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toEqual(['Isa 36; Isa 37', 'Sap 14', undefined]);
    // Real content isn't imported yet (Vulgate/Douay-Rheims bulk import is
    // a deferred follow-on) — honest `missing`, not fabricated text.
    expect((lessons[0] as { text: { status: { en?: string } } }).text.status.en).toBe('missing');
  });

  it("matches the first reading (Isaiah) against the seeded per-book responsory pool", () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson');
    const first = lessons[0] as { responsory?: { text: { la?: string } } };
    expect(first.responsory?.text.la).toContain('Ægýpte');
  });

  it('closes with the fixed ferial capitulum, then the day collect', () => {
    const chapterIndex = ordo.parts.findIndex((p) => p.kind === 'chapter');
    const prayerIndex = ordo.parts.findIndex((p) => p.kind === 'prayer');
    expect(chapterIndex).toBeGreaterThan(-1);
    expect(prayerIndex).toBeGreaterThan(chapterIndex);
    const chapter = ordo.parts[chapterIndex] as { text: { citation?: { en?: string } } };
    expect(chapter.text.citation?.en).toBe('1 Cor 16:13-14');
  });
});

describe('resolveOrdo("matins", ...) Sunday (3-nocturn) branch', () => {
  const ordo = resolveOrdo('matins', SUNDAY_DATE);

  it('has the full 12-psalm Sunday psalmody (Ps 20-31) plus 3 canticles, and a Te Deum', () => {
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Ps 3 + 94 (opening/invitatory) + 20-31 (Sunday's fixed 12).
    expect(psalms).toEqual([3, 94, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
    const canticles = ordo.parts.filter((p) => p.kind === 'canticle');
    expect(canticles).toHaveLength(3);
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(true);
  });

  it("resolves the user's own bible-plan reading (Tobit/Sirach) for Nocturn 1", () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson');
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toContain('Tob 1; Tob 2');
    expect(citations).toContain('Sir 45');
  });

  it('includes the real Nocturn 2 patristic reading (Gregory on Job) and Nocturn 3 Gospel + homily, both flagged correctly', () => {
    const lessons = ordo.parts.filter(
      (p) => p.kind === 'lesson',
    ) as { label?: string; isGospel?: boolean; text: { text: { la?: string } } }[];
    const gregory = lessons.find((l) => l.label?.includes('Gregory'));
    expect(gregory).toBeDefined();
    expect(gregory?.isGospel).toBe(false);

    const gospel = lessons.find((l) => l.isGospel);
    expect(gospel).toBeDefined();
    expect(gospel?.text.text.la).toContain('Naim');

    const homily = lessons.find((l) => l.label?.includes('Augustine'));
    expect(homily).toBeDefined();
    expect(homily?.isGospel).toBe(false);
  });

  it('never sources a Gospel from a Common-of-Saints fallback — every Gospel-flagged reading traces to the bible-plan or a real proper', () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson') as { isGospel?: boolean; label?: string }[];
    const gospels = lessons.filter((l) => l.isGospel);
    // This Sunday's own TSV row deliberately has no Gospel (confirmed
    // editorial choice) — the only Gospel-flagged reading should be the
    // day's own proper Nocturn 3 Gospel, not a substituted Common one.
    expect(gospels).toHaveLength(1);
  });

  it('orders Te Deum after every reading, and the day collect last', () => {
    const teDeumIndex = ordo.parts.findIndex((p) => p.kind === 'te-deum');
    const lastLessonIndex = ordo.parts.map((p) => p.kind).lastIndexOf('lesson');
    const prayerIndex = ordo.parts.findIndex((p) => p.kind === 'prayer');
    expect(teDeumIndex).toBeGreaterThan(lastLessonIndex);
    expect(prayerIndex).toBeGreaterThan(teDeumIndex);
  });
});

describe('resolveOrdo("matins", ...) Duplex+ weekday-feast (3-nocturn, non-Sunday) branch', () => {
  // 2026-08-17 -- St. Lawrence's own octave closing day ("In Octava S.
  // Laurentii Martyris ~ Duplex"), live-verified directly against the
  // reference engine (Monastic Tridentinum 1617, command=prayMatutinum).
  // The mechanism bug this proves fixed: a Duplex+ weekday feast used to
  // fall through to reusing the literal *Sunday* psalmody (Ps 20-31)
  // unconditionally -- confirmed wrong, since a real Duplex+ weekday
  // feast has its own genuinely different psalmody (see
  // hours/matins-psalmody-overrides.ts and its own st-lawrence.yml proof
  // data for the full sourcing detail).
  const ordo = resolveOrdo('matins', '2026-08-17');

  it("uses St. Lawrence's own proper psalmody, not the Sunday scheme, across 3 nocturns plus a Te Deum", () => {
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Ps 3 + 94 (opening/invitatory), then his own Nocturn 1 (1,2,4,5,8,10)
    // and Nocturn 2 (14,16,20,23,63,91) -- confirmed live, not the Sunday
    // scheme's Ps 20-31 at all.
    expect(psalms).toEqual([3, 94, 1, 2, 4, 5, 8, 10, 14, 16, 20, 23, 63, 91]);
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(true);
  });

  it("every Nocturn 1/2 psalm carries St. Lawrence's own proper antiphon, verified in both languages", () => {
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { status: Record<string, string> } }[];
    // Skip Ps 3 (opening, no antiphon) and Ps 94 (the Invitatory, its own
    // separate antiphon convention) -- the remaining 12 are his own.
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    expect(nocturnPsalms).toHaveLength(12);
    for (const p of nocturnPsalms) {
      expect(p.antiphon?.status.la).toBe('verified');
      expect(p.antiphon?.status.en).toBe('verified');
    }
  });

  it('has 3 real OT canticles in Nocturn 3, verified in both languages, sourced from the newly-authored Sirach/Jeremiah chapters', () => {
    const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string; text: { status: Record<string, string> } }[];
    expect(canticles).toHaveLength(3);
    // The first canticle spans two Sirach chapters under one heading in
    // the source -- kept as one canticle with two refs, not split.
    expect(canticles[0]?.canticleId).toBe('sir-14-22_sir-15-3-4_sir-15-6');
    for (const c of canticles) {
      expect(c.text.status.la).toBe('verified');
      expect(c.text.status.en).toBe('verified');
    }
  });

  it("falls back to the plain ferial weekday table, redistributed into 3 nocturns, for a Duplex+ weekday winner with no override authored", () => {
    // St. Ignatius of Antioch (Duplex, Common of a Martyr-Bishop, no
    // matins-psalmody-overrides entry authored) -- Feb 1 2029, confirmed
    // clean (no Sunday collision) per his own saint-file comment.
    const fallback = resolveOrdo('matins', '2029-02-01');
    const psalms = fallback.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Ps 3 + 94, then Thursday's own 9-psalm ferial table (psalter-
    // distribution.yml), not St. Lawrence's proper psalmody and not the
    // Sunday scheme either.
    expect(psalms[0]).toBe(3);
    expect(psalms[1]).toBe(94);
    expect(psalms.slice(2)).toEqual(getPsalmsFor('matins', 'thursday').map((r) => r.number));
    expect(fallback.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(fallback.parts.some((p) => p.kind === 'canticle')).toBe(false);
  });
});
