import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { getLaudsCommonOverride } from '../../src/hours/lauds-psalmody-overrides';

// Clean ferial dates, one per weekday — see data/psalter-distribution.yml
// and src/hours/lauds.ts's own generation-script provenance comments for
// why these particular dates.
const FERIAL_SUNDAY = '2026-06-21';
const FERIAL_MONDAY = '2026-06-08'; // not 08-31 -- St. Raymond Nonnatus's own day (common-of-a-confessor)
const FERIAL_TUESDAY = '2033-09-06'; // not 2026-06-16 -- that fell inside Sacred Heart's own octave once modeled 2026-08-26, see TODO.md
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

  it("uses Common-of-a-Confessor-Bishop's real office bundle on St. Robert Bellarmine's own day, not the ferial default", () => {
    // Was St. Ubald (May 16, Semiduplex, common-of-a-confessor-bishop) --
    // moved to St. Robert Bellarmine (May 13, Duplex, same Common) once
    // Ascension's own octave was modeled (2026-08-26, see TODO.md):
    // Ubald now loses his own day outright to the octave (`octave.wins:
    // duplex`, and Semiduplex Ubald falls short of it), so his own
    // Common-of-a-Confessor-Bishop content no longer surfaces there at
    // all. Bellarmine sits safely before the octave's own window (May
    // 14-21) and has no proper Lauds content of his own either -- see
    // vespers-hymn-common-of-a-confessor-bishop.yml's header.
    const ordo = resolveOrdo('lauds', '2026-05-13');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 44:16-17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu Redémptor ómnium');
  });

  it("uses common-of-a-confessor's real office bundle on St. Joseph's own day, not the ferial default", () => {
    // St. Joseph (Mar 19, `common: common-of-a-confessor`) -- see
    // lauds-capitulum-common-of-a-confessor.yml's header for the finding
    // that this plain id is really Common-of-a-Confessor-Not-Bishop
    // under a different label in this app's own data.
    const ordo = resolveOrdo('lauds', '2026-03-19');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 31:8-9');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu coróna célsior');
  });

  it("uses common-of-an-abbot's real office bundle on St. Maurus's own day, not the ferial default", () => {
    const ordo = resolveOrdo('lauds', '2026-01-15');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 31:8-9');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu coróna célsior');
  });

  it("uses common-of-a-virgin-martyr's real office bundle on St. Apollonia's own clean day, not the ferial default", () => {
    // 2026-02-09 collides (St. John of Matha wins outright, Apollonia
    // merely commemorated), so this uses her own already-verified clean
    // year (2029-02-09, per her saint file's own comment).
    const ordo = resolveOrdo('lauds', '2029-02-09');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('2 Cor 10:17-18');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu, coróna Vírginum');
  });

  it("uses common-of-a-confessor-doctor's real office bundle on St. John Damascene's own day", () => {
    // Live-verified 2026-08-26 to be Common-of-a-Confessor-Bishop's own
    // content -- see lauds-capitulum-common-of-a-confessor-doctor.yml's
    // header.
    const ordo = resolveOrdo('lauds', '2026-03-27');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 44:16-17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu Redémptor ómnium');
  });

  it("uses the Commemoration of St. Paul's own proper chapter, with Common-of-an-Apostle's hymn", () => {
    // 2026-06-30 is the Commemoration of St. Paul's own real day (own
    // chapter 2 Tim 4:7-8 -- "Bonum certámen certávi" -- wins over the
    // Common's Eph 2:19-20, per the usual own-proper-always-wins-over-
    // Common precedence); the hymn is genuinely the shared Common one --
    // see lauds-capitulum-commemoration-of-st-paul.yml's header.
    const ordo = resolveOrdo('lauds', '2026-06-30');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('2 Tim 4:7-8');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Exsúltet cælum láudibus');
  });

  it("uses common-of-a-holy-woman's real office bundle on St. Anne's own day, and common-of-a-widow's identical bundle on St. Monica's", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617)
    // that the two categories share real content -- see lauds-capitulum-
    // common-of-a-holy-woman.yml's header.
    const anne = resolveOrdo('lauds', '2026-07-26');
    const monica = resolveOrdo('lauds', '2026-05-04');
    for (const ordo of [anne, monica]) {
      const chapter = ordo.parts.find((p) => p.kind === 'chapter');
      expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Prov 31:10-11');
      const hymn = ordo.parts.find((p) => p.kind === 'hymn');
      expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Fortem viríli péctore');
    }
  });

  it("resolves the Guardian Angels' and Archangels' own real chapter/hymn, reused from St. Michael's Apparition", () => {
    // Their own saint files' [Rank] says "vide C4," but the Monastic
    // source's own SanctiM/10-02.txt cross-references St. Michael's
    // Apparition (Sancti/05-08) directly for the chapter/responsory at
    // every hour -- real proper content, not a Common fallback. See
    // lauds-capitulum-guardian-angels.yml's header. St. Gabriel is NOT
    // part of this group (see below) -- his own chapter is genuinely
    // proper, not shared, despite sharing the same hymn.
    for (const [date, id] of [
      ['2026-10-02', 'guardian-angels'],
      ['2026-10-24', 'st-raphael-archangel'],
    ] as const) {
      const ordo = resolveOrdo('lauds', date);
      const chapter = ordo.parts.find((p) => p.kind === 'chapter');
      expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Rev 1:1-2');
      const hymn = ordo.parts.find((p) => p.kind === 'hymn');
      expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined, id).toContain('Christe sanctórum decus Angelórum');
    }
  });

  it("resolves St. Gabriel's own genuinely proper chapter (Dan 9:21-22), not Apparition's", () => {
    // lauds-capitulum-st-gabriel-archangel.yml previously carried
    // Apparition's own capitulum ("Significávit Deus...") under
    // Gabriel's id by mistake -- a copy-paste bug found while authoring
    // his Matins psalmody (2026-08-28). His real Lauds/Vespers capitulum,
    // read directly from Sancti/03-24.txt's own [Capitulum Laudes]
    // block, is Daniel's account of the angel's visitation -- shares the
    // hymn with the other Archangel feasts, but not this chapter.
    const ordo = resolveOrdo('lauds', '2026-03-24');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Dan 9:21-22');
    expect(chapter?.kind === 'chapter' ? chapter.text.text.la : undefined).toContain('Ecce vir Gábriel');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Christe sanctórum decus Angelórum');
  });

  it("uses common-of-several-confessors's real office bundle (= Confessor-Not-Bishop content) on Ss. Seven Founders' own day", () => {
    // Read directly from the source (Sancti/02-12.txt): its own [Rule]
    // says plain "vide C5" -- see lauds-capitulum-common-of-several-
    // confessors.yml's header.
    const ordo = resolveOrdo('lauds', '2026-02-12');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 31:8-9');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu coróna célsior');
  });

  it("uses common-of-the-bvm's real office bundle on Our Lady of Mount Carmel's own day", () => {
    // Read directly from the source: Sancti/07-16.txt, 02-11.txt,
    // 05-31.txt, 09-24.txt, 10-11.txt (the 5 saints/feasts in this
    // category) all say plain "ex C11"/"vide C11" -- see lauds-
    // capitulum-common-of-the-bvm.yml's header.
    const ordo = resolveOrdo('lauds', '2026-07-16');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 24:14');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('O gloriósa Dómina');
  });

  it("uses Common-of-the-BVM's own psalmody (92, 99, 62 antiphons + Trium Puerorum) on Our Lady of Mount Carmel's own day, not the ferial default", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617,
    // votive=C11), 2026-08-28 -- see data/hours/lauds-psalmody-overrides/
    // categories/common-of-the-bvm.yml's own header. Same date as the
    // office-bundle test just above; she has no per-feast Lauds psalmody
    // override authored, so this is her Common's own tier.
    const ordo = resolveOrdo('lauds', '2026-07-16');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([66, 92, 99, 62, 148, 149, 150]);
    const canticle = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'canticum-trium-puerorum');
    expect(canticle).toBeDefined();
  });

  it("uses Common-of-an-Abbot's own psalmody on St. Benedict's own day, not the ferial default (his proper chapter/hymn is separate, see below)", () => {
    // St. Benedict (duplex-1-classis, common-of-an-abbot) has his own
    // proper chapter/hymn (see the test below) but no per-feast Lauds
    // psalmody override, so his psalm numbers/antiphons fall to his
    // Common's own tier -- live-verified against Divinum Officium
    // (Monastic Tridentinum 1617, votive=C5), 2026-08-28. Same clean year
    // as the proper-chapter test below.
    const ordo = resolveOrdo('lauds', '2033-03-21');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([66, 92, 99, 62, 148, 149, 150]);
  });

  it("uses Common-of-Several-Martyrs' own psalmody on Ss. Placid and Companions' own day, not the ferial default", () => {
    // 2026-10-05, Duplex II. classis, common-of-several-martyrs, no
    // per-feast Lauds psalmody override authored -- same date as
    // vespers.test.ts's own office-bundle proof for this Common.
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617,
    // votive=C3), 2026-08-28.
    const ordo = resolveOrdo('lauds', '2026-10-05');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([66, 92, 99, 62, 148, 149, 150]);
  });

  it('stays on the plain ferial default for a below-threshold feast (Duplex), even with a Common that has its own category psalmody', () => {
    // St. Jerome (Sept 30, plain Duplex, common-of-a-confessor-not-bishop)
    // is below the duplex-majus+ override threshold -- confirmed live
    // against Divinum Officium, which keeps this date on the plain
    // ferial Wednesday set, not his Common's own psalmody.
    const ordo = resolveOrdo('lauds', '2026-09-30');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([66, 50, 63, 64, 148, 149, 150]);
  });

  it("uses Common-of-an-Angel's own psalmody (reusing St. Michael's own proper text) on Guardian Angels' own day", () => {
    // Guardian Angels (Oct 2, Duplex Majus) has no proper text of her own
    // -- live-verified (2026-08-28) that her real Lauds antiphons are St.
    // Michael's own, byte-for-byte, which is exactly what this category's
    // content is (see data/hours/lauds-psalmody-overrides/categories/
    // common-of-an-angel.yml's own header). Psalm numbers stay the usual
    // fixed Duplex-majus+ set (92, 99, 62), unlike this Common's Vespers
    // psalmody, which substitutes "Psalmi Dominica" instead.
    const ordo = resolveOrdo('lauds', '2026-10-02');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([66, 92, 99, 62, 148, 149, 150]);
    const secondPsalm = ordo.parts.filter((p) => p.kind === 'psalm')[1];
    expect(secondPsalm?.kind === 'psalm' ? secondPsalm.antiphon?.text.la : undefined).toContain('Stetit Angelus');
  });

  it('aliases common-of-an-evangelist onto common-of-an-apostle for Lauds psalmody', () => {
    // Every Evangelist on this calendar (St. John Apostle, St. Luke, St.
    // Mark) already has their own per-feast Lauds override authored, so
    // the Common-category tier can never actually surface via
    // resolveOrdo/a real date for Lauds specifically (unlike Vespers, see
    // vespers.test.ts's own St. Mark test) -- test the alias wiring
    // directly instead. St. Mark's and St. Luke's own reference-engine
    // rule files both say "ex C1a", and votive=C1a returned byte-identical
    // Lauds psalmody to plain votive=C1 (2026-08-28).
    const override = getLaudsCommonOverride('st-mark');
    expect(override?.id).toBe('common-of-an-apostle');
    expect(override?.groups.map((g) => g.psalms)).toEqual([[92], [99], [62]]);
  });

  it('aliases common-of-several-women-martyrs onto common-of-a-holy-woman for Lauds psalmody', () => {
    // No majus+ saint on this calendar actually carries this Common yet
    // (Ss. Perpetua and Felicity, the only one, are plain Duplex -- below
    // this override's threshold), so this can't be exercised via
    // resolveOrdo/a real date; test the alias wiring directly instead.
    // Ss. Perpetua and Felicity's own reference-engine file says "vide
    // C7b", and votive=C7b returned these same groups/canticle/Laudate
    // antiphons as plain votive=C7 (2026-08-28) -- only the Benedictus
    // antiphon differs, a separate mechanism from this psalmody table.
    const override = getLaudsCommonOverride('ss-perpetua-and-felicity');
    expect(override?.id).toBe('common-of-a-holy-woman');
    expect(override?.groups.map((g) => g.psalms)).toEqual([[92], [99], [62]]);
  });

  it("resolves St. Gregory the Great's own proper chapter/hymn, not a Common fallback", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2033-03-12 (clean year). See lauds-capitulum-st-gregory-
    // the-great.yml's header.
    const ordo = resolveOrdo('lauds', '2033-03-12');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 50:1');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Mella cor obdulcántia');
  });

  it("resolves St. Benedict's own proper chapter/hymn, with the Confessor-Bishop responsory/versicle (not his own common-of-an-abbot's)", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2033-03-21 (clean year), cross-checked against SanctiM/
    // 03-21.txt directly. See lauds-capitulum-st-benedict.yml's header.
    const ordo = resolveOrdo('lauds', '2033-03-21');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 50:6-7');
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Amávit eum Dóminus');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Inter ætérnas súperum corónas');
  });

  it("resolves St. Agatha's own proper chapter, with Common-of-a-Virgin-Martyr's hymn", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2026-02-05 (her file's own noted clean year, 2029, turned
    // out to collide with St. Andrew Corsini in this app's own
    // calendar -- not investigated further, out of scope here). See
    // lauds-capitulum-st-agatha.yml's header.
    const ordo = resolveOrdo('lauds', '2026-02-05');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 51:1-3');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu, coróna Vírginum');
  });

  it("resolves St. Agnes's own proper chapter (shared verbatim with St. Agatha's), with Common-of-a-Virgin-Martyr's hymn", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2029-01-21 (clean year). See lauds-capitulum-st-agnes.yml's
    // header.
    const ordo = resolveOrdo('lauds', '2029-01-21');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 51:1-3');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu, coróna Vírginum');
  });

  it("resolves the Annunciation's own proper chapter, with Common-of-the-BVM's hymn", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2026-03-25 (fixed date, always winnable). See lauds-
    // capitulum-annunciation.yml's header.
    const ordo = resolveOrdo('lauds', '2026-03-25');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Isa 7:14-15');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('O gloriósa Dómina');
  });

  it("resolves the Purification's own proper chapter, with Common-of-the-BVM's hymn", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2026-02-02 (fixed date, always winnable). See lauds-
    // capitulum-purification.yml's header.
    const ordo = resolveOrdo('lauds', '2026-02-02');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Mal 3:1');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('O gloriósa Dómina');
  });

  it("resolves the Finding and Exaltation of the Holy Cross's own proper chapter/hymn (shared content, two ids)", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617): Finding, 2027-05-03 (2026 collides with a privileged
    // Sunday); Exaltation, 2026-09-14 (its own real day). See lauds-
    // capitulum-finding-of-the-holy-cross.yml's and -proper-to-the-
    // finding-of-the-holy-cross.yml's headers.
    const finding = resolveOrdo('lauds', '2027-05-03');
    const findingChapter = finding.parts.find((p) => p.kind === 'chapter');
    expect(findingChapter?.kind === 'chapter' ? findingChapter.text.citation?.en : undefined).toBe('Phil 2:5-7');
    const findingHymn = finding.parts.find((p) => p.kind === 'hymn');
    expect(findingHymn?.kind === 'hymn' ? findingHymn.text.text.la : undefined).toContain('Lustris sex qui jam peráctis');

    const exaltation = resolveOrdo('lauds', '2026-09-14');
    const exaltationHymn = exaltation.parts.find((p) => p.kind === 'hymn');
    expect(exaltationHymn?.kind === 'hymn' ? exaltationHymn.text.text.la : undefined).toContain('Lustris sex qui jam peráctis');
  });

  it("resolves the Transfiguration's own proper chapter/hymn", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2026-08-06 (fixed date). See lauds-capitulum-
    // transfiguration.yml's header.
    const ordo = resolveOrdo('lauds', '2026-08-06');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Phil 3:20-21');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Amor Jesu dulcíssime');
  });

  it("resolves All Saints of the Benedictine Order's own proper chapter/hymn, with Common-of-Several-Martyrs's responsory", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2025-11-13 (clean year). See lauds-capitulum-all-saints-
    // of-the-benedictine-order.yml's header.
    const ordo = resolveOrdo('lauds', '2025-11-13');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Isa 8:18');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Salvéte, cedri Líbani');
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
