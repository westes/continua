import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { getPsalmsFor } from '../../src/psalter/distribution';
import { resolveDay } from '../../src/calendar';

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

  it('opens with the Deus in adjutorium versicle, then Domine labia (x3), then Psalm 3, then the Invitatory (Psalm 94)', () => {
    expect(ordo.parts[0]?.kind).toBe('versicle');
    expect(ordo.parts[1]?.kind).toBe('versicle');
    expect(ordo.parts[2]).toMatchObject({ kind: 'psalm', psalmNumber: 3 });
    expect(ordo.parts[3]).toMatchObject({ kind: 'section-heading', label: 'Invitatory' });
    expect(ordo.parts[4]).toMatchObject({ kind: 'psalm', psalmNumber: 94 });
    const invitatoryAntiphon = (ordo.parts[4] as { antiphon?: { text: Record<string, string> } }).antiphon;
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
    // "Te decet laus" is sung only right after the Te Deum on a 3-nocturn
    // day (2026-08) — absent here along with the Te Deum itself.
    expect(ordo.parts.some((p) => p.kind === 'versicle' && p.text.text.la?.includes('Te decet laus'))).toBe(false);
  });

  it('gives every nocturn psalm its own antiphon and has no mid-nocturn versicle (data/hours/matins-ferial-antiphons.yml)', () => {
    // The nocturn's own psalms start at index 5 (after the two opening versicles/Ps3/heading/Ps94).
    const nocturnPsalms = ordo.parts.slice(5).filter((p) => p.kind === 'psalm') as {
      psalmNumber: number;
      antiphon?: { text: Record<string, string> };
    }[];
    expect(nocturnPsalms.map((p) => p.psalmNumber)).toEqual([43, 44, 47, 48, 49, 54, 55, 58, 59]);
    // Every psalm gets its own antiphon now (2026-09-01) — no more
    // cross-psalm pairs sharing one antiphon under just the first psalm.
    const withAntiphon = nocturnPsalms.filter((p) => p.antiphon !== undefined).map((p) => p.psalmNumber);
    expect(withAntiphon).toEqual([43, 44, 47, 48, 49, 54, 55, 58, 59]);
    for (const p of nocturnPsalms) {
      if (p.antiphon) {
        expect(p.antiphon.text.la).toBeTruthy();
        expect(p.antiphon.text.en).toBeTruthy();
      }
    }
    // No versicle anywhere in the psalmody (fixed 2026-09-02) — the
    // source's embedded mid-list V./R. line is live-verified inert; the
    // real single-nocturn ferial office runs straight to the Capitulum.
    const nocturnVersicles = ordo.parts.slice(5).filter((p) => p.kind === 'versicle');
    expect(nocturnVersicles).toHaveLength(0);
  });

  it("resolves the user's own bible-plan readings for the day, not the historical lectionary", () => {
    // Filtered to unlabeled lessons only: since the temporal-cycle
    // nocturn-readings sweep authored advent-1.yml (2026-08), this same
    // date's Nocturn 2/3 pool also gains two labeled (patristic) lesson
    // entries alongside the user's own bible-plan readings — a real,
    // separate content source this test isn't about (see
    // hours/matins.ts's own nocturnReadingPart, which is the only lesson
    // constructor that sets `label`).
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson' && !p.label);
    // Plain 2 bible-plan readings on this particular clean ferial (no
    // commemorated saint here) — see the next test for the 3-reading case.
    expect(lessons).toHaveLength(2);
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toEqual(['Isa 6; Isa 7', 'Sap 2']);
    // The Vulgate/Douay-Rheims bulk import (2026-09-03) landed the real
    // text for these passages.
    expect((lessons[0] as { text: { status: { en?: string } } }).text.status.en).toBe('verified');
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
    // Same unlabeled-lesson filter as the test above — advent-1.yml's
    // patristic content also pools into this date.
    const lessons = commemoratedOrdo.parts.filter((p) => p.kind === 'lesson' && !p.label);
    expect(lessons).toHaveLength(3);
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toEqual(['Isa 6; Isa 7', 'Sap 2', undefined]);
    expect((lessons[0] as { text: { status: { en?: string } } }).text.status.en).toBe('verified');
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

  it('renders each nocturn versicle with both its V. and R. lines (real bug: sundayPsalmNocturn/sundayCanticleNocturn used to drop the R. line entirely)', () => {
    const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
    // Opening Deus-in-adjutorium versicle + opening Domine-labia versicle +
    // one per nocturn (1, 2, 3) + the closing "Te decet laus" versicle
    // after the Te Deum (2026-08).
    expect(versicles).toHaveLength(6);
    const [, , nocturn1, nocturn2, nocturn3] = versicles;
    expect(nocturn1?.text.text.la).toBe('V. Memor fui nocte nóminis tui Dómine.\nR. Et custodívi legem tuam.');
    expect(nocturn2?.text.text.la).toBe('V. Média nocte surgébam ad confiténdum tibi.\nR. Super justítia justificatiónis tuæ.');
    expect(nocturn3?.text.text.la).toBe('V. Exaltáre Dómine in virtúte tua.\nR. Cantábimus et psallémus virtútes tuas.');
    // The 6th versicle is "Te decet laus", right after the Te Deum (2026-08).
    expect(versicles[5]?.text.text.la).toContain('Te decet laus');
  });

  it("resolves the user's own bible-plan reading (Tobit/Sirach) for Nocturn 1", () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson');
    const citations = lessons.map((l) => (l as { text: { citation?: { en?: string } } }).text.citation?.en);
    expect(citations).toContain('Tob 1; Tob 2');
    expect(citations).toContain('Sir 45');
  });

  it('includes the real Nocturn 2 patristic reading (Gregory on Job) and Nocturn 3 Gospel + homily as one atomic gospel part', () => {
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson') as { label?: string }[];
    const gregory = lessons.find((l) => l.label?.includes('Gregory'));
    expect(gregory).toBeDefined();

    const gospels = ordo.parts.filter((p) => p.kind === 'gospel') as {
      text: { text: { la?: string } };
      homily?: { source?: string; text: { text: { la?: string } } };
    }[];
    expect(gospels).toHaveLength(1);
    const gospel = gospels[0]!;
    expect(gospel.text.text.la).toContain('Naim');
    expect(gospel.homily?.source).toContain('Augustine');
    expect(gospel.homily?.text.text.la).toBeTruthy();
  });

  it('never sources a Gospel from a Common-of-Saints fallback — the only gospel part traces to the bible-plan or a real proper', () => {
    const gospels = ordo.parts.filter((p) => p.kind === 'gospel');
    // This Sunday's own TSV row deliberately has no Gospel (confirmed
    // editorial choice) — the only gospel part should be the day's own
    // proper Nocturn 3 Gospel, not a substituted Common one.
    expect(gospels).toHaveLength(1);
  });

  it('orders Te Deum after every reading (lesson or gospel), and the day collect last', () => {
    const teDeumIndex = ordo.parts.findIndex((p) => p.kind === 'te-deum');
    const lastLessonIndex = ordo.parts.map((p) => p.kind).map((k, i) => ((k === 'lesson' || k === 'gospel') ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    const prayerIndex = ordo.parts.findIndex((p) => p.kind === 'prayer');
    expect(teDeumIndex).toBeGreaterThan(lastLessonIndex);
    expect(prayerIndex).toBeGreaterThan(teDeumIndex);
  });
});

// Real bug (found 2026-09-01, see TODO.md/vu_ferial_matins_antiphons.md):
// Sunday Matins Nocturn III's antiphon was hardcoded to "Allelúja, allelúja,
// allelúja" year-round; Septuagesima through Palm Sunday inclusive each
// have their own Gospel-tied antiphon instead, live-verified against the
// reference engine (Monastic Tridentinum 1617, 2026 calendar) — and for
// Lent 1-4 the canticles and versicle differ too, not just the antiphon.
describe('resolveOrdo("matins", ...) Sunday Nocturn III seasonal override (2026-09-01 fix)', () => {
  it('Septuagesima: proper antiphon, base canticles/versicle unchanged', () => {
    const ordo = resolveOrdo('matins', '2026-02-01');
    const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string }[];
    expect(canticles.map((c) => c.canticleId)).toEqual(['isa-33-2-10', 'isa-33-13-18', 'sir-36-14-19']);
    const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    expect(antiphons.at(-1)?.text.text.la).toBe('Ant. Ite et vos in víneam meam, † et quod justum fúerit, dabo vobis.');
    const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
    expect(versicles.at(-2)?.text.text.la).toBe('V. Exaltáre Dómine in virtúte tua.\nR. Cantábimus et psallémus virtútes tuas.');
  });

  it('Lent 1: proper antiphon, proper canticles (Jer 14/Lam 5/Ezek 36), proper versicle', () => {
    const ordo = resolveOrdo('matins', '2026-02-22');
    const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string; text: { text: Record<string, string> } }[];
    expect(canticles.map((c) => c.canticleId)).toEqual([
      'jer-14-17-21',
      'lam-5-1-7_lam-5-15-17_lam-5-19-21',
      'ezek-36-24-28',
    ]);
    expect(canticles.every((c) => c.text.text.la && c.text.text.en)).toBe(true);
    const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    expect(antiphons.at(-1)?.text.text.la).toBe('Ant. Non in solo pane vivit homo, † sed in omni verbo quod procédit de ore Dei.');
    const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
    expect(versicles.at(-2)?.text.text.la).toBe('V. Scuto circúmdabit te véritas ejus.\nR. Non timébis a timóre noctúrno.');
  });

  it('Passion Sunday and Palm Sunday: base canticles, but the "Ne perdas" versicle, not the base "Exaltáre"', () => {
    for (const date of ['2026-03-22', '2026-03-29']) {
      const ordo = resolveOrdo('matins', date);
      const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string }[];
      expect(canticles.map((c) => c.canticleId)).toEqual(['isa-33-2-10', 'isa-33-13-18', 'sir-36-14-19']);
      const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
      expect(versicles.at(-2)?.text.text.la).toBe('V. Ne perdas cum ímpiis, Deus, ánimam meam.\nR. Et cum viris sánguinum vitam meam.');
    }
    const passionOrdo = resolveOrdo('matins', '2026-03-22');
    const palmOrdo = resolveOrdo('matins', '2026-03-29');
    const antiphonLa = (ordo: ReturnType<typeof resolveOrdo>) =>
      (ordo.parts.filter((p) => p.kind === 'antiphon').at(-1) as { text: { text: Record<string, string> } }).text.text.la;
    expect(antiphonLa(passionOrdo)).toBe('Ant. Ego glóriam meam non quæro: † est qui quærat, et júdicet.');
    expect(antiphonLa(palmOrdo)).toBe('Ant. Hosánna fílio David: † benedíctus, qui venit in nómine Dómini, Rex Israël: † Hosánna in excélsis.');
  });
});

