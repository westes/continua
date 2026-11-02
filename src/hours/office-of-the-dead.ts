import type { ResolvedPart, ResolvedText, ResolvedVerse } from './types';
import { getPsalmVerses } from '../psalter';
import { applyFlexaMark } from './antiphon';

/**
 * The Office of the Dead ("Officium Defunctorum") — the reusable engine
 * behind hours/all-souls.ts. Everything here is genuinely generic content
 * from the reference engine's Commune/C9.txt: usable for ANY future
 * occasion this office gets said (a funeral, an anniversary/month's-mind,
 * a votive Monday recitation) — none of which vu triggers yet. All Souls'
 * Day (Nov 2) is currently the only caller, via hours/all-souls.ts, which
 * layers its own day-specific overrides (Matins' Lessons 4-9, the
 * Martyrology introduction, Prime/Compline's own collects — see that
 * file's header for exactly which pieces are day-specific and why) on top
 * of the generic structure built here. Nothing in this file references a
 * date or a calendar day on purpose — see vu_office_of_the_dead_scope
 * memory for the corrected understanding this split is built on.
 */

export type Bilingual = Partial<Record<string, string>>;

export function v(la: string, en: string, citation?: Bilingual): ResolvedText {
  return { text: { la, en }, status: { la: 'verified', en: 'verified' }, citation };
}

export function ant(la: string, en: string): ResolvedText {
  return v(`Ant. ${la}`, `Ant. ${en}`);
}

export function versicle(vLa: string, vEn: string, rLa: string, rEn: string): ResolvedText {
  return v(`V. ${vLa}\nR. ${rLa}`, `V. ${vEn}\nR. ${rEn}`);
}

/** The "Requiem gloria" rubric: every psalm/canticle throughout the whole
 * Office of the Dead substitutes this couplet for the ordinary Gloria
 * Patri — wired in centrally via resolve-common.ts's resolveGloriaPatri
 * (mirroring the Triduum's own omission there), not per-part here. */
export const REQUIEM_GLORIA_PATRI: ResolvedText = v(
  'Réquiem ætérnam * dona eis, Dómine.\nEt lux perpétua * lúceat eis.',
  'Eternal rest * grant unto them, O Lord.\nAnd let perpetual light * shine upon them.',
);

/** The special "Conclusio specialis" ending every hour of this office (in
 * place of the ordinary Benedicamus Domino / Fidelium animae close). */
export const CONCLUSIO: ResolvedPart = {
  kind: 'preces',
  text: v(
    'V. Réquiem ætérnam dona eis, Dómine.\nR. Et lux perpétua lúceat eis.\nV. Requiéscant in pace.\nR. Amen.',
    'V. Eternal rest grant unto them, O Lord.\nR. And let perpetual light shine upon them.\nV. May they rest in peace.\nR. Amen.',
  ),
};

export function psalmWithAntiphon(number: number, verses: string | undefined, antiphon: ResolvedText | undefined): ResolvedPart {
  const raw: ResolvedVerse[] = getPsalmVerses(number, verses).map((verseEntry) => ({
    n: verseEntry.n,
    text: verseEntry.text,
    status: verseEntry.status,
  }));
  const { verses: marked, antiphon: opening } = applyFlexaMark(raw, antiphon);
  return { kind: 'psalm', psalmNumber: number, antiphon: opening, verses: marked, verseRange: verses };
}

export function barePsalm(number: number, verses?: string): ResolvedPart {
  return psalmWithAntiphon(number, verses, undefined);
}

// ---------------------------------------------------------------------
// Collects
// ---------------------------------------------------------------------

/** Commune C9's own generic collects — reusable regardless of occasion.
 * "Fidélium, Deus..." closes Matins/Terce/Sext/None; Distinct from Sancti/11-02's
 * own day-specific collect wording (Oratio mortuorum1/2), which stays in
 * all-souls.ts — see that file's header. */
