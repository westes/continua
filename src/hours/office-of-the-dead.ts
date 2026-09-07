import type { ResolvedPart, ResolvedText, ResolvedVerse } from './types';
import { getPsalmVerses } from '../psalter';
import { applyFlexaMark } from './antiphon';
import { resolveCommon } from './resolve-common';
import { getBookIncipit } from '../propers/bible-book-incipits';

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
  'V. Réquiem ætérnam * dona eis, Dómine.\nR. Et lux perpétua * lúceat eis.',
  'V. Eternal rest * grant unto them, O Lord.\nR. And let perpetual light * shine upon them.',
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

export interface LessonText {
  citation: Bilingual;
  la: string;
  en: string;
  /** The traditional "Léctio libri..."/"A reading from..." incipit. The
   * reference engine only ever prints this once per book, on the first of
   * several consecutive lessons drawn from the same source (e.g. Sancti/
   * 11-02.txt's own Lectio7 carries it before its citation, while
   * Lectio8/9, continuing the same epistle, don't repeat it) — a print
   * convention that reads fine as continuous prose, but leaves this
   * app's later lessons looking unlabeled since each one renders as its
   * own visually separate section, with a responsory in between (user,
   * 2026-11: "you missed 2 and 3 for job and 2 and 3 for the 1 cor").
   * vu deliberately repeats this label on every lesson from the same
   * source instead. */
  label?: Bilingual;
}

interface ResponsorySpec {
  r: string;
  rEn: string;
  star: string;
  starEn: string;
  vLa: string;
  vEn: string;
  extra?: string;
  extraEn?: string;
}

function responsoryText(spec: ResponsorySpec): ResolvedText {
  const laLines = [`R. ${spec.r}`, `* ${spec.star}`, `V. ${spec.vLa}`, `R. ${spec.star}`];
  const enLines = [`R. ${spec.rEn}`, `* ${spec.starEn}`, `V. ${spec.vEn}`, `R. ${spec.starEn}`];
  if (spec.extra) {
    laLines.push(`V. ${spec.extra}`, `R. Dum véneris judicáre sǽculum per ignem.`);
  }
  if (spec.extraEn) {
    enLines.push(`V. ${spec.extraEn}`, `R. When Thou shalt come to judge the world by fire.`);
  }
  return v(laLines.join('\n'), enLines.join('\n'));
}

function lessonPart(nocturn: number, lesson: LessonText, responsory: ResponsorySpec): ResolvedPart {
  return {
    kind: 'lesson',
    text: v(lesson.la, lesson.en, lesson.citation),
    nocturn,
    label: lesson.label,
    source: lesson.citation.en,
    responsory: responsoryText(responsory),
  };
}

// ---------------------------------------------------------------------
// Matins
// ---------------------------------------------------------------------

const MATINS_INVITATORY = ant('Regem, cui ómnia vivunt, * Veníte adorémus.', 'Unto the Eternal King all live. * O come, let us worship Him.');

const NOCTURN1_ANTIPHONS = [
  ant('Dírige, * Dómine, Deus meus, in conspéctu tuo viam meam.', 'Make my way straight before thy face, * O Lord my God.'),
  ant(
    'Convértere, * Dómine, et éripe ánimam meam: quóniam non est in morte, qui memor sit tui.',
    "Return, O Lord, deliver my soul: * O save me for thy mercy's sake.",
  ),
  ant(
    'Nequándo rápiat * ut leo ánimam meam, dum non est qui rédimat, neque qui salvum fáciat.',
    'Lest he tear my soul like a lion, * while there is none to deliver, or to save.',
  ),
];
const NOCTURN1_VERSICLE = versicle('A porta ínferi.', 'From the gates of hell.', 'Erue, Dómine, ánimas eórum.', 'Deliver their souls, O Lord.');

const NOCTURN2_ANTIPHONS = [
  ant('In loco páscuæ * ibi me collocávit.', 'He maketh me to lie down * in green pastures.'),
  ant(
    'Delícta * juventútis meæ, et ignorántias meas ne memíneris, Dómine.',
    'Lord, remember not the sins of my youth, * nor my transgressions.',
  ),
  ant('Credo vidére * bona Dómini in terra vivéntium.', 'I believe that I shall yet see the goodness of the Lord * in the land of the living.'),
];
const NOCTURN2_VERSICLE = versicle(
  'Cóllocet eos Dóminus cum princípibus.',
  'May the Lord set them with princes.',
  'Cum princípibus pópuli sui.',
  'Even with the princes of his people.',
);

