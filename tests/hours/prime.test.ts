import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { getPsalm } from '../../src/psalter';

// 2026-09-07 is a Monday, plain ferial (post-Pentecost 15's own week,
// no sanctoral entry, no commemoration) — the Monastic 1617 distribution
// gives Monday three whole psalms (1, 2, 6), all fully verified since the
// whole Psalter got bulk-pulled from Divinum Officium's own Psalmorum
// text (2026-08). Already had to move three times now (first from a June
// Monday, then an October Monday that got real sanctoral content — Ss.
// Placid and Companions — then 2026-11-16 itself, which the November
// sanctoral pull claimed for St. Gertrude) — pick with care if it needs
// to move again.
const MONDAY = '2026-10-12'; // was 2026-09-07 until St. Philumena (Sept 6, transferred off that Sunday) landed on it, 2026-10
const SUNDAY = '2026-08-09';
// A Sunday inside the Nativity of the BVM's octave (Sept 8-15, `wins:
// duplex`, this is day 6 of 8 — not the closing day). An ordinary Sunday
// keeps its own temporal office on a mid-octave day (see
// calendar/octaves.ts's octaveGoverningPrivilegedDay), so the office
// winner here isn't itself Double-or-higher — the Creed must still be
// suppressed by checking for the active octave directly.
const SUNDAY_IN_OCTAVE = '2026-09-13';

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

  it('surfaces verified status in both languages for the Invitatory psalm', () => {
    // Monday's Prime psalms (1, 2, 6) are all fully verified now (the
    // whole Psalter got bulk-pulled from Divinum Officium's own Psalmorum
    // text, 2026-08), so there's no draft/missing content left in this
    // ordo to exercise the fallback against — test the store directly
    // instead. Ps 94 (the Invitatory, used only at Matins) used to carry
    // a per-language split (Coverdale/BCP English, colon-pointed rather
    // than asterisk-pointed) but was reworded to the standard
    // Douay-Rheims translation, asterisk-pointed like every other psalm
    // (see 094.yml), so it's fully verified now too.
    const psalm = getPsalm(94);
    expect(psalm.verses[0]?.status.la).toBe('verified');
    expect(psalm.verses[0]?.status.en).toBe('verified');
  });

  it('surfaces missing status for a genuinely unauthored psalm number', () => {
    // 151 isn't a real Vulgate/Gallican psalm (that numbering tops out at
    // 150) — exercises getPsalm's pending-verse fallback now that every
    // real psalm 1-150 is authored.
    const psalm = getPsalm(151);
    expect(psalm.verses).toHaveLength(1);
    expect(psalm.verses[0]?.status.en).toBe('missing');
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
    const rule = ordo.parts.find(
      (p) => p.kind === 'lesson' && typeof p.label === 'string' && p.label.includes('67'),
    );
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

  it('uses the Sunday capitulum and the secular Preces (with Benedict kept in the Confiteor) on a Sunday', () => {
    const ordo = resolveOrdo('prime', SUNDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.text.en : undefined).toBe(
      'Now to the king of ages, immortal, invisible, the only God, be honour and glory for ever and ever. Amen.',
    );
    const preces = ordo.parts.filter((p) => p.kind === 'preces');
    const dominicalPreces = preces.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Confíteor Deo'));
    expect(dominicalPreces).toBeDefined();
    expect(
      dominicalPreces && dominicalPreces.kind === 'preces' ? dominicalPreces.text.text.la : undefined,
    ).toContain('beáto Patri nostro Benedícto');
    expect(
      dominicalPreces && dominicalPreces.kind === 'preces' ? dominicalPreces.text.text.la : undefined,
    ).toContain('Et ego ad te, Dómine, clamávi');
  });

  it('uses the ferial Preces and the ferial capitulum on a Vigil day', () => {
    // 2025-11-29: a real, unimpeded Vigil of St. Andrew — day.winner is
    // itself sanctoral/vigil (not merely commemorated), see
    // data/calendar/saints/vigil-of-st-andrew.yml's own header comment.
    const VIGIL = '2025-11-29';
    const ordo = resolveOrdo('prime', VIGIL);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    // Reference engine (specprima.pl capitulum_prima): a Vigil's winner Rank
    // names "Vigilia", which selects the ferial text.
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.text.la : undefined).toContain('Pacem et veritátem');
    const preces = ordo.parts.filter((p) => p.kind === 'preces');
    const ferialPreces = preces.find((p) => p.kind === 'preces' && p.text.text.la?.startsWith('V. Éripe me'));
    expect(ferialPreces).toBeDefined();
    const dominicalPreces = preces.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Confíteor Deo'));
    expect(dominicalPreces).toBeUndefined();
  });

  it('gives the capitulum its scripture citation', () => {
    const ordo = resolveOrdo('prime', MONDAY);
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter && chapter.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Zech. 8:19');
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

  it('omits the Athanasian Creed on a Sunday inside an active octave', () => {
    const ordo = resolveOrdo('prime', SUNDAY_IN_OCTAVE);
    expect(ordo.parts.some((p) => p.kind === 'lesson' && p.label === 'Athanasian Creed')).toBe(false);
  });

  it('omits the ferial/Sunday Preces on a Sunday inside an active octave', () => {
    // Same underlying bug as the Creed above: omitOnDouble only checked
    // resolveOfficeWinner's rank, which stays temporal (not Double-or-
    // higher) for an ordinary Sunday on a mid-octave day.
    const ordo = resolveOrdo('prime', SUNDAY_IN_OCTAVE);
    expect(ordo.parts.some((p) => p.kind === 'preces' && p.text.text.la?.includes('Credo in Deum'))).toBe(false);
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

  it("resolves St. Lawrence's own proper antiphon, on both his own day and his own octave -- previously always fell back to the plain weekday one with no override mechanism at all", () => {
    for (const date of ['2026-08-10', '2026-08-12']) {
      const ordo = resolveOrdo('prime', date);
      const antiphon = ordo.parts.find((p) => p.kind === 'psalm')?.antiphon;
      expect(antiphon?.text.la).toContain('Lauréntius');
      const closing = ordo.parts.find((p) => p.kind === 'antiphon');
      expect(closing?.kind === 'antiphon' ? closing.text.text.la : undefined).toContain('Lauréntius');
    }
  });

  it("still resolves the Sunday/feast capitulum (1 Tim 1:17) throughout St. Lawrence's own octave, matching his actual day, via isSundayOrFeastOffice", () => {
    for (const date of ['2026-08-10', '2026-08-12']) {
      const ordo = resolveOrdo('prime', date);
      const chapter = ordo.parts.find((p) => p.kind === 'chapter');
      expect(chapter?.kind === 'chapter' ? chapter.text.text.la : undefined).toContain('Regi sæculórum');
    }
  });
});

describe('resolveOrdo("prime", ...) chapter-responsory Gloria omission', () => {
  // Same Passiontide-wide, Sancti-exempt rule as Compline's — see
  // tests/hours/compline.test.ts's own describe block for the live-
  // verification dates.
  it('omits the Gloria on a ferial Passiontide day, keeps it on an ordinary date', () => {
    const passiontideResponsory = resolveOrdo('prime', '2027-03-15').parts.find((p) => p.kind === 'responsory');
    const ordinaryResponsory = resolveOrdo('prime', '2026-08-20').parts.find((p) => p.kind === 'responsory');
    expect(passiontideResponsory?.kind === 'responsory' ? passiontideResponsory.text.text.la : undefined).not.toContain(
      'Glória Patri',
    );
    expect(ordinaryResponsory?.kind === 'responsory' ? ordinaryResponsory.text.text.la : undefined).toContain('Glória Patri');
  });

  it("keeps the Gloria on a Sancti feast's own day, even inside Passiontide", () => {
    const ordo = resolveOrdo('prime', '2027-03-19'); // St. Joseph, Duplex I.
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Glória Patri');
  });
});

describe('resolveOrdo("prime", ...) opening versicle Triduum omission', () => {
  it('drops the opening "Deus in adiutorium" versicle (own baked-in Gloria Patri) on Maundy Thursday and Good Friday', () => {
    // Easter 2026 is Apr 5: Maundy Thursday Apr 2, Good Friday Apr 3.
    // Prime also has an unrelated seasonal 'versicle' part
    // (prime-versicle), so match on text, not just kind.
    for (const date of ['2026-04-02', '2026-04-03']) {
      const opening = resolveOrdo('prime', date).parts.find(
        (p) => p.kind === 'versicle' && p.text.text.la?.includes('adjutórium'),
      );
      expect(opening).toBeUndefined();
    }
  });
});

describe('resolveOrdo("prime", ...) Common-category Lectio Brevis', () => {
  // [date, opening words of the Latin short reading]. Dates are chosen so
  // the saint wins outright; the Common-category tier of
  // getPrimeLectioBrevis must supply the text, not the per-annum default.
  it.each([
    ['2026-10-04', 'Justum dedúxit', 'abbot (St. Francis)'],
    ['2026-09-28', 'Justus cor suum', 'plain martyr (St. Wenceslaus)'],
  ])('%s uses the Common reading beginning "%s" (%s)', (date, incipit) => {
    const lesson = resolveOrdo('prime', date).parts.find(
      (p) => p.kind === 'lesson' && p.label === 'Short Reading',
    );
    expect(lesson && lesson.kind === 'lesson' ? lesson.text.text.la : undefined).toContain(incipit);
  });
});