export const GENERIC_MATINS_COLLECT = v(
  'Fidélium, Deus, ómnium Cónditor et Redémptor, animábus famulórum famularúmque tuárum remissiónem cunctórum tríbue peccatórum: ut indulgéntiam, quam semper optavérunt, piis supplicatiónibus consequántur: Qui vivis et regnas cum Deo Patre, in unitáte Spíritus Sancti, Deus, per ómnia sǽcula sæculórum.',
  'O God, who art thyself at once the Maker and the Redeemer of all thy faithful ones, grant unto the souls of thy servants and handmaids remission of all their sins; making of our entreaties unto our great Father a mean whereby they may have that forgiveness which they have ever hoped for. Who livest and reignest with God the Father, in the unity of the Holy Ghost, God, world without end.',
);

// ---------------------------------------------------------------------
// Prime — bare psalms + collect. Any Martyrology reading (All Souls' Day
// keeps the day's normal daily Martyrology, with its own special
// introduction) is layered on by the caller, not built here — a private/
// votive recitation of this office wouldn't include a day's own
// Martyrology announcement at all.
// ---------------------------------------------------------------------

export function buildPrimeParts(collect: ResolvedText): ResolvedPart[] {
  return [barePsalm(87), barePsalm(27), barePsalm(31), { kind: 'prayer', text: collect }];
}

// ---------------------------------------------------------------------
// Terce / Sext / None — bare psalms only (no antiphon, chapter, hymn, or
// preces), each closing with the generic "Fidélium, Deus" collect (same
// text as Matins' own closing collect) + the Requiem Conclusio.
// ---------------------------------------------------------------------

export function buildTerceParts(collect: ResolvedText = GENERIC_MATINS_COLLECT): ResolvedPart[] {
  return [barePsalm(37, '1-11'), barePsalm(37, '12-23'), barePsalm(55), { kind: 'prayer', text: collect }, CONCLUSIO];
}

export function buildSextParts(collect: ResolvedText = GENERIC_MATINS_COLLECT): ResolvedPart[] {
  return [barePsalm(69), barePsalm(84), barePsalm(85), { kind: 'prayer', text: collect }, CONCLUSIO];
}

export function buildNoneParts(collect: ResolvedText = GENERIC_MATINS_COLLECT): ResolvedPart[] {
  return [barePsalm(101, '1-13'), barePsalm(101, '14-23'), barePsalm(101, '24-29'), { kind: 'prayer', text: collect }, CONCLUSIO];
}

// ---------------------------------------------------------------------
// Compline — bare psalms + Nunc Dimittis + closing versicles + collect.
// Compline's own opening (Confiteor/Misereatur/Indulgentiam) is the
// app's normal daily opening, unaffected by this office — the caller
// prepends it, same as for any other day.
// ---------------------------------------------------------------------

const COMPLINE_CLOSING_VERSICLES = v(
  'V. A porta ínferi.\nR. Erue, Dómine, ánimas eórum.\nV. Requiéscant in pace.\nR. Amen.\nV. Dómine, exáudi oratiónem meam.\nR. Et clamor meus ad te véniat.',
  'V. From the gates of hell.\nR. Deliver their souls, O Lord!\nV. May they rest in peace.\nR. Amen.\nV. O Lord, hear my prayer.\nR. And let my cry come unto thee.',
);

const NUNC_DIMITTIS = v(
  'Nunc dimíttis servum tuum, Dómine, * secúndum verbum tuum in pace: Quia vidérunt óculi mei * salutáre tuum, Quod parásti * ante fáciem ómnium populórum, Lumen ad revelatiónem géntium, * et glóriam plebis tuæ Israël.',
  'Now thou dost dismiss thy servant, O Lord, * according to thy word in peace; Because my eyes have seen * thy salvation, Which thou hast prepared * before the face of all peoples: A light to the revelation of the Gentiles, * and the glory of thy people Israel.',
  { la: 'Luc 2:29-32', en: 'Luke 2:29-32' },
);

export function buildComplineParts(collect: ResolvedText): ResolvedPart[] {
  return [
    barePsalm(122),
    barePsalm(141),
    barePsalm(142),
    { kind: 'canticle', canticleId: 'nunc-dimittis', text: NUNC_DIMITTIS },
    { kind: 'versicle', text: COMPLINE_CLOSING_VERSICLES },
    { kind: 'prayer', text: collect },
    CONCLUSIO,
  ];
}