const NOCTURN3_ANTIPHONS = [
  ant(
    'Compláceat tibi, Dómine, ut erípias me: * Dómine, ad adjuvándum me réspice.',
    'Be pleased, O Lord, to deliver me: * O Lord, look upon me to help me.',
  ),
  ant('Sana, Dómine, * ánimam meam, quia peccávi tibi.', 'Lord, heal my soul; * for I have sinned against thee.'),
  ant(
    'Sitívit * ánima mea ad Deum vivum: quando véniam, et apparébo ante fáciem Dómini?',
    'My soul thirsteth for the living God; * when shall I come and appear before God?',
  ),
];
const NOCTURN3_VERSICLE = versicle(
  'Ne tradas béstiis ánimas confiténtes tibi.',
  'O deliver not unto beasts the souls of them that praise thee!',
  'Et ánimas páuperum tuórum ne obliviscáris in finem.',
  'And forget not the souls of thy poor for ever.',
);

/** Commune C9's own default Nocturn 1 lessons (Job 7/10) — fixed, never
 * overridden by any occasion (All Souls' Day uses these unchanged too). */
const NOCTURN1_LESSONS: [LessonText, ResponsorySpec][] = [
  [
    { citation: { la: 'Job 7:16-21', en: 'Job 7:16-21' },
      label: getBookIncipit('job'),
      la: 'Parce mihi, Dómine; nihil enim sunt dies mei. Quid est homo, quia magníficas eum? aut quid appónis erga eum cor tuum? Vísitas eum dilúculo, et súbito probas illum. Usquequo non parcis mihi, nec dimíttis me, ut glútiam salívam meam? Peccávi, quid fáciam tibi, o custos hóminum? quare posuísti me contrárium tibi, et factus sum mihimetípsi gravis? Cur non tollis peccátum meum, et quare non aufers iniquitátem meam? Ecce nunc in púlvere dórmiam: et, si mane me quæsíeris, non subsístam.',
      en: "Spare me, for my days are nothing. What is a man that thou shouldst magnify him? or why dost thou set thy heart upon him? Thou visitest him early in the morning, and thou provest him suddenly. How long wilt thou not spare me, nor suffer me to swallow down my spittle? I have sinned: what shall I do to thee, O keeper of men? why hast thou set me opposite to thee, and I am become burdensome to myself? Why dost thou not remove my sin, and why dost thou not take away my iniquity? Behold now I shall sleep in the dust: and if thou seek me in the morning, I shall not be." },
    { r: 'Credo quod Redémptor meus vivit, et in novíssimo die de terra surrectúrus sum,',
      rEn: 'I believe that my Redeemer liveth, and that I shall stand up from the earth at the latter day,',
      star: 'Et in carne mea vidébo Deum Salvatórem meum.',
      starEn: 'And in my flesh shall I see God my Saviour.',
      vLa: 'Quem visúrus sum ego ipse, et non álius; et óculi mei conspectúri sunt.',
      vEn: 'Whom I shall see for myself, and mine eyes shall behold, and not another.' },
  ],
  [
    { citation: { la: 'Job 10:1-7', en: 'Job 10:1-7' },
      label: getBookIncipit('job'),
      la: 'Tædet ánimam meam vitæ meæ; dimíttam advérsum me elóquium meum: loquar in amaritúdine ánimæ meæ. Dicam Deo: Noli me condemnáre; índica mihi cur me ita júdices. Numquid bonum tibi vidétur, si calumniéris me, et ópprimas me opus mánuum tuárum, et consílium impiórum ádjuves? Numquid óculi cárnei tibi sunt? aut sicut videt homo, et tu vidébis? Numquid sicut dies hóminis dies tui, et anni tui sicut humána sunt témpora, ut quæras iniquitátem meam, et peccátum meum scrutéris, et scias quia nihil ímpium fécerim, cum sit nemo qui de manu tua possit erúere?',
      en: 'My soul is weary of my life, I will let go my speech against myself, I will speak in the bitterness of my soul. I will say to God: Do not condemn me: tell me why thou judgest me so. Doth it seem good to thee that thou shouldst calumniate me, and oppress me, the work of thy own hands, and help the counsel of the wicked? Hast thou eyes of flesh: or, shalt thou see as man seeth? Are thy days as the days of man, and are thy years as the times of men: That thou shouldst inquire after my iniquity, and search after my sin? And shouldst know that I have done no wicked thing, whereas there is no man that can deliver out of thy hand.' },
    { r: 'Qui Lázarum resuscitásti a monuménto fœ́tidum,',
      rEn: 'Thou Who didst call up Lazarus from the grave after that he had begun to stink,',
      star: 'Tu eis, Dómine, dona réquiem, et locum indulgéntiæ.',
      starEn: 'Do Thou, O Lord, grant them rest and a place of forgiveness.',
      vLa: 'Qui ventúrus es judicáre vivos et mórtuos, et sǽculum per ignem.',
      vEn: 'Thou Who shalt come to judge the quick and dead, and the world by fire.' },
  ],
  [
    { citation: { la: 'Job 10:8-12', en: 'Job 10:8-12' },
      label: getBookIncipit('job'),
      la: 'Manus tuæ fecérunt me, et plasmavérunt me totum in circúitu: et sic repénte præcípitas me? Meménto, quæso, quod sicut lutum féceris me, et in púlverem redúces me. Nonne sicut lac mulsísti me, et sicut cáseum me coagulásti? Pelle et cárnibus vestísti me; óssibus et nervis compegísti me. Vitam et misericórdiam tribuísti mihi, et visitátio tua custodívit spíritum meum.',
      en: 'Thy hands have made me, and fashioned me wholly round about, and dost thou thus cast me down headlong on a sudden? Remember, I beseech thee, that thou hast made me as the clay, and thou wilt bring me into dust again. Hast thou not milked me as milk, and curdled me like cheese? Thou hast clothed me with skin and flesh: thou hast put me together with bones and sinews: Thou hast granted me life and mercy, and thy visitation hath preserved my spirit.' },
    { r: 'Dómine, quando véneris judicáre terram, ubi me abscóndam a vultu iræ tuæ?',
      rEn: 'Lord, when Thou comest to judge the earth, where shall I hide myself from the face of thy wrath?',
      star: 'Quia peccávi nimis in vita mea.',
      starEn: 'For I have sinned greatly in my life.',
      vLa: 'Commíssa mea pavésco, et ante te erubésco: dum véneris judicáre, noli me condemnáre.',
      vEn: 'I dread my sins, I blush before thee: when Thou comest to judge, condemn me not.' },
  ],
];

