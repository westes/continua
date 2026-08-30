import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

const MONDAY = '2026-06-15';
const SUNDAY = '2026-06-14';

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

  it('substitutes the short Kyrie/Pater litany for the fuller Preces on a Double-or-higher, rather than omitting it entirely', () => {
    // 2026-08-15, the Assumption (Duplex I. classis), keeps her own
    // evening outright. Real practice (both Monastic and secular tracks)
    // drops Compline's Preces to nothing on a Double -- vu deliberately
    // substitutes the plain short litany instead, so a short litany +
    // Our Father is always said. See hours/compline.ts's 'preces' case
    // and data/hours/compline.yml's own header.
    const ordo = resolveOrdo('compline', '2026-08-15');
    const preces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(preces).toBeDefined();
    const la = preces && preces.kind === 'preces' ? preces.text.text.la : undefined;
    expect(la).toContain('Pater noster');
    expect(la).toContain('Dómine, exáudi oratiónem meam');
    expect(la).not.toContain('Benedíctus es, Dómine');
    expect(la).not.toContain('Miserére nostri');
  });

  it('closes with the Salve Regina (the per-annum default Marian antiphon), labeled by name', () => {
    const ordo = resolveOrdo('compline', MONDAY);
    const last = ordo.parts[ordo.parts.length - 1];
    expect(last?.kind).toBe('preces');
    expect(last?.kind === 'preces' ? last.label : undefined).toBe('Salve Regina');
    expect(last?.kind === 'preces' ? last.text.text.en : undefined).toContain('Hail holy Queen');
  });

  it('anticipates Advent I: the Saturday evening before switches to the Alma Redemptoris Mater and shows the anticipated day label', () => {
    // Nov 30, 2025 is Advent I Sunday -- also St. Andrew's own day
    // (Duplex II. classis), correctly commemorated alongside it since the
    // November sanctoral pull (see tests/calendar/day-label.test.ts). This
    // evening also anticipates Advent I from Nov 29, itself the Vigil of
    // St. Andrew -- but the Vigil isn't also shown alongside his own
    // feast (calendar/vespers.ts's own isVigilOfTomorrow check, keyed off
    // each Vigil's explicit `vigilOf` field): showing both would just be
    // redundant, the same feast named twice.
    const eve = resolveOrdo('compline', '2025-11-29');
    const last = eve.parts[eve.parts.length - 1];
    expect(last?.kind === 'preces' ? last.label : undefined).toBe('Alma Redemptoris Mater');
    expect(eve.dayLabel?.en).toBe('The 1st Sunday of Advent (Semiduplex) — St. Andrew, Apostle');

    const dayBefore = resolveOrdo('compline', '2025-11-28');
    const lastBefore = dayBefore.parts[dayBefore.parts.length - 1];
    expect(lastBefore?.kind === 'preces' ? lastBefore.label : undefined).toBe('Salve Regina');
  });

  it('switches to the Ave Regina Caelorum from Candlemas through the day before Maundy Thursday', () => {
    const marianLabel = (date: string) => {
      const ordo = resolveOrdo('compline', date);
      const last = ordo.parts[ordo.parts.length - 1];
      return last?.kind === 'preces' ? last.label : undefined;
    };
    // Easter 2026 is Apr 5, so Maundy Thursday is Apr 2.
    expect(marianLabel('2026-01-31')).toBe('Salve Regina'); // well before Candlemas
    // Candlemas (Feb 2) has First Vespers — Compline on Feb 1 evening
    // already anticipates it, same as Advent I and Easter do (see
    // calendar/vespers.ts).
    expect(marianLabel('2026-02-01')).toBe('Ave Regina Caelorum'); // eve of Candlemas, anticipated
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

describe('resolveOrdo("compline", ...) responsory Gloria omission', () => {
  // Passiontide (Passion Sunday through Holy Saturday) is a wider window
  // than the psalm/canticle Gloria's own Triduum-only rule, and doesn't
  // apply on a Sancti feast's own day even within that window --
  // live-verified: 2027-03-19 is St. Joseph (Duplex I), landing inside
  // Passiontide that year, keeping "In manus tuas"'s Gloria; 2027-03-15
  // is a plain ferial in the same window, and omits it.
  const FERIAL_PASSIONTIDE = '2027-03-15';
  const FEAST_IN_PASSIONTIDE = '2027-03-19'; // St. Joseph, Duplex I.
  const ORDINARY_DATE = '2026-08-20';

  it('omits the Gloria on a ferial Passiontide day', () => {
    const ordo = resolveOrdo('compline', FERIAL_PASSIONTIDE);
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).not.toContain('Glória Patri');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.en : undefined).not.toContain(
      'Glory be to the Father',
    );
    // Everything else about the responsory is untouched.
    expect(responsory?.kind === 'responsory' ? responsory.text.text.en : undefined).toContain('Into thy hands, O Lord');
  });

  it("keeps the Gloria on a Sancti feast's own day, even inside Passiontide", () => {
    const ordo = resolveOrdo('compline', FEAST_IN_PASSIONTIDE);
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Glória Patri');
  });

  it('keeps the Gloria on an ordinary date outside Passiontide', () => {
    const ordo = resolveOrdo('compline', ORDINARY_DATE);
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Glória Patri');
  });
});
