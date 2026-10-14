import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

describe('Lauds psalmody override (duplex-majus+ sanctoral, and Marian Saturday)', () => {
  it("substitutes St. Lawrence's own proper psalmody on his own day (Duplex II. classis, above the threshold)", () => {
    const ordo = resolveOrdo('lauds', '2026-08-10');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([66, 92, 99, 62, 148, 149, 150]);

    const ps92 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 92);
    expect(ps92?.kind === 'psalm' ? ps92.antiphon?.text.en : undefined).toContain('Lawrence went in to be a martyr');

    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId !== 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.canticleId : undefined).toBe('canticum-trium-puerorum');
  });

  it("resolves St. Lawrence's own office bundle (capitulum/responsory/hymn/versicle) on his own day, not the plain weekday default -- a real gap flagged in TODO.md, now filled", () => {
    const ordo = resolveOrdo('lauds', '2026-08-10');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.la : undefined).toBe('2 Cor 9:6');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Martyr Dei');
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Glória et honóre');
  });

  it("resolves the same office bundle on day 3 of St. Lawrence's own octave, not the plain weekday default -- resolveOfficeWinner", () => {
    const ordo = resolveOrdo('lauds', '2026-08-12');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.la : undefined).toBe('2 Cor 9:6');
  });

  it("doesn't override a saint below duplex-majus (e.g. Semiduplex) -- plain weekday psalmody still used", () => {
    // 2026-09-19: St. Januarius, Semiduplex (below duplex-majus) -- see
    // tests/calendar/marian-saturday.test.ts for confirming he wins
    // outright as the day's winner despite it being a Saturday.
    const ordo = resolveOrdo('lauds', '2026-09-19');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    // Saturday's own plain default (Ps 50 + 142), not the Common-shaped
    // override -- no lauds-psalmody-overrides/st-januarius.yml exists.
    expect(psalmNumbers).toEqual([66, 50, 142, 148, 149, 150]);
  });

  it("substitutes Our Lady's Saturday own proper psalmody, unconditionally, whenever it wins", () => {
    // Not 2026-10-24: that date is now St. Raphael the Archangel's own
    // fixed day (Duplex majus, added per the full-year sanctoral
    // import), which wins outright. 2026-07-04 is a clean, otherwise-
    // empty Marian Saturday (see tests/calendar/marian-saturday.test.ts).
    const ordo = resolveOrdo('lauds', '2026-07-04');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    // Ferial Saturday's own psalm numbers (50, 142), not the Common-of-
    // BVM's proper set (92, 99, 62) -- corrected 2026-09-04, per direct
    // instruction to keep the plain ferial psalmody and only swap the
    // antiphons (see lauds-psalmody-overrides/marian-saturday.yml's own
    // header).
    expect(psalmNumbers).toEqual([66, 50, 142, 148, 149, 150]);

    const ps50 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 50);
    expect(ps50?.kind === 'psalm' ? ps50.antiphon?.text.la : undefined).toContain('Dum esset Rex');

    const benedictus = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(benedictus?.kind === 'canticle' ? benedictus.antiphon?.text.la : undefined).toContain('Beáta Dei Génitrix');

    const collect = ordo.parts.find((p) => p.kind === 'prayer');
    expect(collect?.kind === 'prayer' ? collect.text.text.en : undefined).toContain('glorious intercession of the Blessed Mary');
  });

  it("drops the Holy Cross and Blessed Virgin Mary suffrages on Our Lady's Saturday (the latter redundant with the day's already-Marian office; the former because Marian Saturday isn't a bare ferial office either), keeping Joseph, Apostles, and Peace", () => {
    const ordo = resolveOrdo('lauds', '2026-07-04');
    const labels = ordo.parts.filter((p) => p.kind === 'preces' && p.label).map((p) => (p.kind === 'preces' ? p.label : undefined));
    expect(labels).toEqual(['Commemoration of St. Joseph', 'Commemoration of the Holy Apostles Peter and Paul', 'For Peace', 'Salve Regina']);
  });

  it("substitutes Christ the King's own proper psalmody and office bundle, and omits the suffrages entirely (Duplex I. classis)", () => {
    const ordo = resolveOrdo('lauds', '2026-10-25');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([66, 92, 99, 62, 148, 149, 150]);

    const ps92 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 92);
    expect(ps92?.kind === 'psalm' ? ps92.antiphon?.text.en : undefined).toContain('The God of heaven');

    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Col 1:12-13');

    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Vexílla Christus ínclita');

    const benedictus = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(benedictus?.kind === 'canticle' ? benedictus.antiphon?.text.en : undefined).toContain(
      'He hath made us',
    );

    // The day's own single collect (Christ the King's) plus three labeled
    // 'preces' commemoration bundles: the commemorated Sunday's own (a
    // temporal commemoration, now the fuller Ant+V/R+collect bundle since
    // post-pentecost-22 has a real Benedictus antiphon authored -- see
    // resolve-common.ts's temporalCommemorationPart) and the Simplex saint
    // already commemorated under that Sunday before Christ the King
    // displaced it too, plus St. Boniface I (Simplex, 2026-10 Urbis date
    // Oct 25) -- see tests/calendar/christ-the-king.test.ts.
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
    const commemorations = ordo.parts.filter(
      (p) => p.kind === 'preces' && p.label?.startsWith('Commemoration of'),
    );
    expect(commemorations.length).toBe(3);

    const SUFFRAGE_LABELS = new Set([
      'Commemoration of the Holy Cross',
      'Commemoration of the Blessed Virgin Mary',
      'Commemoration of St. Joseph',
      'Commemoration of the Holy Apostles Peter and Paul',
      'For Peace',
    ]);
    const suffrages = ordo.parts.filter((p) => p.kind === 'preces' && p.label && SUFFRAGE_LABELS.has(p.label));
    expect(suffrages).toEqual([]);
  });
});