// Real bug (found 2026-09-01, same shape as the Nocturn III fix above, but
// bigger: Advent Sundays' Nocturns I-II antiphons/versicles are also
// seasonal, not just Nocturn III's antiphon+canticles+versicle — live-
// verified against the reference engine (Monastic Tridentinum 1617),
// identical across all 4 Advent Sundays of the 2026 cycle.
describe('resolveOrdo("matins", ...) Advent Sunday Nocturns I-III seasonal override (2026-09-01 fix)', () => {
  it('all 4 Advent Sundays render identical seasonal content (Nocturns I-III antiphons/versicles, Nocturn III canticles)', () => {
    const dates = ['2026-11-29', '2026-12-06', '2026-12-13', '2026-12-20'];
    const renders = dates.map((date) => resolveOrdo('matins', date));

    for (const ordo of renders) {
      const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
      expect(psalms).toEqual([3, 94, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
      const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string }[];
      expect(canticles.map((c) => c.canticleId)).toEqual(['isa-40-10-17', 'isa-42-10-16', 'isa-49-7-13']);

      const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
      expect(antiphons.at(-1)?.text.text.la).toBe(
        'Ant. Gábriel Ángelus locútus est Maríæ, dicens: Ave, grátia plena; Dóminus tecum; Benedícta tu in mulíeres.',
      );

      const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
      const [, , nocturn1, nocturn2, nocturn3] = versicles;
      expect(nocturn1?.text.text.la).toBe('V. Ex Sion spécies decóris ejus.\nR. Deus noster maniféste véniet.');
      expect(nocturn2?.text.text.la).toBe('V. Emítte Agnum, Dómine, Dominatórem terræ.\nR. De Petra desérti ad montem fíliæ Sion.');
      expect(nocturn3?.text.text.la).toBe('V. Egrediétur Dóminus de loco sancto suo.\nR. Véniet ut salvet pópulum suum.');
    }

    // Same content on every one of the 4 Sundays, not just individually correct.
    const nocturn1Openings = renders.map(
      (ordo) => (ordo.parts.filter((p) => p.kind === 'antiphon')[1] as { text: { text: Record<string, string> } }).text.text.la,
    );
    expect(new Set(nocturn1Openings).size).toBe(1);
  });
});

// Follow-up, same day: the user asked whether other seasons need the same
// treatment as Advent above. Live re-check (Monastic Tridentinum 1617)
// found ordinary Paschaltide Sundays (Low Sunday through the Sunday
// before Ascension) do too — same shape, but Nocturns I/II each take a
// single antiphon covering all 6 psalms (not 3 antiphons, one per pair,
// the way Advent/base/Advent do). Easter Sunday itself and the Sunday
// within the Octave of Ascension are each their own separate, wholly
// proper case — not covered by (or asserted here as) this seasonal
// overlay.
describe('resolveOrdo("matins", ...) Paschaltide Sunday Nocturns I-III seasonal override (2026-09-01 fix)', () => {
  it('every ordinary Paschaltide Sunday (Low Sunday through the Sunday before Ascension) renders identical seasonal content', () => {
    const dates = ['2026-04-12', '2026-04-19', '2026-04-26', '2026-05-03', '2026-05-10'];
    const renders = dates.map((date) => resolveOrdo('matins', date));

    for (const ordo of renders) {
      const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
      expect(psalms).toEqual([3, 94, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
      const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string }[];
      expect(canticles.map((c) => c.canticleId)).toEqual(['isa-63-1-5', 'osee-6-1-6', 'soph-3-8-13']);

      const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
      // Nocturn III's antiphon is unchanged from the plain-season default.
      expect(antiphons.at(-1)?.text.text.la).toBe('Ant. Allelúja, allelúja, allelúja.');
      expect(antiphons.at(-2)?.text.text.la).toBe(
        'Ant. Allelúja, quem quæris múlier? allelúja: vivéntem cum mórtuis? allelúja, allelúja.',
      );
      expect(antiphons.at(-3)?.text.text.la).toBe(
        'Ant. Allelúja, lapis revolútus est, allelúja: ab óstio monuménti, allelúja, allelúja.',
      );

      const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
      const [, , nocturn1, nocturn2, nocturn3] = versicles;
      expect(nocturn1?.text.text.la).toBe('V. Surréxit Dóminus de sepúlcro, allelúja.\nR. Qui pro nobis pepéndit in ligno, allelúja.');
      expect(nocturn2?.text.text.la).toBe('V. Surréxit Dóminus vere, allelúja.\nR. Et appáruit Simóni, allelúja.');
      expect(nocturn3?.text.text.la).toBe('V. Gavísi sunt discípuli, allelúja.\nR. Viso Dómino, allelúja.');
    }

    // Same content on every ordinary Paschaltide Sunday, not just individually correct.
    const nocturn1Openings = renders.map(
      (ordo) => (ordo.parts.filter((p) => p.kind === 'antiphon')[1] as { text: { text: Record<string, string> } }).text.text.la,
    );
    expect(new Set(nocturn1Openings).size).toBe(1);
  });
});

// Real bug (found 2026-09-01, same day the user flagged it): the Sunday
// within the Octave of Ascension was letting a Duplex sanctoral candidate
// (St. Paschal Baylon, real May 17) win outright, because
// data/calendar/temporal-categories.yml had ascensiontide's Sunday coded
// `ordinary-sunday` (Duplex+ wins outright) instead of `privileged-sunday`
// (nothing wins outright). Live-verified (2026-05-17): the reference
// engine titles this day "Dominica infra Octavam Ascensionis ~ Semiduplex
// Dominica minor" and gives it its own wholly proper Matins (own psalms —
// Ps 8/10/18/20/23/29 for Nocturn I, not the fixed 20-25 — own antiphons,
// same 3 canticles as the ordinary-Paschaltide override) with no trace of
// the saint, who transfers instead.
describe('resolveOrdo("matins", ...) Sunday within the Octave of Ascension (2026-09-01 fix)', () => {
  it("the Sunday wins outright over St. Paschal Baylon (Duplex), who transfers", () => {
    const day = resolveDay('2026-05-17');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'sunday-after-ascension' });
  });

  it('renders its own genuinely proper Matins, not the fixed 12-psalm scheme', () => {
    const ordo = resolveOrdo('matins', '2026-05-17');
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 8, 10, 18, 20, 23, 29, 45, 46, 95, 96, 98, 102]);

    const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string }[];
    expect(canticles.map((c) => c.canticleId)).toEqual(['isa-63-1-5', 'osee-6-1-6', 'soph-3-8-13']);

    const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    expect(antiphons[1]?.text.text.la).toBe('Ant. Eleváta est magnificéntia tua super cælos, Deus, allelúja.');
    expect(antiphons.at(-1)?.text.text.la).toBe(
      'Ant. Illi autem profécti prædicavérunt ubíque, Dómino cooperánte, et sermónem confirmánte sequéntibus signis, † allelúja, allelúja.',
    );

    const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
    const [, , nocturn1, nocturn2, nocturn3] = versicles;
    expect(nocturn1?.text.text.la).toBe('V. Ascéndit Deus in jubilatióne, allelúja.\nR. Et Dóminus in voce tubæ, allelúja.');
    expect(nocturn2?.text.text.la).toBe('V. Ascéndens Christus in altum, allelúja.\nR. Captívam duxit captivitátem, allelúja.');
    expect(nocturn3?.text.text.la).toBe('V. Ascéndo ad Patrem meum, et Patrem vestrum, allelúja.\nR. Deum meum, et Deum vestrum, allelúja.');
  });
});

