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
    const ordo = resolveOrdo('lauds', '2026-10-24'); // a clean, otherwise-empty Marian Saturday
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([66, 92, 99, 62, 148, 149, 150]);

    const ps92 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 92);
    expect(ps92?.kind === 'psalm' ? ps92.antiphon?.text.la : undefined).toContain('Dum esset Rex');

    const benedictus = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(benedictus?.kind === 'canticle' ? benedictus.antiphon?.text.la : undefined).toContain('Beáta Dei Génitrix');

    const collect = ordo.parts.find((p) => p.kind === 'prayer');
    expect(collect?.kind === 'prayer' ? collect.text.text.en : undefined).toContain('glorious intercession of the Blessed Mary');
  });

  it("drops the Holy Cross and Blessed Virgin Mary suffrages on Our Lady's Saturday, keeping Apostles and Peace", () => {
    const ordo = resolveOrdo('lauds', '2026-10-24');
    const labels = ordo.parts.filter((p) => p.kind === 'preces' && p.label).map((p) => (p.kind === 'preces' ? p.label : undefined));
    expect(labels).toEqual(['Of the Holy Apostles Peter and Paul', 'For Peace', 'Salve Regina']);
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

    // Two extra collects: the commemorated Sunday's own, and the Simplex
    // saint already commemorated under that Sunday before Christ the King
    // displaced it too -- see tests/calendar/christ-the-king.test.ts.
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(3);

    const suffrages = ordo.parts.filter((p) => p.kind === 'preces' && p.label && p.label !== 'Salve Regina');
    expect(suffrages).toEqual([]);
  });
});
