import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Clean ferial dates, one per weekday — see data/psalter-distribution.yml
// and src/hours/lauds.ts's own generation-script provenance comments for
// why these particular dates.
const FERIAL_SUNDAY = '2026-06-21';
const FERIAL_MONDAY = '2026-08-31';
const FERIAL_TUESDAY = '2026-06-16';
const LAWRENCE_OCTAVE_DAY = '2026-08-11'; // Semiduplex -- exercises isDoubleOrHigher's false branch differently than a plain feria only in rank, not in psalms (Commune override not modeled, see below)

describe('resolveOrdo("lauds", ...)', () => {
  it('is implemented', () => {
    expect(resolveOrdo('lauds', FERIAL_TUESDAY).notImplemented).toBeUndefined();
  });

  it('opens with Ps 66 and gives it no antiphon at all, unlike every other psalm here', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm');
    expect(psalms[0]?.kind === 'psalm' ? psalms[0].psalmNumber : undefined).toBe(66);
    expect(psalms[0]?.kind === 'psalm' ? psalms[0].antiphon : 'should be undefined').toBeUndefined();
  });

  it("resolves Tuesday's weekday psalmody: Ps 50, 42, 56, the Canticle of Ezechias, then 148-150", () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([66, 50, 42, 56, 148, 149, 150]);

    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId !== 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.canticleId : undefined).toBe('canticum-ezechiae');
    expect(canticle?.kind === 'canticle' ? canticle.text.text.la : undefined).toContain('In dimídio diérum meórum');
  });

  it("gives each variable psalm group its own opening antiphon (incipit, below Double) and a full repeat right after", () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const ps50Index = ordo.parts.findIndex((p) => p.kind === 'psalm' && p.psalmNumber === 50);
    const ps50 = ordo.parts[ps50Index];
    expect(ps50?.kind === 'psalm' ? ps50.antiphon?.text.la : undefined).toBe('Ant. Dele, Dómine.');
    const repeat = ordo.parts[ps50Index + 1];
    expect(repeat?.kind).toBe('antiphon');
    expect(repeat?.kind === 'antiphon' ? repeat.text.text.la : undefined).toBe('Ant. Dele, Dómine, * iniquitátem meam.');
  });

  it("resolves Sunday's own psalmody: Ps 50+117 sharing one antiphon, then 62, then the Canticle of the Three Young Men", () => {
    const ordo = resolveOrdo('lauds', FERIAL_SUNDAY);
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([66, 50, 117, 62, 148, 149, 150]);

    const ps117 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 117);
    expect(ps117?.kind === 'psalm' ? ps117.antiphon : 'should be undefined -- shares Ps 50s opening antiphon').toBeUndefined();

    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId !== 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.canticleId : undefined).toBe('canticum-trium-puerorum');
  });

  it("resolves Saturday's own psalmody: only one weekday psalm (142), and the Canticle of Moses said in two pieces (RB 13's own division), one shared antiphon framing both", () => {
    // Any Saturday works here: lauds-psalmody doesn't yet model the
    // Commune/feast override real practice would apply on a Marian-
    // Sabbato Saturday (see hours/types.ts's 'lauds-psalmody' doc comment)
    // -- the plain weekday distribution is always used, so this is
    // exercising the real, current behavior, not a stand-in for it.
    const ordo = resolveOrdo('lauds', '2026-06-20');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([66, 50, 142, 148, 149, 150]);

    const canticles = ordo.parts.filter((p) => p.kind === 'canticle' && p.canticleId === 'canticum-moysis-deuteronomii');
    expect(canticles.length).toBe(2);
    const [part1, part2] = canticles;
    expect(part1?.kind === 'canticle' ? part1.antiphon?.text.la : undefined).toBe('Ant. Date magnitúdinem');
    expect(part2?.kind === 'canticle' ? part2.antiphon : 'should be undefined -- shares part 1s opening antiphon').toBeUndefined();
    expect(part1?.kind === 'canticle' ? part1.text.text.la : undefined).toContain('Audíte, cæli');
    expect(part2?.kind === 'canticle' ? part2.text.text.la : undefined).toContain('Ignis succénsus est');
    // Each part gets its own Gloria Patri.
    expect(part1?.kind === 'canticle' ? part1.text.text.la : undefined).toContain('Glória Patri');
    expect(part2?.kind === 'canticle' ? part2.text.text.la : undefined).toContain('Glória Patri');

    const repeatIndex = ordo.parts.indexOf(part2!) + 1;
    const repeat = ordo.parts[repeatIndex];
    expect(repeat?.kind).toBe('antiphon');
    expect(repeat?.kind === 'antiphon' ? repeat.text.text.la : undefined).toBe('Ant. Date magnitúdinem * Deo nostro.');
  });

  it('gives the Laudate psalms (148-150) one shared antiphon, opening before 148 and repeated in full after 150', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const ps148Index = ordo.parts.findIndex((p) => p.kind === 'psalm' && p.psalmNumber === 148);
    const ps149 = ordo.parts[ps148Index + 1];
    const ps150 = ordo.parts[ps148Index + 2];
    expect(ps149?.kind === 'psalm' ? ps149.antiphon : 'should be undefined').toBeUndefined();
    expect(ps150?.kind === 'psalm' ? ps150.antiphon : 'should be undefined').toBeUndefined();
    const repeat = ordo.parts[ps148Index + 3];
    expect(repeat?.kind).toBe('antiphon');
    expect(repeat?.kind === 'antiphon' ? repeat.text.text.en : undefined).toContain(
      'Praise ye the Lord * from the heavens, all His angels',
    );
  });

  it("resolves the weekday chapter/responsory/hymn/versicle bundle, sharing the same capitulum Mon-Fri", () => {
    const tue = resolveOrdo('lauds', FERIAL_TUESDAY);
    const mon = resolveOrdo('lauds', FERIAL_MONDAY);
    const tueChapter = tue.parts.find((p) => p.kind === 'chapter');
    const monChapter = mon.parts.find((p) => p.kind === 'chapter');
    expect(tueChapter?.kind === 'chapter' ? tueChapter.text.citation?.en : undefined).toBe('Rom 13:12-13');
    expect(tueChapter?.kind === 'chapter' ? tueChapter.text.text.la : undefined).toBe(
      monChapter?.kind === 'chapter' ? monChapter.text.text.la : undefined,
    );

    const responsory = tue.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Sana ánimam meam');

    const hymn = tue.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Ales diéi núntius');
  });

  it("uses the Marian Sabbato hymn as Saturday's own default (explicit choice, since a genuinely unprivileged Saturday isn't achievable)", () => {
    const ordo = resolveOrdo('lauds', '2026-06-20');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.status.la : undefined).toBe('verified');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('O gloriósa Dómina');
  });

  it('resolves the Benedictus as a canticle with an opening antiphon and a full repeat, same shape as Compline\'s Nunc Dimittis', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const canticleIndex = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    const canticle = ordo.parts[canticleIndex];
    expect(canticle?.kind === 'canticle' ? canticle.text.text.en : undefined).toContain('Blessed be the Lord');
    const repeat = ordo.parts[canticleIndex + 1];
    expect(repeat?.kind).toBe('antiphon');
  });

  it("falls back to a missing Benedictus antiphon on a plain temporal day (no per-Sunday antiphon authored yet)", () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.status?.la : undefined).toBeUndefined();
  });

  it("resolves a real Benedictus antiphon on St. Lawrence's own octave day, from the saint's already-authored proper", () => {
    const ordo = resolveOrdo('lauds', '2026-08-10'); // St. Lawrence's own day
    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.text.la : undefined).toContain('Levíta Lauréntius');
  });

  it('includes the short litany (Kyrie + Our Father) right after the Benedictus, before the day collect', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const litanyIndex = ordo.parts.findIndex((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    const benedictusIndex = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    const collectIndex = ordo.parts.findIndex((p) => p.kind === 'prayer');
    expect(litanyIndex).toBeGreaterThan(benedictusIndex);
    expect(collectIndex).toBeGreaterThan(litanyIndex);
  });

  it('resolves just the winners own collect on a plain day with nothing commemorated', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
  });

  it('resolves both the winners collect and a commemorated saints collect on a day with a real commemoration', () => {
    // 2025-11-30: Advent I (the winner) with St. Andrew, Duplex II. classis,
    // commemorated alongside it (see tests/calendar/day-label.test.ts) --
    // an octave commemoration (like LAWRENCE_OCTAVE_DAY's) never
    // contributes a collect (none authored yet), so this needs a real
    // sanctoral/temporal commemoration instead to exercise getDayCollects
    // pushing a second entry.
    const ordo = resolveOrdo('lauds', '2025-11-30');
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(2);
    expect(collects[1]?.kind === 'prayer' ? collects[1].text.text.en : undefined).toContain('Andrew');
  });

  it("skips a straight octave commemoration for collect purposes (no octave collect authored)", () => {
    const ordo = resolveOrdo('lauds', LAWRENCE_OCTAVE_DAY);
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
  });

  it('includes all four Tridentine suffrages, in order, on an ordinary day', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const labels = ordo.parts.filter((p) => p.kind === 'preces' && p.label).map((p) => (p.kind === 'preces' ? p.label : undefined));
    expect(labels).toEqual([
      'Of the Holy Cross',
      'Of the Blessed Virgin Mary',
      'Of the Holy Apostles Peter and Paul',
      'For Peace',
      'Salve Regina',
    ]);
  });

  it('omits the suffrages on a Double-or-higher feast', () => {
    const ordo = resolveOrdo('lauds', '2026-08-10'); // St. Lawrence, Duplex II. classis
    const crossSuffrage = ordo.parts.find((p) => p.kind === 'preces' && p.label === 'Of the Holy Cross');
    expect(crossSuffrage).toBeUndefined();
  });

  it('closes with the Conclusio, the closing versicle ("may the Lord grant us his peace... and life everlasting"), and the Marian antiphon -- without spelling out the silent Our Father', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const closingVersicle = ordo.parts.find(
      (p) => p.kind === 'versicle' && p.text.text.en?.includes('grant us his peace'),
    );
    expect(closingVersicle?.kind === 'versicle' ? closingVersicle.text.text.en : undefined).toContain(
      'life everlasting',
    );
    expect(closingVersicle?.kind === 'versicle' ? closingVersicle.text.text.en : undefined).not.toContain(
      'Our Father',
    );

    const last = ordo.parts[ordo.parts.length - 1];
    expect(last?.kind).toBe('preces');
    expect(last?.kind === 'preces' ? last.label : undefined).toBe('Salve Regina');
  });
});
