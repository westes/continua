import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

const MONDAY = '2026-08-10';
const SUNDAY = '2026-08-09';

describe('resolveOrdo("compline", ...)', () => {
  it('is implemented, with fixed psalms 4, 90, 133 regardless of weekday', () => {
    const monday = resolveOrdo('compline', MONDAY);
    const sunday = resolveOrdo('compline', SUNDAY);
    expect(monday.notImplemented).toBeUndefined();

    const psalmNumbers = (ordo: typeof monday) =>
      ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers(monday)).toEqual([4, 90, 133]);
    expect(psalmNumbers(sunday)).toEqual([4, 90, 133]);
  });

  it('gives the psalms no antiphon (real ferial Compline has none)', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm');
    for (const psalm of psalms) {
      expect(psalm.kind === 'psalm' ? psalm.antiphon : 'should be undefined').toBeUndefined();
    }
  });

  it('resolves the opening versicle and the pre-psalm Confiteor (before the psalms, unlike Prime)', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const firstPsalmIndex = ordo.parts.findIndex((p) => p.kind === 'psalm');
    const confiteorIndex = ordo.parts.findIndex(
      (p) => p.kind === 'preces' && p.text.text.la?.includes('Confíteor Deo'),
    );
    const openingIndex = ordo.parts.findIndex((p) => p.kind === 'versicle');
    expect(confiteorIndex).toBeGreaterThanOrEqual(0);
    expect(openingIndex).toBeGreaterThan(confiteorIndex);
    expect(firstPsalmIndex).toBeGreaterThan(openingIndex);
  });

  it("appends the hymn's own (per-annum) doxology, distinct from Prime's", () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn && hymn.kind === 'hymn' ? hymn.text.text.en : undefined).toContain(
      'O Father, that we ask be done',
    );
  });

  it('gives the capitulum its scripture citation (fixed, not Sunday/feria-split)', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Jer. 14:9');
  });

  it('resolves the Nunc Dimittis as a canticle with an opening antiphon, plus a full antiphon reprise', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const canticle = ordo.parts.find((p) => p.kind === 'canticle');
    expect(canticle && canticle.kind === 'canticle' ? canticle.canticleId : undefined).toBe('nunc-dimittis');
    expect(canticle && canticle.kind === 'canticle' ? canticle.text.text.en : undefined).toContain(
      'Now ✠ thou dost dismiss thy servant',
    );
    expect(canticle && canticle.kind === 'canticle' ? canticle.antiphon?.text.en : undefined).toBe(
      'Ant. Protect us.',
    );

    const canticleIndex = ordo.parts.indexOf(canticle!);
    const closingAntiphon = ordo.parts[canticleIndex + 1];
    expect(closingAntiphon?.kind).toBe('antiphon');
    // The "*" chant mark is preserved in the full (closing) form.
    expect(closingAntiphon?.kind === 'antiphon' ? closingAntiphon.text.text.en : undefined).toBe(
      'Ant. Protect us, * Lord, while we are awake and safeguard us while we sleep; that we may keep watch with Christ, and rest in peace.',
    );
  });

  it('includes the fuller Tridentine 1906 Preces (the triple "Blessed art thou" exchange Monastic drops)', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const preces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(preces && preces.kind === 'preces' ? preces.text.text.la : undefined).toContain('Benedíctus es, Dómine');
    expect(preces && preces.kind === 'preces' ? preces.text.text.la : undefined).toContain('Miserére nostri');
  });

  it('closes with the Salve Regina (the per-annum default Marian antiphon), labeled by name', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const last = ordo.parts[ordo.parts.length - 1];
    expect(last?.kind).toBe('preces');
    expect(last?.kind === 'preces' ? last.label : undefined).toBe('Salve Regina');
    expect(last?.kind === 'preces' ? last.text.text.en : undefined).toContain('Hail holy Queen');
  });

  it('switches to the Ave Regina Caelorum from Candlemas through the day before Maundy Thursday', () => {
    const marianLabel = (date: string) => {
      const ordo = resolveOrdo('compline', date);
      const last = ordo.parts[ordo.parts.length - 1];
      return last?.kind === 'preces' ? last.label : undefined;
    };
    // Easter 2026 is Apr 5, so Maundy Thursday is Apr 2.
    expect(marianLabel('2026-02-01')).toBe('Salve Regina'); // day before Candlemas
    expect(marianLabel('2026-02-02')).toBe('Ave Regina Caelorum'); // Candlemas itself
    expect(marianLabel('2026-03-10')).toBe('Ave Regina Caelorum'); // mid-Lent
    expect(marianLabel('2026-04-01')).toBe('Ave Regina Caelorum'); // eve of Maundy Thursday
    expect(marianLabel('2026-04-02')).not.toBe('Ave Regina Caelorum'); // Maundy Thursday itself
  });

  it('closes the Short Reading with "Deo gratias", via the shared lesson-close proper', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const shortReadingIndex = ordo.parts.findIndex((p) => p.kind === 'lesson' && p.label === 'Short Reading');
    const closing = ordo.parts[shortReadingIndex + 1];
    expect(closing?.kind).toBe('preces');
    expect(closing?.kind === 'preces' ? closing.text.text.en : undefined).toContain('Thanks be to God');
  });

  it('includes the "In manus tuas" responsory between the capitulum and the versicle', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const chapterIndex = ordo.parts.findIndex((p) => p.kind === 'chapter');
    const responsoryIndex = ordo.parts.findIndex((p) => p.kind === 'responsory');
    const versicleIndex = ordo.parts.findIndex((p) => p.kind === 'versicle' && p.text.text.la?.includes('Custódi nos'));
    expect(responsoryIndex).toBeGreaterThan(chapterIndex);
    expect(versicleIndex).toBeGreaterThan(responsoryIndex);
    const responsory = ordo.parts[responsoryIndex];
    expect(responsory?.kind === 'responsory' ? responsory.text.text.en : undefined).toContain(
      'Into thy hands, O Lord',
    );
  });
});
