import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// 2026-11-16 is a Monday, and (as of the pre-1955 sanctoral pull reaching
// October, with November/December still unpulled) still ordinary/ferial —
// the Monastic 1617 distribution gives Monday three whole psalms (1, 2,
// 6), the first of which (Psalm 1) has real sample content in
// data/psalms/001.yml, so these tests can check real verse data without
// needing every psalm authored. Already had to move twice (first from a
// June Monday, then from an October Monday that got real sanctoral
// content — Ss. Placid and Companions, see
// data/calendar/saints/ss-placid-and-companions.yml) — if November's own
// pull lands here too, it'll need to move again.
const MONDAY = '2026-11-16';
const SUNDAY = '2026-08-09';

describe('resolveOrdo("prime", ...)', () => {
  it('is implemented and resolves psalms from the weekday-variable slot', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    expect(ordo.notImplemented).toBeUndefined();
    expect(ordo.hourId).toBe('prime');

    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm');
    expect(psalmParts.map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined))).toEqual([1, 2, 6]);
  });

  it('resolves fixed parts (hymn, chapter, prayer) from the common propers store', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn).toBeDefined();
    if (hymn && hymn.kind === 'hymn') {
      // hymn-iam-lucis-orto-sidere is real, verified content.
      expect(hymn.text.status.en).toBe('verified');
    }
  });

  it('surfaces verified/draft/missing status per language, per verse', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const psalm = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 1);
    expect(psalm && psalm.kind === 'psalm' ? psalm.verses.length : 0).toBe(3);
    if (psalm && psalm.kind === 'psalm') {
      expect(psalm.verses[0]?.status.en).toBe('draft');
      expect(psalm.verses[2]?.status.en).toBe('missing');
    }
  });

  it('slices a verse range out of a longer psalm on days that split one across the week', () => {
    // Tuesday: 7, 8, 9(2-19).
    const ordo = resolveOrdo('prime', '2026-08-11');
    const ps9 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 9);
    expect(ps9 && ps9.kind === 'psalm' ? ps9.verses.every((v) => v.n >= 2 && v.n <= 19) : false).toBe(true);
  });

  it('reads the Martyrology entry for the day *after* the ordo date, headed "Martyrology"', () => {
    const ordo = resolveOrdo('prime', '2026-08-25');
    const martyrology = ordo.parts.find((p) => p.kind === 'lesson' && p.label === 'Martyrology');
    expect(martyrology).toBeDefined();
    // 08-26's real content (not 08-25's), proving the date offset still works.
    expect(martyrology && martyrology.kind === 'lesson' ? martyrology.text.text.la : undefined).toContain(
      'Zephyríni',
    );
  });

  it("prepends the Luna (day of the moon) heading to the Martyrology reading", () => {
    const ordo = resolveOrdo('prime', '2026-08-25');
    const martyrology = ordo.parts.find((p) => p.kind === 'lesson' && p.label === 'Martyrology');
    // Verified against the real engine: 2026-08-26 is Luna 13.
    expect(martyrology && martyrology.kind === 'lesson' ? martyrology.text.text.la : undefined).toContain(
      'Luna tértia décima',
    );
    expect(martyrology && martyrology.kind === 'lesson' ? martyrology.text.text.en : undefined).toContain(
      '13th day of the Moon',
    );
  });

  it('resolves a Regula reading for the day, via the canonical-date table', () => {
    const ordo = resolveOrdo('prime', '2026-08-25');
    // 08-25 maps to canonical 04-25 (Rule ch. 67) in data/regula/table.yml.
    const rule = ordo.parts.find((p) => p.kind === 'lesson' && p.label?.includes('67'));
    expect(rule).toBeDefined();
  });

  it('includes the commemoration of the dead as the final parts', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const last = ordo.parts[ordo.parts.length - 1];
    expect(last?.kind).toBe('preces');
  });

  it('uses the ferial capitulum and Preces on a plain weekday', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.text.en : undefined).toBe(
      'Love ye truth and peace, said the Almighty Lord.',
    );
    const preces = ordo.parts.filter((p) => p.kind === 'preces');
    const ferialPreces = preces.find((p) => p.kind === 'preces' && p.text.text.la?.startsWith('V. Éripe me'));
    expect(ferialPreces).toBeDefined();
  });

  it('uses the Sunday capitulum and Preces on a Sunday', () => {
    const ordo = resolveOrdo('prime', SUNDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.text.en : undefined).toBe(
      'Now to the king of ages, immortal, invisible, the only God, be honour and glory for ever and ever. Amen.',
    );
    const preces = ordo.parts.filter((p) => p.kind === 'preces');
    const dominicalPreces = preces.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Confíteor Deo'));
    expect(dominicalPreces).toBeDefined();
  });

  it('gives the capitulum its scripture citation', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Zach. 8:19');
  });

  it('includes the Athanasian Creed on a Sunday but not a ferial day, and closes with the antiphon after it', () => {
    const sunday = resolveOrdo('prime', SUNDAY);
    const creedIndex = sunday.parts.findIndex((p) => p.kind === 'lesson' && p.label === 'Athanasian Creed');
    const antiphonIndex = sunday.parts.findIndex((p) => p.kind === 'antiphon');
    expect(creedIndex).toBeGreaterThanOrEqual(0);
    expect(antiphonIndex).toBeGreaterThan(creedIndex);

    const monday = resolveOrdo('prime', MONDAY);
    expect(monday.parts.some((p) => p.kind === 'lesson' && p.label === 'Athanasian Creed')).toBe(false);
  });

  it('leaves most Preces/connective parts unlabeled, but names Conclusion and the dead commemoration', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const actualPreces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(actualPreces && actualPreces.kind === 'preces' ? actualPreces.label : 'should be undefined').toBeUndefined();

    const regulaBlessing = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Jube, domne'));
    expect(regulaBlessing && regulaBlessing.kind === 'preces' ? regulaBlessing.label : 'should be undefined').toBeUndefined();

    const conclusion = ordo.parts.find((p) => p.kind === 'preces' && p.label === 'Conclusion');
    expect(conclusion).toBeDefined();
    const deadCommemoration = ordo.parts.find((p) => p.kind === 'preces' && p.label === 'Commemoration of the Dead');
    expect(deadCommemoration).toBeDefined();
  });

  it('gives the generic reading after the Regula the label "Short Reading"', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const shortReading = ordo.parts.find((p) => p.kind === 'lesson' && p.label === 'Short Reading');
    expect(shortReading).toBeDefined();
  });

  it('opens the weekday psalm group with just the antiphon incipit (below Double rank)', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm');
    expect(psalms[0]?.kind === 'psalm' ? psalms[0].antiphon?.text.en : undefined).toBe(
      'Ant. Serve ye the Lord with fear:',
    );
    expect(psalms[1]?.kind === 'psalm' ? psalms[1].antiphon : 'missing-case').toBeUndefined();
  });

  it('closes with the full antiphon as its own part, after the psalms and the Creed', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const psalmIndex = ordo.parts.findIndex((p) => p.kind === 'psalm');
    const lastPsalmIndex = ordo.parts.map((p) => p.kind).lastIndexOf('psalm');
    const antiphonIndex = ordo.parts.findIndex((p) => p.kind === 'antiphon');
    expect(antiphonIndex).toBeGreaterThan(lastPsalmIndex);
    expect(psalmIndex).toBeGreaterThanOrEqual(0);

    const antiphon = ordo.parts.find((p) => p.kind === 'antiphon');
    // "Ant." prefix (inline, like V./R.) and the "*" chant mark are both
    // kept in the full form — see hours/antiphon.ts.
    expect(antiphon && antiphon.kind === 'antiphon' ? antiphon.text.text.en : undefined).toBe(
      'Ant. Serve ye the Lord with fear: * and rejoice unto him with trembling.',
    );
  });

  it('gives the responsory the full short-responsory shape (R.br, full repeat, verse, response, Gloria, full repeat)', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    const lines = responsory && responsory.kind === 'responsory' ? responsory.text.text.en?.trim().split('\n') ?? [] : [];
    expect(lines).toEqual([
      'R.br. Christ, Son of the living God, * have mercy on us.',
      'R. Christ, Son of the living God, * have mercy on us.',
      'V. Thou, who sittest at the right hand of the Father.',
      'R. Have mercy on us.',
      'V. Glory be to the Father, and to the Son, * and to the Holy Ghost.',
      'R. Christ, Son of the living God, * have mercy on us.',
    ]);
  });

  it("appends the hymn's (currently per-annum, since season isn't real yet) doxology stanza", () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn && hymn.kind === 'hymn' ? hymn.text.text.en : undefined).toContain(
      'All laud to God the Father be',
    );
  });
});

describe('resolveOrdo for not-yet-built hours', () => {
  it('flags lauds as not implemented rather than throwing', () => {
    const ordo = resolveOrdo('lauds', MONDAY);
    expect(ordo.notImplemented).toBe(true);
    expect(ordo.parts).toEqual([]);
  });
});
