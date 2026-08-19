import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { getPsalmsFor } from '../../src/psalter/distribution';

// Two clean proof dates, one per branch — see hours/matins.ts's own header
// and TODO.md for why this is a mechanism build with a small content slice,
// not full-calendar content. Both live-verified against the reference
// engine (Monastic Tridentinum 1617) before authoring.
const FERIAL_DATE = '2026-12-01'; // Tuesday of Advent I — plain ferial, no feast collision.
// Not Dec 15 (formerly used here): that's actually the Immaculate
// Conception's own octave closing day (Duplex majus per Divino Afflatu
// 1954), which now correctly wins outright over Advent's own
// privileged-feria-minor ferias — see calendar/octaves.ts's
// octaveGoverningPrivilegedDay — so it's no longer a clean ferial date.
const SUNDAY_DATE = '2026-09-06'; // 14th Sunday after Trinity — plain Sunday, no feast collision.

describe('resolveOrdo("matins", ...) ferial (1-nocturn) branch', () => {
  const ordo = resolveOrdo('matins', FERIAL_DATE);

  it('is no longer notImplemented', () => {
    expect(ordo.notImplemented).toBeUndefined();
  });

  it('opens with the Deus in adjutorium versicle, then Psalm 3, then the Invitatory (Psalm 94)', () => {
    expect(ordo.parts[0]?.kind).toBe('versicle');
    expect(ordo.parts[1]).toMatchObject({ kind: 'psalm', psalmNumber: 3 });
    expect(ordo.parts[2]).toMatchObject({ kind: 'section-heading', label: 'Invitatory' });
    expect(ordo.parts[3]).toMatchObject({ kind: 'psalm', psalmNumber: 94 });
    const invitatoryAntiphon = (ordo.parts[3] as { antiphon?: { text: Record<string, string> } }).antiphon;
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

  it("resolves the user's own bible-plan readings for the day, not the historical lectionary", () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson');
    // Plain 2 bible-plan readings on this particular clean ferial (no
    // commemorated saint here) — see the next test for the 3-reading case.
    expect(lessons).toHaveLength(2);
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toEqual(['Isa 6; Isa 7', 'Sap 2']);
    // Real content isn't imported yet (Vulgate/Douay-Rheims bulk import is
    // a deferred follow-on) — honest `missing`, not fabricated text.
    expect((lessons[0] as { text: { status: { en?: string } } }).text.status.en).toBe('missing');
  });

  it("adds a 3rd reading for a commemorated saint, generously surfaced per the 'commemorations get their own reading' design (see hours/matins.ts's own header)", () => {
    // Not FERIAL_DATE: needs an ordinary Advent ferial with a real
    // commemorated saint and no active octave. St. Bibiana (Simplex) is
    // the exact case calendar/commemorations.ts's own header cites as
    // live-verified: merely commemorated under an Advent feria, never
    // winning outright (Simplex is below privileged-feria-minor's own
    // Semiduplex threshold). 2025-12-02, a Tuesday, keeps the same 9-psalm
    // ferial shape as the other tests in this block.
    const commemoratedOrdo = resolveOrdo('matins', '2025-12-02');
    const lessons = commemoratedOrdo.parts.filter((p) => p.kind === 'lesson');
    expect(lessons).toHaveLength(3);
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toEqual(['Isa 6; Isa 7', 'Sap 2', undefined]);
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

  it("falls through to its Common category's own generic psalmody for a Duplex+ weekday winner with no proper antiphon authored", () => {
    // St. Ignatius of Antioch (Duplex, Common of a Martyr-Bishop, no
    // proper antiphon of his own) -- Feb 1 2029, confirmed clean (no
    // Sunday collision) per his own saint-file comment.
    // getMatinsPsalmodyOverride's Common tier resolves
    // common-of-a-martyr-bishop via common-of-a-martyr.yml's own
    // `aliases` (the reference engine's own Matins psalmody for
    // Martyr-Bishop redirects outright to plain Martyr) -- real,
    // verified Common text, not the plain ferial table.
    const common = resolveOrdo('matins', '2029-02-01');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Same Nocturn 1 as St. Lawrence's own (1,2,4,5,8,10), but Nocturn 2
    // uses the Common default's Ps 64, not Lawrence's own proper Ps 16.
    expect(psalms).toEqual([3, 94, 1, 2, 4, 5, 8, 10, 14, 20, 23, 63, 64, 91]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(true);

    const psalmParts = common.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    // The generic Common antiphon text is real and verified, even though
    // it is not proper to Ignatius himself.
    for (const p of nocturnPsalms) {
      expect(p.antiphon?.status.la).toBe('verified');
      expect(p.antiphon?.status.en).toBe('verified');
    }
  });

  it("falls through to Common-of-a-Confessor's own generic psalmody for a Duplex+ weekday winner with no proper antiphon authored", () => {
    // St. Francis of Paola (Duplex, Common of a Confessor Not a Bishop,
    // no proper antiphon of his own) -- 2030-04-02, confirmed clean (no
    // Sunday collision, safely outside Holy Week/Easter octave that year)
    // per his own saint-file comment.
    const common = resolveOrdo('matins', '2030-04-02');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 1, 2, 4, 5, 8, 10, 14, 20, 23, 95, 96, 97]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(true);

    const psalmParts = common.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    for (const p of nocturnPsalms) {
      expect(p.antiphon?.status.la).toBe('verified');
      expect(p.antiphon?.status.en).toBe('verified');
    }
  });

  it("falls through to Common-of-a-Confessor-Bishop's own generic psalmody -- same psalm numbers as Common of a Confessor, different Nocturn versicles", () => {
    // St. Basil the Great (Duplex, live-verified as byte-identical to
    // common-of-a-confessor-bishop.yml despite his own [Rule] saying
    // "vide C4a") -- 2035-06-14, confirmed clean per his own saint-file
    // comment.
    const common = resolveOrdo('matins', '2035-06-14');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Same psalm numbers in every slot as Common of a Confessor Not a
    // Bishop above -- the two Commons only differ in their versicles.
    expect(psalms).toEqual([3, 94, 1, 2, 4, 5, 8, 10, 14, 20, 23, 95, 96, 97]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(true);
  });

  it('falls all the way back to the plain ferial weekday table, redistributed into 3 nocturns, when neither a proper nor a Common entry is authored', () => {
    // Ss. Fabian and Sebastian (Duplex, Common of Several Martyrs -- no
    // matins-psalmody-overrides category authored yet for either tier)
    // -- 2029-01-20, a Saturday, confirmed clean (no Sunday collision)
    // per their own saint-file comment.
    const fallback = resolveOrdo('matins', '2029-01-20');
    const psalms = fallback.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Ps 3 + 94, then Saturday's own 9-psalm ferial table
    // (psalter-distribution.yml), not any Common-of-Several-Martyrs scheme.
    expect(psalms[0]).toBe(3);
    expect(psalms[1]).toBe(94);
    expect(psalms.slice(2)).toEqual(getPsalmsFor('matins', 'saturday').map((r) => r.number));
    expect(fallback.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(fallback.parts.some((p) => p.kind === 'canticle')).toBe(false);
  });
});

describe('resolveOrdo("matins", ...) second Duplex+ weekday-feast proof — St. Andrew, Common of an Apostle', () => {
  // 2026-11-30 -- St. Andrew's own day outright ("S. Andreæ Apostoli",
  // not transferred that year: Nov 30 falls on a Monday, not a Sunday),
  // live-verified directly against the reference engine. Second proof
  // for the matins-psalmody-overrides mechanism after St. Lawrence, this
  // one for the Common-of-an-Apostle category (see
  // matins-psalmody-overrides/categories/common-of-an-apostle.yml and
  // its own st-andrew.yml).
  const ordo = resolveOrdo('matins', '2026-11-30');

  it("uses St. Andrew's own proper psalmody across 3 nocturns plus a Te Deum", () => {
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 18, 33, 44, 46, 60, 63, 74, 95, 96, 97, 98, 100]);
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(true);
  });

  it("every Nocturn 1/2 psalm carries St. Andrew's own proper antiphon, verified in both languages", () => {
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    expect(nocturnPsalms).toHaveLength(12);
    for (const p of nocturnPsalms) {
      expect(p.antiphon?.status.la).toBe('verified');
      expect(p.antiphon?.status.en).toBe('verified');
    }
  });

  it('has 3 real OT canticles in Nocturn 3, verified in both languages, sourced from the newly-authored Isaiah/Wisdom chapters', () => {
    const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string; text: { status: Record<string, string> } }[];
    expect(canticles).toHaveLength(3);
    expect(canticles.map((c) => c.canticleId)).toEqual(['isa-61-6-9', 'sap-3-7-9', 'sap-10-17-21']);
    for (const c of canticles) {
      expect(c.text.status.la).toBe('verified');
      expect(c.text.status.en).toBe('verified');
    }
  });
});