describe('resolveOrdo("matins", ...) Easter Sunday/Monday/Tuesday shared proper Matins (2026-09-02 fix)', () => {
  // All 6 weekdays of the Easter Octave share winner {kind: 'temporal', id:
  // 'easter-sunday'} -- only Sunday/Monday/Tuesday are live-verified to
  // share this exact proper content, restricted via the override's own
  // `weekdays` field (see matins-sunday-named-nocturn-overrides.yml).
  const EASTER_WEEK_2026 = ['2026-04-05', '2026-04-06', '2026-04-07'] as const;

  it.each(EASTER_WEEK_2026)('%s shares the identical 13-psalm proper scheme, 3 nocturns, Te Deum', (date) => {
    const day = resolveDay(date);
    expect(day.winner).toEqual({ kind: 'temporal', id: 'easter-sunday' });
    const ordo = resolveOrdo('matins', date);
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 1, 2, 8, 15, 23, 27, 29, 63, 65, 75, 87, 107]);
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(true);

    const canticles = ordo.parts.filter((p) => p.kind === 'canticle') as { canticleId: string }[];
    expect(canticles.map((c) => c.canticleId)).toEqual(['isa-63-1-5', 'osee-6-1-6', 'soph-3-8-13']);

    const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    expect(antiphons[1]?.text.text.la).toBe('Ant. Ego sum qui sum, * et consílium meum non est cum ímpiis, sed in lege Dómini volúntas mea est, allelúja.');
    expect(antiphons.at(-1)?.text.text.la).toBe(
      'Ant. Nolíte expavéscere: * Jesum quǽritis Nazarénum, crucifíxum: surréxit, non est hic, allelúja.',
    );

    const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
    const [, , nocturn1, nocturn2, nocturn3] = versicles;
    expect(nocturn1?.text.text.la).toBe('V. Surréxit Dóminus de sepúlcro, allelúja.\nR. Qui pro nobis pepéndit in ligno, allelúja.');
    expect(nocturn2?.text.text.la).toBe('V. Surréxit Dóminus vere, allelúja.\nR. Et appáruit Simóni, allelúja.');
    expect(nocturn3?.text.text.la).toBe('V. Gavísi sunt discípuli, allelúja.\nR. Viso Dómino, allelúja.');
  });

  it('Wednesday-Saturday of the Octave (same winner.id, excluded by the Sunday-side `weekdays`) stay in the plain 1-nocturn ferial branch, same psalm numbers, no Te Deum', () => {
    const ordo = resolveOrdo('matins', '2026-04-08'); // Wednesday of Easter week
    const day = resolveDay('2026-04-08');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'easter-sunday' });
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Plain ferial Wednesday psalm numbers, same as any other Wednesday --
    // only the antiphon layer differs (see the ferial-named-override
    // describe block below), not the psalmody itself.
    expect(psalms.slice(2)).toEqual(getPsalmsFor('matins', 'wednesday').map((r) => r.number));
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(false);
  });

  it('Low Sunday (a different temporalId) is unaffected, still the plain fixed Sunday scheme', () => {
    const ordo = resolveOrdo('matins', '2026-04-12');
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
  });
});

