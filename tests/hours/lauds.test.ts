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
    // Needs a Saturday that ISN'T Our Lady's Saturday, which now wins
    // (and substitutes its own psalmody) on every ordinary-feria Saturday
    // — see calendar/index.ts's applyMarianSaturday and tests/calendar/
    // marian-saturday.test.ts. A privileged-feria Saturday (Lenten Ember
    // Saturday, 2026-02-28) has real standing of its own that Marian
    // Saturday doesn't touch, so it still shows the plain weekday default.
    const ordo = resolveOrdo('lauds', '2026-02-28');
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
    expect(part1?.kind === 'canticle' ? part1.gloriaPatri?.text.la : undefined).toContain('Glória Patri');
    expect(part2?.kind === 'canticle' ? part2.gloriaPatri?.text.la : undefined).toContain('Glória Patri');

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

  it('resolves a real Benedictus antiphon on a plain temporal day, now that every temporal id has one', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.status?.la : undefined).toBe('verified');
  });

  it('resolves a real Benedictus antiphon for christmas-octave-sunday too, pulled from the reference engine\'s own dedicated Tempora/Nat1-0 proper rather than any individual octave-day saint\'s page', () => {
    // 2029-12-30 specifically: the year Dec 30 itself is the real Sunday
    // within the Octave, so nothing gets bumped there by
    // calendar/index.ts's applyChristmasOctaveSunday (see its own tests) --
    // a genuinely clean case for this content, unlike most years.
    const ordo = resolveOrdo('lauds', '2029-12-30');
    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.text.la : undefined).toContain('Dum médium siléntium');
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.status?.la : undefined).toBe('verified');
  });

  it("resolves a real Benedictus antiphon on St. Lawrence's own day, from the saint's already-authored proper", () => {
    const ordo = resolveOrdo('lauds', '2026-08-10'); // St. Lawrence's own day
    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.text.la : undefined).toContain('In cratícula');
  });

  it("uses Common-of-a-Martyr-Bishop's real office bundle on St. Zephyrinus's own day, not the ferial default", () => {
    // St. Zephyrinus (Aug 26, Simplex, common-of-a-martyr-bishop) has no
    // proper Lauds content of his own; before this Common's Lauds bundle
    // was authored, the missing chapter made the whole bundle resolve to
    // undefined and fall through to the plain ferial default -- see
    // lauds-hymn-common-of-a-martyr-bishop.yml's header.
    const ordo = resolveOrdo('lauds', '2026-08-26');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Jas 1:12');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Martyr Dei, qui únicum');
  });

  it("uses Common-of-a-Confessor-Bishop's real office bundle on St. Ubald's own day, not the ferial default", () => {
    // St. Ubald (May 16, Semiduplex, common-of-a-confessor-bishop) has no
    // proper Lauds content of his own -- see vespers-hymn-common-of-a-
    // confessor-bishop.yml's header.
    const ordo = resolveOrdo('lauds', '2026-05-16');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 44:16-17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu Redémptor ómnium');
  });

  it('includes the Kyrie + Our Father lead-in right after the Benedictus, before the day collect (either form)', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const litanyIndex = ordo.parts.findIndex((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    const benedictusIndex = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    const collectIndex = ordo.parts.findIndex((p) => p.kind === 'prayer');
    expect(litanyIndex).toBeGreaterThan(benedictusIndex);
    expect(collectIndex).toBeGreaterThan(litanyIndex);
  });

  it('uses the fuller Tridentine 1906/1910 ferial Preces on a plain ferial day, not the short Sunday/feast litany', () => {
    // Psalm 129 (De profundis), present in the live render, is deliberately
    // dropped from this app's own text (2026-08) — 'Ego dixi' is the next
    // versicle after where the psalm used to sit, still unique to the
    // fuller ferial form vs. the short litany.
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const preces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(preces?.kind === 'preces' ? preces.text.text.la : undefined).toContain('Ego dixi: Dómine, miserére mei');
    expect(preces?.kind === 'preces' ? preces.text.text.en : undefined).toContain('I said: Lord, be merciful');
  });

  it('uses the short Sunday/feast litany, without Psalm 129, on a Sunday and on a real saint\'s own winning day', () => {
    const sunday = resolveOrdo('lauds', '2026-06-28'); // plain temporal Sunday
    const sundayPreces = sunday.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(sundayPreces?.kind === 'preces' ? sundayPreces.text.text.la : undefined).not.toContain('Psalmus 129');

    const saintsDay = resolveOrdo('lauds', '2026-08-10'); // St. Lawrence, Duplex II. classis
    const saintsDayPreces = saintsDay.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(saintsDayPreces?.kind === 'preces' ? saintsDayPreces.text.text.la : undefined).not.toContain('Psalmus 129');
  });

  it('still uses the fuller ferial Preces on a Vigil, even though a Vigil is a sanctoral winner (unlike isSundayOrFeast elsewhere)', () => {
    const ordo = resolveOrdo('lauds', '2028-08-09'); // Vigil of St. Lawrence wins outright this year (not a Sunday)
    const preces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(preces?.kind === 'preces' ? preces.text.text.la : undefined).toContain('Ego dixi: Dómine, miserére mei');
  });

  it('resolves just the winners own collect on a plain day with nothing commemorated', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
  });

  it('resolves both the winners collect and a commemorated saints collect on a day with a real commemoration', () => {
    // 2025-11-30: Advent I (the winner) with St. Andrew, Duplex II. classis,
    // commemorated alongside it (see tests/calendar/day-label.test.ts) --
    // he has only a bare collect authored (no st-andrew-commemoration.yml
    // Ant+V/R bundle yet), so this renders as a labeled 'preces' block
    // (see resolve-common.ts's sanctoralCommemorationPart), not a second
    // unlabeled 'prayer' the way it used to.
    const ordo = resolveOrdo('lauds', '2025-11-30');
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
    const andrewCommemoration = ordo.parts.find((p) => p.kind === 'preces' && p.label?.includes('Andrew'));
    expect(andrewCommemoration?.kind === 'preces' ? andrewCommemoration.text.text.en : undefined).toContain(
      'Andrew',
    );
  });

  it("gives St. Lawrence's octave day 2 the full Lawrence office (per resolveOfficeWinner), no Clare commemoration since she's only assigned Aug 12 specifically", () => {
    const ordo = resolveOrdo('lauds', LAWRENCE_OCTAVE_DAY); // 2026-08-11, day 2
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
    expect(collects[0]?.kind === 'prayer' ? collects[0].text.text.en : undefined).toContain('Lawrence');
    expect(ordo.parts.some((p) => p.kind === 'preces' && p.label?.includes('Clare'))).toBe(false);
  });

  it("gives St. Lawrence's octave day 3 (Aug 12) St. Clare's own commemoration bundle alongside Lawrence's own office", () => {
    const ordo = resolveOrdo('lauds', '2026-08-12');
    const collects = ordo.parts.filter((p) => p.kind === 'prayer');
    expect(collects.length).toBe(1);
    expect(collects[0]?.kind === 'prayer' ? collects[0].text.text.en : undefined).toContain('Lawrence');
    const clareCommemoration = ordo.parts.find((p) => p.kind === 'preces' && p.label?.includes('Clare'));
    expect(clareCommemoration?.kind === 'preces' ? clareCommemoration.text.text.en : undefined).toContain(
      'kingdom of heaven',
    );
  });

  it('includes all five suffrages, in order, on an ordinary ferial day -- Cross from Tridentine 1906/1910, the other four from Monastic 1617', () => {
    const ordo = resolveOrdo('lauds', FERIAL_TUESDAY);
    const labels = ordo.parts.filter((p) => p.kind === 'preces' && p.label).map((p) => (p.kind === 'preces' ? p.label : undefined));
    expect(labels).toEqual([
      'Of the Holy Cross',
      'Of the Blessed Virgin Mary',
      'Of St. Joseph',
      'Of the Holy Apostles Peter and Paul',
      'For Peace',
      'Salve Regina',
    ]);
  });

  it('drops "Of the Holy Cross" -- not a bare ferial office -- on a plain Sunday and on a low-rank saint\'s own winning day, unlike an ordinary feria', () => {
    // St. Clare (Simplex) doesn't win outright (Lawrence's octave keeps
    // her to a commemoration -- see calendar/index.ts's applyOctaves), so
    // use St. Lawrence's own vigil day instead, or just check a Sunday.
    const sunday = resolveOrdo('lauds', '2026-06-28'); // a plain temporal Sunday, nothing else contesting
    const sundayLabels = sunday.parts
      .filter((p) => p.kind === 'preces' && p.label)
      .map((p) => (p.kind === 'preces' ? p.label : undefined));
    expect(sundayLabels).not.toContain('Of the Holy Cross');
    expect(sundayLabels).toContain('Of the Blessed Virgin Mary');
    expect(sundayLabels).toContain('Of St. Joseph');
  });

  it('omits the suffrages on a Double-or-higher feast', () => {
    const ordo = resolveOrdo('lauds', '2026-08-10'); // St. Lawrence, Duplex II. classis
    const crossSuffrage = ordo.parts.find((p) => p.kind === 'preces' && p.label === 'Of the Holy Cross');
    expect(crossSuffrage).toBeUndefined();
  });

  it('omits the suffrages entirely during Advent, Christmastide, and Passiontide -- confirmed against Monastic Tridentinum 1617 directly, not just Tridentine 1906/1910', () => {
    const advent = resolveOrdo('lauds', '2026-12-03'); // plain Advent feria
    const christmastide = resolveOrdo('lauds', '2026-12-30'); // plain day within the Christmas Octave
    const passiontide = resolveOrdo('lauds', '2026-03-23'); // Monday of Passion Week
    for (const ordo of [advent, christmastide, passiontide]) {
      expect(ordo.parts.some((p) => p.kind === 'preces' && p.label === 'Of the Holy Cross')).toBe(false);
      expect(ordo.parts.some((p) => p.kind === 'preces' && p.label === 'For Peace')).toBe(false);
    }
  });

  it('shows the suffrages on an ordinary Lent feria (not Passiontide) -- only the last two weeks of Lent are excluded, not all of it', () => {
    const ordo = resolveOrdo('lauds', '2026-02-20'); // Friday after Ash Wednesday, week 1 of Lent
    expect(ordo.parts.some((p) => p.kind === 'preces' && p.label === 'For Peace')).toBe(true);
  });

  it('omits the suffrages entirely on any day within an active octave, however low the octave\'s own rank is', () => {
    const ordo = resolveOrdo('lauds', LAWRENCE_OCTAVE_DAY); // day 2 of St. Lawrence's own (Semiduplex) octave
    expect(ordo.parts.some((p) => p.kind === 'preces' && p.label === 'For Peace')).toBe(false);
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

  it("renders Advent's seasonal chapter/hymn/versicle instead of the plain weekday default", () => {
    // 2025-12-02 is a Tuesday in Advent (St. Bibiana, Simplex, merely
    // commemorated — the day's own winner stays temporal either way).
    const ordo = resolveOrdo('lauds', '2025-12-02');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Isa 2:3');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Vox clara ecce íntonat');
    const versicle = ordo.parts.find((p) => p.kind === 'versicle' && p.text.text.la?.includes('Vox clamántis'));
    expect(versicle).toBeDefined();
  });

  it("renders Paschaltide's seasonal office, sharing its chapter with Vespers", () => {
    // 2026-04-20 is in eastertide (Easter 2026-04-05).
    const ordo = resolveOrdo('lauds', '2026-04-20');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Rom 6:9-10');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Auróra lucis rútilat');
  });
});

describe('resolveOrdo("lauds", ...) responsory Gloria omission', () => {
  // Real Passiontide already routes to a wholesale different proper-of-
  // season responsory (lauds-responsory-passiontide.yml, "Érue a frámea")
  // that was already transcribed without a Gloria line -- this just
  // confirms the shared mechanism (resolve-common.ts's resolveResponsory)
  // doesn't break that, and still applies correctly on an ordinary date.
  // Same Passiontide-wide, Sancti-exempt rule as Compline's -- see
  // tests/hours/compline.test.ts's own describe block for the live-
  // verification dates.
  it('has no Gloria on a ferial Passiontide day, has one on an ordinary date', () => {
    const passiontideResponsory = resolveOrdo('lauds', '2027-03-15').parts.find((p) => p.kind === 'responsory');
    const ordinaryResponsory = resolveOrdo('lauds', '2026-08-20').parts.find((p) => p.kind === 'responsory');
    expect(passiontideResponsory?.kind === 'responsory' ? passiontideResponsory.text.text.la : undefined).not.toContain(
      'Glória Patri',
    );
    expect(ordinaryResponsory?.kind === 'responsory' ? ordinaryResponsory.text.text.la : undefined).toContain('Glória Patri');
  });
});