/** Commune C9's own default Nocturn 2 lessons (Job 13/14) — the plain
 * votive/private-Requiem default; All Souls' Day overrides this with
 * Augustine's "De cura pro mortuis gerenda" instead (see all-souls.ts).
 * The responsories, however, are the SAME Commune C9 Responsory4-6
 * regardless of which lesson prose accompanies them — confirmed while
 * building the first version of this office (All Souls' own Augustine
 * lessons pair with these exact responsories in the reference source). */
const NOCTURN2_DEFAULT_LESSONS: [LessonText, ResponsorySpec][] = [
  [
    { citation: { la: 'Job 13:22-28', en: 'Job 13:22-28' },
      la: 'Respónde mihi. Quantas hábeo iniquitátes et peccáta? scélera mea et delícta osténde mihi. Cur fáciem tuam abscóndis, et arbitráris me inimícum tuum? Contra fólium, quod vento rápitur, osténdis poténtiam tuam, et stípulam siccam perséqueris: scribis enim contra me amaritúdines, et consúmere me vis peccátis adolescéntiæ meæ. Posuísti in nervo pedem meum, et observásti omnes sémitas meas, et vestígia pedum meórum considerásti: qui quasi putrédo consuméndus sum, et quasi vestiméntum quod coméditur a tínea.',
      en: 'Answer me. How many are my iniquities and sins? make me know my crimes and offences. Why hidest thou thy face, and thinkest me thy enemy? Against a leaf, that is carried away with the wind, thou showest thy power, and thou pursuest a dry straw. For thou writest bitter things against me, and wilt consume me for the sins of my youth. Thou hast put my feet in the stocks, and hast observed all my paths, and hast considered the steps of my feet: Who am to be consumed as rottenness, and as a garment that is moth-eaten.' },
    { r: 'Meménto mei, Deus, quia ventus est vita mea,',
      rEn: 'Remember, O God, that my life is wind,',
      star: 'Nec aspíciat me visus hóminis.',
      starEn: 'The eye of him that hath seen me shall see me no more.',
      vLa: 'De profúndis clamávi ad te, Dómine: Dómine, exáudi vocem meam.',
      vEn: 'Out of the depths have I cried unto thee, O Lord! Lord, hear my voice.' },
  ],
  [
    { citation: { la: 'Job 14:1-6', en: 'Job 14:1-6' },
      la: 'Homo natus de mulíere, brevi vivens témpore, replétur multis misériis. Qui quasi flos egréditur et contéritur, et fugit velut umbra, et nunquam in eódem statu pérmanet. Et dignum ducis super hujuscémodi aperíre óculos tuos, et addúcere eum tecum in judícium? Quis potest fácere mundum de immúndo concéptum sémine? Nonne tu qui solus es? Breves dies hóminis sunt: númerus ménsium ejus apud te est: constituísti términos ejus, qui præteríri non póterunt. Recéde páululum ab eo, ut quiéscat, donec optáta véniat, sicut mercenárii, dies ejus.',
      en: 'Man born of a woman, living for a short time, is filled with many miseries. Who cometh forth like a flower, and is destroyed, and fleeth as a shadow, and never continueth in the same state. And dost thou think it meet to open thy eyes upon such an one, and to bring him into judgment with thee? Who can make him clean that is conceived of unclean seed? is it not thou who only art? The days of man are short, and the number of his months is with thee: thou hast appointed his bounds which cannot be passed. Depart a little from him, that he may rest, until his wished for day come, as that of the hireling.' },
    { r: 'Hei mihi, Dómine, quia peccávi nimis in vita mea: Quid fáciam, miser? ubi fúgiam, nisi ad te, Deus meus?',
      rEn: 'Woe is me, O Lord! for I have sinned greatly in my life. I am smitten: what shall I do? Whither shall I flee but unto thee, O my God?',
      star: 'Miserére mei, dum véneris in novíssimo die.',
      starEn: 'Have mercy upon me, when Thou comest at the latter day.',
      vLa: 'Anima mea turbáta est valde, sed tu, Dómine, succúrre ei.',
      vEn: 'My soul is sore vexed, but Thou, O Lord, help me.' },
  ],
  [
    { citation: { la: 'Job 14:13-16', en: 'Job 14:13-16' },
      la: 'Quis mihi hoc tríbuat, ut in inférno prótegas me, et abscóndas me donec pertránseat furor tuus, et constítuas mihi tempus in quo recordéris mei? Putásne mórtuus homo rursum vivat? cunctis diébus quibus nunc mílito, expécto donec véniat immutátio mea. Vocábis me, et ego respondébo tibi: óperi mánuum tuárum porríges déxteram. Tu quidem gressus meos dinumerásti: sed parce peccátis meis.',
      en: 'Who will grant me this, that thou mayst protect me in hell, and hide me till thy wrath pass, and appoint me a time when thou wilt remember me? Shall man that is dead, thinkest thou, live again? all the days in which I am now in warfare, I expect until my change come. Thou shalt call me, and I will answer thee: to the work of thy hands thou shalt reach out thy right hand. Thou indeed hast numbered my steps, but spare my sins.' },
    { r: 'Ne recordéris peccáta mea, Dómine,',
      rEn: 'Hold not my sins in remembrance, O Lord,',
      star: 'Dum véneris judicáre sǽculum per ignem.',
      starEn: 'When thou comest to judge the world by fire.',
      vLa: 'Dírige, Dómine, Deus meus, in conspéctu tuo viam meam.',
      vEn: 'Make my way straight before thy face, O Lord my God.',
      extra: 'Réquiem ætérnam dona eis, Dómine: et lux perpétua lúceat eis.',
      extraEn: 'Eternal rest grant unto them, O Lord: and let perpetual light shine upon them.' },
  ],
];