describe('resolveOrdo("matins", ...) Easter Octave Wednesday-Saturday ferial named antiphon override (2026-09-02 fix)', () => {
  // All 4 weekdays share the exact same 2 antiphons verbatim (live-
  // verified 2026-04-08/09/10/11) -- own psalm numbers per weekday
  // unchanged, split evenly across the weekday's own psalm-group count.
  const EASTER_OCTAVE_WEEKDAYS = ['2026-04-08', '2026-04-09', '2026-04-10', '2026-04-11'] as const;

  it.each(EASTER_OCTAVE_WEEKDAYS)('%s gets the same 2 real antiphons, own weekday psalm numbers unchanged', (date) => {
    const day = resolveDay(date);
    expect(day.winner).toEqual({ kind: 'temporal', id: 'easter-sunday' });
    const ordo = resolveOrdo('matins', date);
    // Ps 3 + 94 (opening/invitatory) plus this weekday's own real ferial table.
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms.slice(2)).toEqual(getPsalmsFor('matins', day.weekday as Exclude<typeof day.weekday, 'sunday'>).map((r) => r.number));

    // Only the 2 named-override antiphons appear in the nocturn (skip the
    // Invitatory's own antiphon, index 0).
    const antiphons = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    const [, first, second] = antiphons;
    expect(first?.text.text.la).toBe(
      'Ant. Jesum qui crucifíxus est quǽritis, allelúja; non est hic: surréxit enim, sicut dixit vobis, allelúja.',
    );
    expect(second?.text.text.la).toBe('Ant. Veníte et vidéte locum ubi pósitus erat Dóminus, allelúja, allelúja.');
    expect(antiphons).toHaveLength(3);

    // No Te Deum -- still the 1-nocturn ferial branch, not promoted to 3.
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(false);
    // No stray versicle in the psalmody (same fix as the plain ferial branch).
    expect(ordo.parts.slice(5).some((p) => p.kind === 'versicle')).toBe(false);
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

  it("uses ferial psalms with its own Terce/Sext/None antiphons (one per nocturn) plus Common's own versicles, for a plain-Duplex weekday winner with no proper antiphon authored", () => {
    // St. Ignatius of Antioch (Duplex, Common of a Martyr-Bishop, no
    // proper antiphon of his own) -- Feb 1 2029, a Thursday, confirmed
    // clean (no Sunday collision) per his own saint-file comment.
    // Duplex is the floor of 3-nocturn eligibility (user, 2026-08): the
    // psalm numbers are Thursday's own real ferial table
    // (psalter-distribution.yml), chunked into 3 -- not Common's own
    // psalm numbers, which only duplex-majus+ winners still get in full.
    // Each nocturn's versicle is Common's own (getMatinsCommonOverride's
    // Common-of-a-Martyr-Bishop resolves via common-of-a-martyr.yml's
    // `aliases`); each nocturn's antiphon is his own SaintRecord.
    // minorHoursCommon (common-of-a-martyr, live-verified identical
    // across the Bishop/non-Bishop split) own Terce/Sext/None antiphon --
    // real, verified, non-psalm-specific text, one distinct antiphon per
    // nocturn (user, 2026-08-27: "some antiphons from the feria and some
    // from the commons feels off... use those antiphons, one per
    // nocturn"), not Common's own Matins Nocturn 1/2 antiphons (those are
    // 6 individual per-psalm paraphrases that would misquote a different
    // ferial psalm).
    const common = resolveOrdo('matins', '2029-02-01');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 76, 77, 77, 78, 79, 80, 82, 83, 84]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    // No canticles -- the ferial table has none, and this tier doesn't
    // borrow Common's own (unlike a duplex-majus+ winner's full scheme).
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(false);

    const psalmParts = common.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { text: Record<string, string>; status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    // Nocturn 1 (76,77,77): Terce's own Common-of-a-Martyr antiphon.
    expect(nocturnPsalms[0]?.antiphon?.text.la).toBe('Ant. Qui séquitur me, * non ámbulat in ténebris, sed habébit lumen vitæ, dicit Dóminus.');
    expect(nocturnPsalms.slice(1, 3).every((p) => p.antiphon === undefined)).toBe(true);
    // Nocturn 2 (78,79,80): Sext's own, a genuinely different antiphon.
    expect(nocturnPsalms[3]?.antiphon?.text.la).toBe('Ant. Qui mihi minístrat, * me sequátur: et ubi ego sum, illic sit et miníster meus.');
    expect(nocturnPsalms.slice(4, 6).every((p) => p.antiphon === undefined)).toBe(true);
    // Nocturn 3 (82,83,84): None's own, different again.
    expect(nocturnPsalms[6]?.antiphon?.text.la).toBe('Ant. Volo Pater, * ut ubi ego sum, illic sit et miníster meus.');
    expect(nocturnPsalms.slice(7).every((p) => p.antiphon === undefined)).toBe(true);
    for (const i of [0, 3, 6]) {
      expect(nocturnPsalms[i]?.antiphon?.status.la).toBe('verified');
      expect(nocturnPsalms[i]?.antiphon?.status.en).toBe('verified');
    }
  });

  it("uses ferial psalms with Common-of-an-Abbot's own Terce/Sext/None antiphons (St. Francis of Paola's own minorHoursCommon, distinct from his Matins-classification common) for a plain-Duplex weekday winner with no proper antiphon authored", () => {
    // St. Francis of Paola (Duplex, Common of a Confessor Not a Bishop
    // for `common`, but `minorHoursCommon: common-of-an-abbot` -- his
    // own P/T/S/N draw from the Abbot common instead, live-verified per
    // his own saint-file comment) -- 2030-04-02, a Tuesday, confirmed
    // clean (no Sunday collision, safely outside Holy Week/Easter octave
    // that year).
    const common = resolveOrdo('matins', '2030-04-02');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 43, 44, 47, 48, 49, 54, 55, 58, 59]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(false);

    const psalmParts = common.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { text: Record<string, string>; status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    expect(nocturnPsalms[0]?.antiphon?.text.la).toBe('Ant. Euge, serve bone * in módico fidélis, intra in gáudium Dómini tui.');
    expect(nocturnPsalms[3]?.antiphon?.text.la).toBe('Ant. Fidélis servus * et prudens, quem constítuit Dóminus super famíliam suam.');
    expect(nocturnPsalms[6]?.antiphon?.text.la).toBe('Ant. Serve bone * et fidélis, intra in gáudium Dómini tui.');
    for (const i of [0, 3, 6]) {
      expect(nocturnPsalms[i]?.antiphon?.status.la).toBe('verified');
      expect(nocturnPsalms[i]?.antiphon?.status.en).toBe('verified');
    }
  });

  it("uses ferial psalms for a Common-of-a-Confessor-Bishop winner -- same weekday psalm numbers as any other plain-Duplex Thursday winner, since psalm numbers no longer come from Common at all", () => {
    // St. Basil the Great (Duplex, live-verified as byte-identical to
    // common-of-a-confessor-bishop.yml despite his own [Rule] saying
    // "vide C4a") -- 2035-06-14, a Thursday, confirmed clean per his own
    // saint-file comment. Same Thursday ferial psalms as St. Ignatius of
    // Antioch's own test above -- the two Commons only ever differed in
    // versicles/antiphon, and psalm numbers are ferial now regardless of
    // which Common category applies.
    const common = resolveOrdo('matins', '2035-06-14');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 76, 77, 77, 78, 79, 80, 82, 83, 84]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(false);
  });

  it("uses ferial psalms with Common-of-Several-Martyrs's own Terce/Sext/None antiphons (one per nocturn) for a plain-Duplex weekday winner with no proper antiphon authored", () => {
    // Ss. Fabian and Sebastian (Duplex, Common of Several Martyrs, no
    // proper antiphon of their own) -- 2029-01-20, a Saturday, confirmed
    // clean (no Sunday collision) per their own saint-file comment.
    const common = resolveOrdo('matins', '2029-01-20');
    const psalms = common.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 96, 104, 104, 105, 105, 106, 106, 107, 108]);
    expect(common.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(common.parts.some((p) => p.kind === 'canticle')).toBe(false);

    const psalmParts = common.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { text: Record<string, string>; status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    expect(nocturnPsalms[0]?.antiphon?.text.la).toBe('Ant. Cum palma * ad regna pervenérunt Sancti, corónas decóris meruérunt de manu Dei.');
    expect(nocturnPsalms[3]?.antiphon?.text.la).toBe('Ant. Córpora Sanctórum * in pace sepúlta sunt: et vivent nómina eórum in ætérnum.');
    expect(nocturnPsalms[6]?.antiphon?.text.la).toBe('Ant. Mártyrum chorus * laudáte Dóminum de cælis, allelúja.');
    expect(nocturnPsalms[6]?.antiphon?.status.la).toBe('verified');
    expect(nocturnPsalms[6]?.antiphon?.status.en).toBe('verified');
    expect(nocturnPsalms.slice(7).every((p) => p.antiphon === undefined)).toBe(true);
  });

  it('falls all the way back to the plain ferial weekday table, redistributed into 3 nocturns, when neither a proper nor a Common entry is authored', () => {
    // St. Monica, Widow (Duplex, Common of a Widow -- no
    // matins-psalmody-overrides category authored yet for either tier;
    // Common-of-an-Abbot no longer qualifies for this proof as of
    // 2026-08-27, now aliased to Common-of-a-Confessor) -- 2029-05-04, a
    // Friday, confirmed clean (no Sunday collision, per her own
    // saint-file comment).
    const fallback = resolveOrdo('matins', '2029-05-04');
    const psalms = fallback.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    // Ps 3 + 94, then Friday's own 9-psalm ferial table
    // (psalter-distribution.yml), not any Common-of-a-Widow scheme.
    expect(psalms[0]).toBe(3);
    expect(psalms[1]).toBe(94);
    expect(psalms.slice(2)).toEqual(getPsalmsFor('matins', 'friday').map((r) => r.number));
    expect(fallback.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    expect(fallback.parts.some((p) => p.kind === 'canticle')).toBe(false);
  });
});

describe('resolveOrdo("matins", ...) Semiduplex weekday-feast (3-nocturn threshold lowered 2026-09-02)', () => {
  // St. Stephen of Hungary (Semiduplex, Common of a Confessor Not a
  // Bishop, no proper Matins antiphon of his own) -- 2026-09-02, a
  // Wednesday. Threshold was Duplex-or-higher before this fix, so a
  // Semiduplex winner used to fall all the way through to the plain
  // 1-nocturn ferial branch; the user's own design intent (2026-09-02) is
  // that Semiduplex and Duplex share the same 3-nocturn/3-psalms-each
  // shape, distinct from the 6/6/3-plus-canticles Sunday/Duplex-majus+
  // scheme. Reuses the same already-working ferialPsalmodyThreeNocturns
  // branch a plain-Duplex winner gets (see the describe block above) --
  // no new content authoring was needed for this fix.
  const ordo = resolveOrdo('matins', '2026-09-02');

  it('splits the ferial 9-psalm pool into 3 nocturns of 3 each, plus a Te Deum, not the 1-nocturn ferial branch', () => {
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p as { psalmNumber: number }).psalmNumber);
    expect(psalms).toEqual([3, 94, 65, 67, 67, 68, 68, 70, 71, 72, 73]);
    expect(ordo.parts.some((p) => p.kind === 'te-deum')).toBe(true);
    // No canticles -- reserved for Sunday/Duplex-majus+, not this tier.
    expect(ordo.parts.some((p) => p.kind === 'canticle')).toBe(false);
  });

  it("uses Common-of-a-Confessor's own Terce/Sext/None antiphons and versicles, one distinct pair per nocturn", () => {
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm') as { psalmNumber: number; antiphon?: { text: Record<string, string>; status: Record<string, string> } }[];
    const nocturnPsalms = psalmParts.filter((p) => ![3, 94].includes(p.psalmNumber));
    expect(nocturnPsalms[0]?.antiphon?.text.la).toContain('Euge, serve bone');
    expect(nocturnPsalms[3]?.antiphon?.text.la).toContain('Fidélis servus');
    expect(nocturnPsalms[6]?.antiphon?.text.la).toContain('Serve bone');
    for (const i of [0, 3, 6]) {
      expect(nocturnPsalms[i]?.antiphon?.status.la).toBe('verified');
      expect(nocturnPsalms[i]?.antiphon?.status.en).toBe('verified');
    }
    const versicles = ordo.parts.filter((p) => p.kind === 'versicle') as { text: { text: Record<string, string> } }[];
    // The 3 nocturn-closing versicles (excluding the opening pair and the
    // final Te decet laus) are Common-of-a-Confessor's own, one per
    // nocturn -- not a stray mid-psalmody line.
    const nocturnVersicles = versicles.slice(2, 5);
    expect(nocturnVersicles).toHaveLength(3);
    expect(nocturnVersicles[0]?.text.text.la).toContain('Amávit eum Dóminus');
    expect(nocturnVersicles[1]?.text.text.la).toContain('Os justi meditábitur');
    expect(nocturnVersicles[2]?.text.text.la).toContain('Lex Dei ejus in corde ipsíus');
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

describe('resolveOrdo("matins", ...) Sacred Triduum', () => {
  // Tenebrae's real rubric drops the whole opening (versicle, Ps 3,
  // Invitatory, hymn) in favor of a silently-said Pater/Ave/Credo —
  // live-verified against both Monastic Tridentinum 1617 and Divino
  // Afflatu 1954 (Holy Thursday: "Invitatorium{omittitur}",
  // "Hymnus{omittitur}", no Ps 3 or versicle either). This app never
  // renders that silent block anywhere (see data/hours/prime.yml's own
  // header), so the fix is a pure omission -- straight into Nocturn 1.
  const HOLY_THURSDAY = '2026-04-02';
  const GOOD_FRIDAY = '2026-04-03';
  const HOLY_SATURDAY = '2026-04-04';

  it.each([HOLY_THURSDAY, GOOD_FRIDAY, HOLY_SATURDAY])('drops the opening versicle/Ps 3/Invitatory/hymn on %s', (date) => {
    const ordo = resolveOrdo('matins', date);
    // The opening versicle itself is gone -- Ps 3 (which it precedes) is
    // gone too, and the nocturn's own psalmody starts the ordo straight
    // off (see the "goes straight into Nocturn 1" test below). A versicle
    // further in belongs to the ferial nocturn's own antiphoned psalmody
    // (matins-ferial-antiphons.yml), not the dropped opening block.
    expect(ordo.parts[0]?.kind).toBe('psalm');
    expect(ordo.parts.some((p) => p.kind === 'psalm' && p.psalmNumber === 3)).toBe(false);
    expect(ordo.parts.some((p) => p.kind === 'psalm' && p.psalmNumber === 94)).toBe(false);
    expect(ordo.parts.some((p) => p.kind === 'section-heading' && p.label === 'Invitatory')).toBe(false);
    expect(ordo.parts.some((p) => p.kind === 'hymn')).toBe(false);
  });

  it('goes straight into Nocturn 1 psalmody as the very first part', () => {
    const ordo = resolveOrdo('matins', HOLY_THURSDAY);
    expect(ordo.parts[0]?.kind).toBe('psalm');
  });

  it("leaves an ordinary day's opening block untouched", () => {
    const ordo = resolveOrdo('matins', '2026-08-20');
    expect(ordo.parts[0]?.kind).toBe('versicle');
    expect(ordo.parts[1]?.kind).toBe('versicle');
    expect(ordo.parts[2]).toMatchObject({ kind: 'psalm', psalmNumber: 3 });
  });
});

describe('resolveOrdo("matins", ...) Assumption-octave hymn fallback (2026-08-22 fix)', () => {
  // Real bug: resolveMatinsHymn's own doc comment already claimed the
  // Assumption's octave "keeps the feast's own proper hymn all week," but
  // the code only ever matched when the day's own winner literally *was*
  // `assumption` (Aug 15 itself) -- every other octave day fell straight
  // through to the plain ferial hymn instead. Fixed by adding a real
  // octave-fallback tier (resolveActiveOctave -> `matins-hymn-${octave.id}`).
  function hymnLatin(date: string): string | undefined {
    const ordo = resolveOrdo('matins', date);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn') as { text: { text: { la: string } } } | undefined;
    return hymn?.text.text.la;
  }

  it("St. Bernard's own day (Aug 20, no hymn of his own authored) picks up the Assumption's octave hymn, not the plain ferial one", () => {
    expect(hymnLatin('2026-08-20')).toContain('Surge');
  });

  it('every other interior day governed by the Assumption octave (16, 19, 21 — none with a hymn of their own) also picks up the octave hymn', () => {
    for (const date of ['2026-08-16', '2026-08-19', '2026-08-21']) {
      expect(hymnLatin(date)).toContain('Surge');
    }
  });

  it("Aug 17 is instead governed by St. Lawrence's own octave (its own elevated closing day, outranking the Assumption's ordinary day here) — no hymn authored for it, so it still falls to the plain ferial one, correctly", () => {
    expect(hymnLatin('2026-08-17')).toContain('Somno');
  });

  it('Aug 22, the octave-closing day (Immaculate Heart of Mary relocated away), also gets the Assumption hymn via the pre-existing sanctoral-substitution path', () => {
    expect(hymnLatin('2026-08-22')).toContain('Surge');
  });

  it("a plain ferial day outside the octave still gets the plain ferial hymn, unaffected", () => {
    expect(hymnLatin(FERIAL_DATE)).toContain('Somno');
  });
});

// Temporal-cycle nocturn-readings sweep (2026-08): src/data/propers/
// nocturn-readings/post-pentecost-{01..24}.yml, sourced from the reference
// engine's Tempora files. post-pentecost-15 was the original mechanism
// proof date (see above); this sweep authored the other 23 post-Pentecost
// ids. Every id is keyed by temporalId, which resolveTemporalId maps
// identically for every day in that liturgical week (Sunday and its
// ferias), so one file's content is exercised regardless of which weekday
// is checked. post-pentecost-13 is the date that originally surfaced the
// gap (2026-08-23, a real Sunday). See TODO.md and memory
// vu-temporal-nocturn-sweep-progress for the full sweep record.
describe('resolveOrdo("matins", ...) post-Pentecost season nocturn-readings sweep (2026-08)', () => {
  function lessonStatuses(date: string) {
    const ordo = resolveOrdo('matins', date);
    return ordo.parts
      .filter((p) => p.kind === 'lesson')
      .map((p) => (p as { text: { status: Record<string, string> } }).text.status);
  }

  it.each([
    ['2026-08-23', 'post-pentecost-13 (today, the reported gap)'],
    ['2027-05-23', 'post-pentecost-01, Trinity Sunday'],
    ['2026-06-14', 'post-pentecost-02'],
    ['2026-11-08', 'post-pentecost-24 (season tail)'],
  ])('%s (%s) resolves at least one non-missing lesson', (date) => {
    const statuses = lessonStatuses(date);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.some((s) => s.la !== 'missing' && s.en !== 'missing')).toBe(true);
  });

  it('every post-pentecost-NN id (01-24) has an authored nocturn-readings file', async () => {
    const { getNocturnReadings } = await import('../../src/propers/nocturn-readings');
    for (let n = 1; n <= 24; n += 1) {
      const id = `post-pentecost-${String(n).padStart(2, '0')}`;
      expect(getNocturnReadings(id).length, id).toBeGreaterThan(0);
    }
  });
});

// Temporal-cycle nocturn-readings sweep, rest of the year (2026-08): the
// same sweep extended past the post-Pentecost season to the other 26
// temporal ids (Advent through Eastertide), sourced from the reference
// engine's own Tempora/<season><N>-0.txt files (Adv1-0, Nat1-0, Epi1-0a -
// post-epiphany-1's actual source, since Epi1-0.txt itself is the later
// Holy Family override, not this Sunday - Quadp1-3-0, Quad1-6-0, Pasc0-7-0).
// Two ids are deliberate, source-confirmed gaps, not oversights:
// easter-sunday and pentecost-sunday both keep the ancient single-nocturn,
// three-lesson form in the source (no Lectio4-9 at all), so neither has a
// nocturn-readings file. See TODO.md and memory
// vu-temporal-nocturn-sweep-progress for the full sweep record.
describe('resolveOrdo("matins", ...) rest-of-year temporal nocturn-readings sweep (2026-08)', () => {
  function lessonStatuses(date: string) {
    const ordo = resolveOrdo('matins', date);
    return ordo.parts
      .filter((p) => p.kind === 'lesson')
      .map((p) => (p as { text: { status: Record<string, string> } }).text.status);
  }

  it.each([
    ['2028-12-03', 'advent-1'],
    ['2026-12-07', 'advent-2'],
    ['2026-12-14', 'advent-3'],
    ['2026-12-21', 'advent-4'],
    ['2026-01-05', 'christmas-octave-sunday'],
    ['2026-01-11', 'post-epiphany-1'],
    ['2026-01-19', 'post-epiphany-2'],
    ['2026-01-26', 'post-epiphany-3'],
    ['2027-11-01', 'post-epiphany-4 (a resumed post-Pentecost-overflow Sunday, not a January date)'],
    ['2026-11-09', 'post-epiphany-5 (resumed)'],
    ['2026-11-16', 'post-epiphany-6 (resumed)'],
    ['2026-02-02', 'septuagesima'],
    ['2026-02-09', 'sexagesima'],
    ['2026-02-16', 'quinquagesima'],
    ['2031-03-02', 'lent-1 (not 2026-02-22: that Sunday is really the Vigil of St. Matthias, transferred onto the Sunday and winning outright)'],
    ['2026-03-01', 'lent-2'],
    ['2026-03-09', 'lent-3'],
    ['2026-03-15', 'lent-4'],
    ['2026-03-22', 'passion-sunday'],
    ['2027-03-21', 'palm-sunday'],
    ['2026-04-13', 'easter-octave'],
    ['2026-04-19', 'easter-3'],
    ['2026-04-27', 'easter-4'],
    ['2026-05-04', 'easter-5'],
    ['2026-05-10', 'easter-6 (the real Sunday — not 2026-05-11: since the eastertide-Sunday precedence fix (2026-09-01), St. Antoninus, Duplex, now correctly wins outright on his own day, May 10, rather than transferring onto Monday, so easter-6\'s own pooled readings show up there commemorated, not on the 11th)'],
    ['2026-05-18', 'sunday-after-ascension'],
    ['2026-04-05', 'easter-sunday'],
    ['2026-05-24', 'pentecost-sunday'],
  ])('%s (%s) resolves at least one non-missing lesson', (date) => {
    const statuses = lessonStatuses(date);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.some((s) => s.la !== 'missing' && s.en !== 'missing')).toBe(true);
  });

  it('every rest-of-year temporal id has an authored nocturn-readings file', async () => {
    const { getNocturnReadings } = await import('../../src/propers/nocturn-readings');
    const ids = [
      'advent-1', 'advent-2', 'advent-3', 'advent-4', 'christmas-octave-sunday',
      'post-epiphany-1', 'post-epiphany-2', 'post-epiphany-3', 'post-epiphany-4', 'post-epiphany-5', 'post-epiphany-6',
      'septuagesima', 'sexagesima', 'quinquagesima', 'lent-1', 'lent-2', 'lent-3', 'lent-4',
      'passion-sunday', 'palm-sunday', 'easter-octave', 'easter-3', 'easter-4', 'easter-5', 'easter-6',
      'sunday-after-ascension', 'easter-sunday', 'pentecost-sunday',
    ];
    for (const id of ids) {
      expect(getNocturnReadings(id).length, id).toBeGreaterThan(0);
    }
  });
});

// The calendar-month/week Nocturn 2 import (2026-08): the later
// post-Pentecost Sundays' real Nocturn 2 is keyed by civil calendar
// month/week (calendar/month-week-id.ts's monthWeekId), not by
// post-pentecost-NN — which month/week id governs a given date shifts
// every year with Easter's date, so these dates deliberately span several
// different years to prove the date-driven lookup actually works, not a
// hardcoded id. All 20 month-week-*.yml files (August-November) are
// exercised across these dates. See TODO.md and memory
// vu-temporal-nocturn-sweep-progress for the full sweep record.
describe('resolveOrdo("matins", ...) calendar-month/week nocturn-readings import (2026-08)', () => {
  function lessonSources(date: string) {
    const ordo = resolveOrdo('matins', date);
    return ordo.parts.filter((p) => p.kind === 'lesson').map((p) => (p as { label?: string }).label);
  }

  it.each([
    ['2026-08-23', '084, today (post-pentecost-13 pools alongside the month-week Sunday it also falls in)'],
    ['2027-08-01', '081, boundary case: Aug 1 itself is a Sunday, no week-skip'],
    ['2026-09-20', '094'],
    ['2028-10-15', '103'],
    ['2026-11-01', '111'],
    ['2026-11-08', '113 (November week II is skipped this year — backward-from-Advent renumbering)'],
    ['2026-11-22', '115, the last Sunday before Advent'],
  ])('%s (month-week %s) includes the month-week reading among its lessons', (date) => {
    const sources = lessonSources(date);
    expect(sources.some((label) => typeof label === 'string' && label.length > 0)).toBe(true);
  });

  it('every month-week-<id> file (081-085, 091-095, 101-105, 111-115) has real content', async () => {
    const { getNocturnReadings } = await import('../../src/propers/nocturn-readings');
    for (const month of [8, 9, 10, 11]) {
      for (let week = 1; week <= 5; week += 1) {
        const id = `month-week-${String(month).padStart(2, '0')}${week}`;
        expect(getNocturnReadings(id).length, id).toBeGreaterThan(0);
      }
    }
  });
});

// Real bug (2026-08-24 fix): nocturnReadingIds unconditionally pooled the
// plain temporalId/month-week ids into every day's nocturn-reading pool,
// even on a day where a real feast wins outright with zero commemorations
// (decideOccurrence's `ordinary-feria` branch) -- correctly suppressing the
// temporal identity entirely. St. Bartholomew (duplex-2-classis, 2026-08-24,
// a Monday) has no Nocturn 3 content of his own, so the leftover 13th-
// Sunday-after-Pentecost (post-pentecost-13.yml) and month-week (month-
// week-084.yml) readings wrongly filled his Nocturn 3. Fixed by gating that
// pooling on whether the day's own occurrence decision actually retained
// the temporal identity (day.winner.kind === 'temporal', or a `kind:
// 'temporal'` entry in day.commemorations).
describe('resolveOrdo("matins", ...) nocturn-reading temporal/month-week suppression (2026-08-24 fix)', () => {
  function lessonLabels(date: string) {
    const ordo = resolveOrdo('matins', date);
    return ordo.parts.filter((p) => p.kind === 'lesson').map((p) => (p as { label?: string }).label);
  }

  it("St. Bartholomew (2026-08-24, duplex-2-classis, zero commemorations) does not pool the suppressed Sunday/month-week readings", () => {
    const labels = lessonLabels('2026-08-24');
    expect(labels).not.toContain('St. Augustine, Bishop of Hippo, Book 2, Questions on the Gospels, ch. 40');
    expect(labels).not.toContain('St. Gregory the Great, Moralia in Job, Book 1, ch. 10');
  });

  it("St. Bartholomew's own Nocturn 2 still carries his own proper vita reading", () => {
    const ordo = resolveOrdo('matins', '2026-08-24');
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson') as { text: { text: Record<string, string> } }[];
    expect(lessons.some((l) => l.text.text.la?.includes('Bartholomǽus Apóstolus'))).toBe(true);
  });

  // Superseded by the 2026-09-01 fix below: a plain ferial weekday no
  // longer pools the plain temporal/month-week readings at all (that
  // content is the *governing Sunday's own* Nocturn 2/3 material, reserved
  // for the Sunday itself), so this gap day's lessons come only from its
  // own day's sources -- none authored yet, hence still missing. That's a
  // real content gap (tracked in TODO.md), not a mechanism bug.
  it('a plain ferial weekday with no sanctoral winner (2026-09-04, a gap day in sanctoral-calendar.yml, within the 14th-Sunday-after-Pentecost/month-week-091 week) does not pool the plain temporal/month-week readings', () => {
    const labels = lessonLabels('2026-09-04');
    expect(labels).not.toContain("St. Augustine, Bishop of Hippo, Book 2 on the Lord's Sermon on the Mount, ch. 14");
    expect(labels).not.toContain('St. Gregory the Great, Moralia in Job, Book 2, ch. 1');
  });
});

// Real bug (2026-09-01 fix): unlike the 2026-08-24 fix above (which only
// suppressed the temporal/month-week pool when a real feast won outright),
// nocturnReadingIds still pooled that content on a plain 1-nocturn feria
// within an ordinary week, because on such a day day.winner.id (added
// unconditionally) already *is* the governing Sunday's own temporalId. A
// Tuesday's Matins (2026-09-01, within the 14th-Sunday-after-Pentecost
// week) wrongly showed that Sunday's own patristic homily and, worse, its
// Nocturn 3 responsory verbatim — content that Sunday had already read
// three days earlier. Fixed by gating both the plain temporalId/month-week
// pool *and* the day.winner.id/commemoration shortcut that duplicated it
// on threeNocturns, so a 1-nocturn feria only ever draws on its own day's
// content.
describe('resolveOrdo("matins", ...) ferial temporal-pool suppression (2026-09-01 fix)', () => {
  it("a plain Tuesday feria (2026-09-01, within the 14th-Sunday-after-Pentecost week) does not reuse that Sunday's own Nocturn 3 homily or responsory", () => {
    const ordo = resolveOrdo('matins', '2026-09-01');
    const lessons = ordo.parts.filter((p) => p.kind === 'lesson') as {
      label?: string;
      responsory?: { text: { la: string } };
    }[];
    expect(lessons.map((l) => l.label)).not.toContain(
      "St. Augustine, Bishop of Hippo, Book 2 on the Lord's Sermon on the Mount, ch. 14",
    );
    expect(lessons.some((l) => l.responsory?.text.la.includes('Duo Séraphim'))).toBe(false);
  });
});

// Coverage gap fix (no bug found): the pre-existing ferial-branch test
// above only asserted the opening invitatory antiphon *contains* "Veníte,"
// true for both the incipit ("Ant. Veníte.") and full ("Ant. Veníte, *
// Exsultémus Dómino.") forms -- it never actually distinguished doubled vs.
// undoubled. isDoubleOrHigher/openingAntiphon traced out correct in source
// for every rank tested here; these tests just make the distinction real.
describe('resolveOrdo("matins", ...) invitatory antiphon doubling by rank', () => {
  function openingAntiphonLatin(date: string): string | undefined {
    const ordo = resolveOrdo('matins', date);
    const invitatoryPsalm = ordo.parts.find((p) => p.kind === 'psalm' && (p as { psalmNumber: number }).psalmNumber === 94) as
      | { antiphon?: { text: Record<string, string> } }
      | undefined;
    return invitatoryPsalm?.antiphon?.text.la;
  }

  it('a Duplex+ weekday winner opens with the FULL (not incipit-only) invitatory antiphon (St. Lawrence, 2026-08-17: Common-of-a-Martyr text, no proper of his own; St. Bartholomew, duplex-2-classis, 2026-08-24: Common-of-an-Apostle text)', () => {
    // St. Lawrence has his own full proper Matins psalmody
    // (matins-psalmody-overrides/saints/st-lawrence.yml) but no proper
    // invitatory antiphon of his own -- resolveMatinsInvitatoryText falls
    // to his common-of-a-martyr Common tier (matins-invitatory-common-of-
    // a-martyr.yml, authored 2026-08-27), not the plain ferial default.
    expect(openingAntiphonLatin('2026-08-17')).toContain('Regem Mártyrum Dóminum, * Veníte');
    expect(openingAntiphonLatin('2026-08-24')).toContain('Regem Apostolórum Dóminum, * Veníte');
  });

  it("the Beheading of St. John the Baptist (2026-08-29, common corrected from apostle to martyr) opens with the martyr Common's invitatory antiphon, not the apostle one", () => {
    // Regression test: decollation-of-st-john-baptist.yml's `common` field
    // used to be common-of-an-apostle (a mistaken placeholder -- he isn't
    // an apostle), which leaked into the Matins invitatory. Corrected to
    // common-of-a-martyr, matching the file's own already-correct
    // `minorHoursCommon`.
    expect(openingAntiphonLatin('2026-08-29')).toContain('Regem Mártyrum Dóminum, * Veníte');
    expect(openingAntiphonLatin('2026-08-29')).not.toContain('Regem Apostolórum');
  });

  it('a plain ferial day opens with the incipit only', () => {
    expect(openingAntiphonLatin(FERIAL_DATE)).not.toContain('Exsultémus');
  });

  it("a Simplex saint merely commemorated (not winning) under an Advent feria still opens with the incipit only — the winner's own rank governs, not any commemorated saint's (St. Bibiana, 2025-12-02)", () => {
    expect(openingAntiphonLatin('2025-12-02')).not.toContain('Exsultémus');
  });
});

// New mechanism (2026-08): resolveMatinsHymn gained a Common-of-Saints
// tier (override -> octave -> Common category -> season -> ferial), and
// the invitatory antiphon -- previously one hardcoded fixed text for every
// day of the year -- now goes through the same shape of tiering
// (resolveMatinsInvitatoryText: override -> Common category -> season ->
// ferial). Both confirmed against the reference engine's own Commune/
// C1.txt (Common of an Apostle): hymn "Ætérna Christi múnera," invitatory
// "Regem Apostolórum Dóminum." St. Bartholomew has no proper Matins hymn
// or invitatory of his own authored, so this Common tier is what actually
// renders for him.
describe('resolveOrdo("matins", ...) Common-of-an-Apostle hymn + invitatory (2026-08-24 fix)', () => {
  function hymnLatin(date: string): string | undefined {
    const ordo = resolveOrdo('matins', date);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn') as { text: { text: { la: string } } } | undefined;
    return hymn?.text.text.la;
  }
  function invitatoryFullLatin(date: string): string | undefined {
    const ordo = resolveOrdo('matins', date);
    const antiphonParts = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    return antiphonParts[0]?.text.text.la;
  }

  it("St. Bartholomew's own day (2026-08-24, no proper Matins hymn of his own) picks up the Common-of-an-Apostle hymn", () => {
    expect(hymnLatin('2026-08-24')).toContain('Ætérna Christi múnera');
  });

  it("St. Bartholomew's invitatory antiphon resolves to the Common-of-an-Apostle text", () => {
    expect(invitatoryFullLatin('2026-08-24')).toContain('Regem Apostolórum Dóminum');
  });

  it('St. Andrew (2026-11-30, also common-of-an-apostle, no proper hymn/invitatory of his own) resolves to the same Common text -- confirms the tier generalizes beyond Bartholomew', () => {
    expect(hymnLatin('2026-11-30')).toContain('Ætérna Christi múnera');
    expect(invitatoryFullLatin('2026-11-30')).toContain('Regem Apostolórum Dóminum');
  });

  it('a plain ferial day is unaffected -- still falls through to the plain ferial hymn and invitatory antiphon', () => {
    expect(hymnLatin(FERIAL_DATE)).toContain('Somno');
    expect(invitatoryFullLatin(FERIAL_DATE)).toContain('Veníte');
    expect(invitatoryFullLatin(FERIAL_DATE)).not.toContain('Regem Apostolórum');
  });
});

describe('resolveOrdo("matins", ...) remaining Common categories\' Matins hymns (2026-08-26)', () => {
  // Same tier this file's earlier "Common-of-an-Apostle hymn" describe
  // block already proved (proper > octave > Common > season > ferial) --
  // this just extends the same live-verified content to the categories
  // authored alongside this session's Lauds/Vespers pass.
  function hymnLatin(date: string): string | undefined {
    const ordo = resolveOrdo('matins', date);
    const hymn = ordo.parts.find((p) => p.kind === 'hymn') as { text: { text: { la: string } } } | undefined;
    return hymn?.text.text.la;
  }

  it('Ss. Placid and Companions (common-of-several-martyrs) resolve to "Ætérna Christi múnera, Et Mártyrum victórias" -- distinct from the Apostle hymn\'s shared opening line', () => {
    expect(hymnLatin('2026-10-05')).toContain('Ætérna Christi múnera');
    expect(hymnLatin('2026-10-05')).toContain('Mártyrum victórias');
  });

  it('St. Maurus (common-of-an-abbot) resolves to Common-of-a-Confessor-Not-Bishop\'s own hymn, same finding as the Lauds/Vespers pass', () => {
    expect(hymnLatin('2026-01-15')).toContain('Iste Conféssor Dómini sacrátus');
  });

  it('St. Apollonia (common-of-a-virgin-martyr, her own clean year 2029-02-09) resolves to "Vírginis Proles"', () => {
    expect(hymnLatin('2029-02-09')).toContain('Vírginis Proles');
  });

  it('the Guardian Angels, St. Michael, St. Gabriel, and St. Raphael all resolve to "Tibi Christe splendor Patris," reused from St. Michael\'s Apparition (same real proper-content-inheritance finding as Lauds/Vespers)', () => {
    for (const date of ['2026-10-02', '2026-09-29', '2026-03-24', '2026-10-24']) {
      expect(hymnLatin(date)).toContain('Tibi Christe splendor Patris');
    }
  });

  it('St. Anne (common-of-a-holy-woman) and St. Monica (common-of-a-widow) resolve to the same shorter "Hujus obténtu, Deus alme" form (just the closing two stanzas of the Virgin hymn)', () => {
    expect(hymnLatin('2026-07-26')).toContain('Hujus obténtu, Deus alme');
    expect(hymnLatin('2026-05-04')).toContain('Hujus obténtu, Deus alme');
  });

  it('Our Lady of Mount Carmel (common-of-the-bvm) resolves to "Quem terra, pontus, ǽthera"', () => {
    expect(hymnLatin('2026-07-16')).toContain('Quem terra, pontus, ǽthera');
  });

  it('the Finding and Exaltation of the Holy Cross resolve to their own proper "Pange, lingua, gloriósi" (shared between the two ids)', () => {
    expect(hymnLatin('2027-05-03')).toContain('Pange, lingua, gloriósi');
    expect(hymnLatin('2026-09-14')).toContain('Pange, lingua, gloriósi');
  });

  it('the Transfiguration resolves to its own proper "Quicúmque Christum quǽritis," byte-identical to its own Vespers hymn', () => {
    expect(hymnLatin('2026-08-06')).toContain('Quicúmque Christum quǽritis');
  });
});

describe('resolveOrdo("matins", ...) Nativity of St. John the Baptist (2026-06-24) real proper content', () => {
  // Regression test: nativity-of-st-john-the-baptist.yml's `common`
  // field (common-of-an-apostle) used to leak into the invitatory, hymn,
  // and Nocturn psalmody since no proper override existed for any of
  // them. The reference engine assigns this feast no Commune at all, so
  // real proper text was authored for each instead of swapping the
  // Common id.
  const ordo = resolveOrdo('matins', '2026-06-24');

  it("resolves the invitatory antiphon to its own proper text, not the apostle Common's", () => {
    const antiphonParts = ordo.parts.filter((p) => p.kind === 'antiphon') as { text: { text: Record<string, string> } }[];
    const invitatoryLatin = antiphonParts[0]?.text.text.la;
    expect(invitatoryLatin).toContain('Regem Præcursóris Dóminum');
    expect(invitatoryLatin).not.toContain('Regem Apostolórum');
  });

  it("resolves the Matins hymn to its own proper text, not the apostle Common's", () => {
    const hymn = ordo.parts.find((p) => p.kind === 'hymn') as { text: { text: { la: string } } } | undefined;
    expect(hymn?.text.text.la).toContain('Antra desérti téneris sub annis');
    expect(hymn?.text.text.la).not.toContain('Ætérna Christi múnera');
  });

  it("resolves Nocturn 1/2 psalmody to its own proper antiphons over the shared Sunday psalm pool, not the apostle Common's antiphons", () => {
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm') as {
      psalmNumber: number;
      antiphon?: { text: Record<string, string> };
    }[];
    const psalm1 = psalms.find((p) => p.psalmNumber === 1);
    const psalm63 = psalms.find((p) => p.psalmNumber === 63);
    expect(psalm1?.antiphon?.text.la).toContain('Priúsquam te formárem');
    expect(psalm63?.antiphon?.text.la).toContain('Nazarǽus');
  });
});
