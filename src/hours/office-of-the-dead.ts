import type { ResolvedPart, ResolvedText, ResolvedVerse } from './types';
import { getPsalmVerses } from '../psalter';
import { applyFlexaMark } from './antiphon';
import { resolveCommon } from './resolve-common';

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
 * "Fidélium, Deus..." closes Matins/Terce/Sext/None; "Deus
 * indulgentiárum..." closes Lauds/Vespers. Distinct from Sancti/11-02's
 * own day-specific collect wording (Oratio mortuorum1/2), which stays in
 * all-souls.ts — see that file's header. */
export const GENERIC_MATINS_COLLECT = v(
  'Fidélium, Deus, ómnium Cónditor et Redémptor, animábus famulórum famularúmque tuárum remissiónem cunctórum tríbue peccatórum: ut indulgéntiam, quam semper optavérunt, piis supplicatiónibus consequántur: Qui vivis et regnas cum Deo Patre, in unitáte Spíritus Sancti, Deus, per ómnia sǽcula sæculórum.',
  'O God, who art thyself at once the Maker and the Redeemer of all thy faithful ones, grant unto the souls of thy servants and handmaids remission of all their sins; making of our entreaties unto our great Father a mean whereby they may have that forgiveness which they have ever hoped for. Who livest and reignest with God the Father, in the unity of the Holy Ghost, God, world without end.',
);

export const GENERIC_LAUDS_VESPERS_COLLECT = v(
  'Deus, véniæ largítor et humánæ salútis amátor: quǽsumus cleméntiam tuam; ut ánimas ómnium fidélium qui ex hoc sǽculo transiérunt, beáta María semper Vírgine intercedénte cum ómnibus Sanctis tuis, ad perpétuæ beatitúdinis consórtium perveníre concédas. Per Christum Dóminum nostrum. Amen.',
  'O God the giver of pardon, and the lover of human salvation, we beseech thy clemency: that thou grant unto the souls of all the faithful who are departed out of this world, blessed Mary ever Virgin making intercession with all thy Saints, to come to the fellowship of eternal blessedness. Through Christ our Lord. Amen.',
);

// ---------------------------------------------------------------------
// Lauds
// ---------------------------------------------------------------------

const HEZEKIAH_CANTICLE = v(
  'Ego dixi: In dimídio diérum meórum * vadam ad portas ínferi. Quæsívi resíduum annórum meórum. * Dixi: Non vidébo Dóminum Deum in terra vivéntium. Non aspíciam hóminem ultra, * et habitatórem quiétis. Generátio mea abláta est, et convolúta est a me, * quasi tabernáculum pastórum. Præcísa est velut a texénte, vita mea: dum adhuc ordírer, succídit me: * de mane usque ad vésperam fínies me. Sperábam usque ad mane, * quasi leo sic contrívit ómnia ossa mea: de mane usque ad vésperam fínies me: * sicut pullus hirúndinis sic clamábo, meditábor ut colúmba: Attenuáti sunt óculi mei, * suspiciéntes in excélsum. Dómine, vim pátior, respónde pro me. * Quid dicam, aut quid respondébit mihi, cum ipse fécerit? Recogitábo tibi omnes annos meos * in amaritúdine ánimæ meæ. Dómine, si sic vívitur, et in tálibus vita spíritus mei, corrípies me, et vivificábis me. * Ecce, in pace amaritúdo mea amaríssima: Tu autem eruísti ánimam meam ut non períret: * proiecísti post tergum tuum ómnia peccáta mea. Quia non inférnus confitébitur tibi, neque mors laudábit te: * non exspectábunt qui descéndunt in lacum, veritátem tuam. Vivens vivens ipse confitébitur tibi, sicut et ego hódie: * pater fíliis notam fáciet veritátem tuam. Dómine, salvum me fac * et psalmos nostros cantábimus cunctis diébus vitæ nostræ in domo Dómini.',
  'I said: In the midst of my days * I shall go to the gates of hell: I sought for the residue of my years. * I said: I shall not see the Lord God in the land of the living. I shall behold man no more, * nor the inhabitant of rest. My generation is at an end, and it is rolled away from me, * as a shepherd’s tent. My life is cut off, as by a weaver: whilst I was yet but beginning, he cut me off: * from morning even to night thou wilt make an end of me. I hoped till morning, * as a lion so hath he broken all my bones: from morning even to night thou wilt make an end of me. * I will cry like a young swallow, I will meditate like a dove: My eyes are weakened * looking upward: Lord, I suffer violence, answer thou for me. * What shall I say, or what shall he answer for me, whereas he himself hath done it? I will recount to thee all my years * in the bitterness of my soul. O Lord, if man’s life be such, and the life of my spirit be in such things as these, thou shalt correct me, and make me to live. * Behold in peace is my bitterness most bitter: But thou hast delivered my soul that it should not perish, * thou hast cast all my sins behind thy back. For hell shall not confess to thee, neither shall death praise thee: * nor shall they that go down into the pit, look for thy truth. The living, the living, he shall give praise to thee, as I do this day: * the father shall make thy truth known to the children. O Lord, save me, and we will sing our psalms all the days of our life * in the house of the Lord.',
  { la: 'Isa 38:10-20', en: 'Isa 38:10-20' },
);