/** Commune C9's own default Nocturn 3 lessons (Job 17/19/10:18-22) — the
 * plain votive/private-Requiem default; All Souls' Day overrides this
 * with 1 Corinthians 15 instead (see all-souls.ts). Same
 * responsory-reuse note as Nocturn 2 above applies (Responsory7-9 are
 * shared regardless of lesson text). */
const NOCTURN3_DEFAULT_LESSONS: [LessonText, ResponsorySpec][] = [
  [
    { citation: { la: 'Job 17:1-3,11-15', en: 'Job 17:1-3,11-15' },
      la: 'Spíritus meus attenuábitur; dies mei breviabúntur: et solum mihi súperest sepúlchrum. Non peccávi, et in amaritudínibus morátur óculus meus. Líbera me, Dómine, et pone me juxta te, et cujúsvis manus pugnet contra me. Dies mei transiérunt; cogitatiónes meæ dissipátæ sunt, torquéntes cor meum. Noctem vertérunt in diem, et rursum post ténebras spero lucem. Si sustinúero, inférnus domus mea est, et in ténebris stravi léctulum meum. Putrédini dixi: Pater meus es; Mater mea, et soror mea, vérmibus. Ubi est ergo nunc præstolátio mea? et patiéntiam meam quis consíderat?',
      en: 'My spirit shall be wasted, my days shall be shortened, and only the grave remaineth for me. I have not sinned, and my eye abideth in bitterness. Deliver me O Lord, and set me beside thee, and let any man’s hand fight against me. My days have passed away, my thoughts are dissipated, tormenting my heart. They have turned night into day, and after darkness I hope for light again. If I wait hell is my house, and I have made my bed in darkness. If I have said to rottenness: thou art my father; to worms, my mother and my sister. Where is now then my expectation, and who considereth my patience?' },
    { r: 'Peccántem me cotídie, et non me pœniténtem, timor mortis contúrbat me:',
      rEn: 'Forasmuch as I sin daily, and repent not, the fear of death troubleth me:',
      star: 'Quia in inférno nulla est redémptio, miserére mei, Deus, et salva me.',
      starEn: 'O God, have mercy upon me, and save me, for in hell there is no redemption.',
      vLa: 'Deus, in nómine tuo salvum me fac, et in virtúte tua líbera me.',
      vEn: 'Save me, O God, by thy name, and judge me in thy strength.' },
  ],
  [
    { citation: { la: 'Job 19:20-27', en: 'Job 19:20-27' },
      la: 'Pelli meæ, consúmptis cárnibus, adhǽsit os meum, et derelícta sunt tantúmmodo lábia circa dentes meos. Miserémini mei, miserémini mei saltem vos, amíci mei, quia manus Dómini tétigit me. Quare persequímini me sicut Deus, et cárnibus meis saturámini? Quis mihi tríbuat ut scribántur sermónes mei? quis mihi det ut exaréntur in libro stylo férreo et plumbi lámina, vel celte sculpántur in sílice? Scio enim quod redémptor meus vivit, et in novíssimo die de terra surrectúrus sum: et rursum circúmdabor pelle mea, et in carne mea vidébo Deum meum: quem visúrus sum ego ipse, et óculi mei conspectúri sunt, et non álius: repósita est hæc spes mea in sinu meo.',
      en: 'The flesh being consumed. My bone hath cleaved to my skin, and nothing but lips are left about my teeth. Have pity on me, have pity on me, at least you my friends, because the hand of the Lord hath touched me. Why do you persecute me as God, and glut yourselves with my flesh? Who will grant me that my words may be written? Who will grant me that they may be marked down in a book? With an iron pen and in a plate of lead, or else be graven with an instrument in flint stone. For I know that my Redeemer liveth, and in the last day I shall rise out of the earth. And I shall be clothed again with my skin, and in my flesh I will see my God. Whom I myself shall see, and my eyes shall behold, and not another: this my hope is laid up in my bosom.' },
    { r: 'Dómine, secúndum actum meum noli me judicáre: nihil dignum in conspéctu tuo egi; ídeo déprecor majestátem tuam,',
      rEn: 'O Lord, judge me not according to my works; for I have done nothing that can be counted in respect of thee. I beseech thy majesty therefore, that thou wouldest',
      star: 'Ut tu, Deus, déleas iniquitátem meam.',
      starEn: 'Blot out my transgressions, O God.',
      vLa: 'Amplius lava me, Dómine, ab injustítia mea, et a delícto meo munda me.',
      vEn: 'Lord, wash me thoroughly from mine iniquity and cleanse me from my sin.' },
  ],
  [
    { citation: { la: 'Job 10:18-22', en: 'Job 10:18-22' },
      la: 'Quare de vulva eduxísti me? qui útinam consúmptus essem, ne óculus me vidéret. Fuíssem quasi non essem, de útero translátus ad túmulum. Numquid non páucitas diérum meórum finiétur brevi? dimítte ergo me, ut plangam páululum dolórem meum, ántequam vadam, et non revértar, ad terram tenebrósam, et opértam mortis calígine: terram misériæ et tenebrárum, ubi umbra mortis et nullus ordo, sed sempitérnus horror inhábitat.',
      en: 'Why didst thou bring me forth out of the womb: O that I had been consumed that eye might not see me! I should have been as if I had not been, carried from the womb to the grave. Shall not the fewness of my days be ended shortly? suffer me, therefore, that I may lament my sorrow a little: Before I go, and return no more, to a land that is dark and covered with the mist of death: A land of misery and darkness, where the shadow of death, and no order, but everlasting horror dwelleth.' },
    { r: 'Líbera me, Dómine, de morte ætérna in die illa treménda,',
      rEn: 'Deliver me, O Lord, from eternal death in that awful day,',
      star: 'Quando cæli movéndi sunt et terra,',
      starEn: 'when the heavens and the earth shall be shaken,',
      vLa: 'Tremens factus sum ego et tímeo, dum discússio vénerit atque ventúra ira.',
      vEn: 'Quaking and dread take hold upon me, when I look for the coming of the trial and the wrath to come.',
      extra: 'Dies illa, dies iræ, calamitátis et misériæ, dies magna et amára valde.\nDum véneris judicáre sǽculum per ignem.',
      extraEn: 'That day is a day of wrath, of wasteness and desolation, a great day and exceeding bitter.\nWhen Thou shalt come to judge the world by fire.' },
  ],
];

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