/** Reused as both Lauds' Benedictus antiphon and (per the well-known
 * standard convention for this office) Second Vespers' Magnificat
 * antiphon — see hours/all-souls.ts's own Vespers builder for the caveat
 * on that reuse not being independently re-verified live. */
export const RESURRECTIO_ANTIPHON = ant(
  'Ego sum resurréctio et vita: qui credit in me, étiam si mórtuus fúerit, vivet; et omnis qui vivit et credit in me, non moriétur in ætérnum.',
  'I am the resurrection and the life: he that believeth in me, though he were dead, yet shall he live; and whosoever liveth and believeth in me shall never die.',
);

export function buildLaudsParts(collect: ResolvedText = GENERIC_LAUDS_VESPERS_COLLECT): ResolvedPart[] {
  const psalm50 = psalmWithAntiphon(50, undefined, ant('Exsultábunt Dómino * ossa humiliáta.', 'The bones which thou hast broken * may rejoice.'));
  const psalm64 = psalmWithAntiphon(64, undefined, ant('Exáudi, Dómine, * oratiónem meam: ad te omnis caro véniet.', 'Lord, hear * my prayer; unto thee shall all flesh come.'));
  const combinedAntiphon = ant('Me suscépit * déxtera tua, Dómine.', 'Thy right hand * upholdeth me.');
  const psalm62 = psalmWithAntiphon(62, undefined, combinedAntiphon);
  const psalm66 = psalmWithAntiphon(66, undefined, undefined);
  const canticleAntiphon = ant('A porta ínferi * érue, Dómine, ánimam meam.', 'From the gates of hell * deliver my soul, O Lord.');
  const laudateAntiphon = ant('Omnis spíritus * laudet Dóminum.', 'Let everything that hath breath * praise the Lord.');
  const psalm148 = psalmWithAntiphon(148, undefined, laudateAntiphon);
  const psalm149 = barePsalm(149);
  const psalm150 = barePsalm(150);
  return [
    psalm50,
    { kind: 'antiphon', text: ant('Exsultábunt Dómino ossa humiliáta.', 'The bones which thou hast broken may rejoice.') },
    psalm64,
    { kind: 'antiphon', text: ant('Exáudi, Dómine, oratiónem meam: ad te omnis caro véniet.', 'Lord, hear my prayer; unto thee shall all flesh come.') },
    psalm62,
    psalm66,
    { kind: 'antiphon', text: ant('Me suscépit déxtera tua, Dómine.', 'Thy right hand upholdeth me.') },
    { kind: 'canticle', canticleId: 'canticle-of-hezekiah', text: HEZEKIAH_CANTICLE, antiphon: canticleAntiphon },
    { kind: 'antiphon', text: ant('A porta ínferi érue, Dómine, ánimam meam.', 'From the gates of hell deliver my soul, O Lord.') },
    psalm148,
    psalm149,
    psalm150,
    { kind: 'antiphon', text: ant('Omnis spíritus laudet Dóminum.', 'Let everything that hath breath praise the Lord.') },
    { kind: 'canticle', canticleId: 'benedictus', text: resolveCommon('benedictus'), antiphon: RESURRECTIO_ANTIPHON },
    { kind: 'antiphon', text: RESURRECTIO_ANTIPHON },
    { kind: 'prayer', text: collect },
    CONCLUSIO,
  ];
}

// ---------------------------------------------------------------------
// Vespers
// ---------------------------------------------------------------------

export function buildVespersParts(collect: ResolvedText = GENERIC_LAUDS_VESPERS_COLLECT): ResolvedPart[] {
  const groups: { n: number; ant: ResolvedText }[] = [
    { n: 114, ant: ant('Placébo Dómino * in regióne vivórum.', 'I will walk before the Lord * in the land of the living.') },
    { n: 119, ant: ant('Heu mihi, Dómine, * quia incolátus meus prolongátus est.', 'Woe is me, O Lord! * that my sojourn is long.') },
    { n: 120, ant: ant('Dóminus custódit te ab omni malo: * custódiat ánimam tuam Dóminus.', 'The Lord shall keep thee from all evil: * the Lord shall keep thy soul.') },
    { n: 129, ant: ant('Si iniquitátes * observáveris, Dómine: Dómine, quis sustinébit?', 'If Thou, Lord, shouldest mark iniquities: * O Lord, who shall stand?') },
    { n: 137, ant: ant('Ópera * mánuum tuárum, Dómine, ne despícias.', 'O Lord, forsake not * the works of thine own hands.') },
  ];
  const parts: ResolvedPart[] = [];
  for (const g of groups) {
    parts.push(psalmWithAntiphon(g.n, undefined, g.ant));
    parts.push({ kind: 'antiphon', text: g.ant });
  }
  parts.push({
    kind: 'versicle',
    text: versicle(
      'Audívi vocem de cælo dicéntem mihi.',
      'I heard a voice from heaven, saying unto me:',
      'Beáti mórtui qui in Dómino moriúntur.',
      'Blessed are the dead which die in the Lord.',
    ),
  });
  parts.push({
    kind: 'canticle',
    canticleId: 'magnificat',
    text: resolveCommon('magnificat'),
    antiphon: RESURRECTIO_ANTIPHON,
  });
  parts.push({ kind: 'antiphon', text: RESURRECTIO_ANTIPHON });
  parts.push({ kind: 'prayer', text: collect });
  parts.push(CONCLUSIO);
  return parts;
}

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