function matinsNocturn(
  nocturnNumber: number,
  antiphons: ResolvedText[],
  psalmNumbers: number[],
  versicleText: ResolvedText,
  lessons: [LessonText, ResponsorySpec][],
): ResolvedPart[] {
  const psalms = psalmNumbers.map((n, i) => psalmWithAntiphon(n, undefined, antiphons[i]));
  return [
    { kind: 'section-heading', label: `Nocturn ${['I', 'II', 'III'][nocturnNumber - 1]}` },
    { kind: 'nocturn-psalmody', nocturn: nocturnNumber, psalms },
    { kind: 'versicle', text: versicleText },
    ...lessons.map(([lesson, responsory]) => lessonPart(nocturnNumber, lesson, responsory)),
  ];
}

export interface MatinsOverrides {
  /** Defaults to Commune C9's own Job 13/14 lessons when omitted. */
  nocturn2Lessons?: LessonText[];
  /** Defaults to Commune C9's own Job 17/19/10:18-22 lessons when omitted. */
  nocturn3Lessons?: LessonText[];
  /** Defaults to the generic "Fidélium, Deus..." collect when omitted. */
  collect?: ResolvedText;
}

/** No Te Deum on any occasion this office is said (a plain 9-lesson,
 * no-Sunday/no-Duplex+ day in the calendar's usual sense doesn't apply
 * here at all — this bypasses that machinery entirely). */
export function buildMatinsParts(overrides: MatinsOverrides = {}): ResolvedPart[] {
  const nocturn2 = overrides.nocturn2Lessons
    ? overrides.nocturn2Lessons.map((lesson, i) => [lesson, NOCTURN2_DEFAULT_LESSONS[i]![1]] as [LessonText, ResponsorySpec])
    : NOCTURN2_DEFAULT_LESSONS;
  const nocturn3 = overrides.nocturn3Lessons
    ? overrides.nocturn3Lessons.map((lesson, i) => [lesson, NOCTURN3_DEFAULT_LESSONS[i]![1]] as [LessonText, ResponsorySpec])
    : NOCTURN3_DEFAULT_LESSONS;
  return [
    { kind: 'section-heading', label: 'Invitatory' },
    psalmWithAntiphon(94, undefined, MATINS_INVITATORY),
    { kind: 'antiphon', text: MATINS_INVITATORY },
    ...matinsNocturn(1, NOCTURN1_ANTIPHONS, [5, 6, 7], NOCTURN1_VERSICLE, NOCTURN1_LESSONS),
    ...matinsNocturn(2, NOCTURN2_ANTIPHONS, [22, 24, 26], NOCTURN2_VERSICLE, nocturn2),
    ...matinsNocturn(3, NOCTURN3_ANTIPHONS, [39, 40, 41], NOCTURN3_VERSICLE, nocturn3),
    { kind: 'prayer', text: overrides.collect ?? GENERIC_MATINS_COLLECT },
    CONCLUSIO,
  ];
}

// ---------------------------------------------------------------------
// Lauds
// ---------------------------------------------------------------------

const HEZEKIAH_CANTICLE = v(
  'Ego dixi: In dimídio diérum meórum * vadam ad portas ínferi. Quæsívi resíduum annórum meórum. * Dixi: Non vidébo Dóminum Deum in terra vivéntium. Non aspíciam hóminem ultra, * et habitatórem quiétis. Generátio mea abláta est, et convolúta est a me, * quasi tabernáculum pastórum. Præcísa est velut a texénte, vita mea: dum adhuc ordírer, succídit me: * de mane usque ad vésperam fínies me. Sperábam usque ad mane, * quasi leo sic contrívit ómnia ossa mea: de mane usque ad vésperam fínies me: * sicut pullus hirúndinis sic clamábo, meditábor ut colúmba: Attenuáti sunt óculi mei, * suspiciéntes in excélsum. Dómine, vim pátior, respónde pro me. * Quid dicam, aut quid respondébit mihi, cum ipse fécerit? Recogitábo tibi omnes annos meos * in amaritúdine ánimæ meæ. Dómine, si sic vívitur, et in tálibus vita spíritus mei, corrípies me, et vivificábis me. * Ecce, in pace amaritúdo mea amaríssima: Tu autem eruísti ánimam meam ut non períret: * proiecísti post tergum tuum ómnia peccáta mea. Quia non inférnus confitébitur tibi, neque mors laudábit te: * non exspectábunt qui descéndunt in lacum, veritátem tuam. Vivens vivens ipse confitébitur tibi, sicut et ego hódie: * pater fíliis notam fáciet veritátem tuam. Dómine, salvum me fac * et psalmos nostros cantábimus cunctis diébus vitæ nostræ in domo Dómini.',
  'I said: In the midst of my days * I shall go to the gates of hell: I sought for the residue of my years. * I said: I shall not see the Lord God in the land of the living. I shall behold man no more, * nor the inhabitant of rest. My generation is at an end, and it is rolled away from me, * as a shepherd’s tent. My life is cut off, as by a weaver: whilst I was yet but beginning, he cut me off: * from morning even to night thou wilt make an end of me. I hoped till morning, * as a lion so hath he broken all my bones: from morning even to night thou wilt make an end of me. * I will cry like a young swallow, I will meditate like a dove: My eyes are weakened * looking upward: Lord, I suffer violence, answer thou for me. * What shall I say, or what shall he answer for me, whereas he himself hath done it? I will recount to thee all my years * in the bitterness of my soul. O Lord, if man’s life be such, and the life of my spirit be in such things as these, thou shalt correct me, and make me to live. * Behold in peace is my bitterness most bitter: But thou hast delivered my soul that it should not perish, * thou hast cast all my sins behind thy back. For hell shall not confess to thee, neither shall death praise thee: * nor shall they that go down into the pit, look for thy truth. The living, the living, he shall give praise to thee, as I do this day: * the father shall make thy truth known to the children. O Lord, save me, and we will sing our psalms all the days of our life * in the house of the Lord.',
  { la: 'Isa 38:10-24', en: 'Isa 38:10-24' },
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
