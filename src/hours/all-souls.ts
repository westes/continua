import type { ResolvedPart, ResolvedText } from './types';
import { getMartyrologyEntryFor } from '../martyrology';
import * as office from './office-of-the-dead';
import { v, versicle, type Bilingual, type LessonText } from './office-of-the-dead';

/**
 * All Souls' Day (Nov 2) — the Office of the Dead, layered on top of the
 * reusable engine in hours/office-of-the-dead.ts. This file holds only
 * what's genuinely specific to *this* occasion of the office: Matins'
 * Lessons 4-9 (Augustine + 1 Corinthians, replacing the engine's own Job
 * default), the day's own Martyrology introduction, and the two
 * day-specific collects at Prime/Compline (Sancti/11-02.txt's own
 * `[Oratio mortuorum1]`/`[Oratio mortuorum2]` — distinct wording from
 * Commune C9's generic `Oratio1`/`Oratio2`, confirmed while building the
 * first version of this office: these two are NOT reused anywhere else in
 * the source, unlike the Matins/Terce/Sext/None and Lauds/Vespers
 * collects, which are Commune C9's own and so live in the engine instead).
 *
 * This is currently the engine's only caller — see hours/
 * office-of-the-dead.ts's own header and the vu_office_of_the_dead_scope
 * memory for why that's an implementation state, not a design boundary: a
 * genuinely reusable Office-for-the-Dead mechanism (funerals,
 * anniversaries) is real wanted future scope. No new calendar trigger,
 * route, or per-day override table is added here today — only Nov 2
 * exercises this file, exactly as before this file was split in two.
 *
 * Live-verified against the reference engine's "Rubrics 1960 - 1960"
 * rendering (2026-11-02) for exact structure/psalm-sets/wording at every
 * hour — see office-of-the-dead.ts's own header for the two corrections
 * that verification caught (Lauds' "Ps 222" tag, Compline's dropped 4th
 * special psalm).
 */
export function isAllSouls(date: string): boolean {
  return date.slice(5) === '11-02';
}

export const REQUIEM_GLORIA_PATRI = office.REQUIEM_GLORIA_PATRI;

export const DAY_LABEL: Bilingual = {
  la: 'In Commemoratióne Ómnium Fidélium Defunctórum',
  en: "The Commemoration of All Souls' Day",
};

// ---------------------------------------------------------------------
// Matins — Lessons 4-9 are All Souls' Day's own substitution for the
// engine's generic Job default (Nocturn 1 and all 9 responsories are
// unchanged from the engine).
// ---------------------------------------------------------------------

const AUGUSTINE_LESSONS: LessonText[] = [
  {
    citation: { la: 'S. Augustínus, De cura pro mórtuis geréndā, cap. 2-3', en: 'St. Augustine, On the Care for the Dead, ch. 2-3' },
    la: "Curátio fúneris, condítio sepultúræ, pompa exsequiárum magis sunt vivórum solácia quam subsídia mortuórum. Nec ídeo tamen contemnénda et abiciénda sunt córpora defunctórum, maximéque justórum ac fidélium, quibus tamquam órganis et vasis ad ómnia bona ópera sancte usus est spíritus. Si enim patérna vestis et ánulus, ac si quid hujúsmodi, tanto cárius est pósteris, quanto erga paréntes major afféctus; nullo modo ipsa spernénda sunt córpora, quæ útique multo familiárius atque conjúnctius quam quǽlibet induménta gestámus. Hæc enim non ad ornaméntum vel adjutórium, quod adhibétur extrínsecus, sed ad ipsam natúram hóminis pértinent. Unde et antiquórum justórum fúnera officiósa pietáte curáta sunt, et exséquiæ celebrátæ, et sepultúra provísa; ipsíque, cum víverent, de sepeliéndis vel étiam transferéndis suis corpóribus fíliis mandavérunt.",
    en: "The care taken over a man's funeral, the manner of his burial, the pomp of his obsequies, are more a consolation to the living than an aid to the dead. Yet it does not follow that the bodies of the departed, above all of just and faithful men, whose bodies the spirit has used holily as organs and vessels for all good works, are to be despised and cast aside. For if a father's garment and ring, and whatever such things, are the more dear to their posterity as their affection towards their parents was the greater, in no way should the bodies themselves be spurned, which we wear in truth more familiarly and closely than any garment. For these belong not to any adornment or aid applied from without, but to man's very nature. Whence also the funerals of the just men of old were tended with dutiful piety, their obsequies celebrated, and burial provided; and they themselves, while living, gave charge to their sons touching the burial, or even the removal, of their bodies.",
  },
  {
    citation: { la: 'S. Augustínus, De cura pro mórtuis geréndā, cap. 4', en: 'St. Augustine, On the Care for the Dead, ch. 4' },
    la: 'Recordántis et precántis afféctus cum defúnctis a fidélibus caríssimis exhibétur, eum prodésse non dúbium est iis, qui cum in córpore víverent, tália sibi post hanc vitam prodésse meruérunt. Verum, etsi áliqua necéssitas vel humári córpora, vel in sacris locis humári nulla data facultáte permíttat, non sunt prætermitténdæ supplicatiónes pro spirítibus mortuórum: quas faciéndas pro ómnibus in christiána et cathólica societáte defúnctis, étiam tácitis eórum nomínibus, sub generáli commemoratióne suscépit Ecclésia; ut quibus ad ista desunt paréntes, aut fílii, aut quicúmque cognáti vel amíci, ab una eis exhibeántur pia matre commúni. Si autem deéssent istæ supplicatiónes, quæ fiunt recta fide ac pietáte pro mórtuis, puto quod nihil prodésset spirítibus eórum, quámlibet in locis sanctis exánima córpora poneréntur.',
    en: 'When this affection of remembrance and prayer is shown toward the departed by those most dear to them among the faithful, there is no doubt it profits those who, while they lived in the body, merited that such things should profit them after this life. But even should some necessity, through lack of all opportunity, not allow bodies to be buried, or buried in holy places, the supplications for the spirits of the dead are not to be omitted: which the Church has taken upon herself to make for all the departed in Christian and catholic fellowship, even without naming them, under a general commemoration; so that those who lack parents, or sons, or any kindred or friends for these offices, may still have them rendered by the one common, pious mother. But were these supplications, made with right faith and piety for the dead, to be lacking, I think it would profit their spirits nothing, however their lifeless bodies were laid in holy places.',
  },
  {
    citation: { la: 'S. Augustínus, De cura pro mórtuis geréndā, cap. 18', en: 'St. Augustine, On the Care for the Dead, ch. 18' },
    la: 'Quæ cum ita sint, non existimémus ad mórtuos, pro quibus curam gérimus, perveníre, nisi quod pro eis sive altáris, sive oratiónum, sive eleemosynárum sacrifíciis solémniter supplicámus: quamvis non pro quibus fiunt, ómnibus prosint; sed iis tantum pro quibus, dum vivunt, comparátur, ut prosint. Sed quia non discérnimus qui sunt, opórtet ea pro regenerátis ómnibus fácere, ut nullus eórum prætermittátur, ad quos hæc benefícia possint et débeant perveníre. Mélius enim supérerunt ista eis, quibus nec obsunt nec prosunt; quam eis déerunt, quibus prosunt. Diligéntius tamen facit hæc quisque pro necessáriis suis, quo pro illo fiat simíliter a suis. Córpori autem humándo quidquid impénditur, non est præsídium salútis, sed humanitátis offícium, secúndum afféctum quo nemo unquam carnem suam ódio habet. Unde opórtet ut quam potest pro carne próximi curam gerat, cum ille inde recésserit, qui gerébat. Et si hæc fáciunt, qui carnis resurrectiónem non credunt, quanto magis debent fácere qui credunt; ut córpori mórtuo, sed tamen resurrectúro et in æternitáte mansúro, impénsum ejúsmodi offícium sit étiam quodámmodo ejúsdem fídei testimónium!',
    en: 'This being so, let us not think that anything reaches the dead for whom we care, except what we solemnly beseech for them through the sacrifices either of the altar, or of prayers, or of alms: though these do not profit all for whom they are offered, but only those for whom, while they lived, it was obtained that they should profit. But since we cannot discern who these are, it is fitting to do these things for all the regenerate, that none of them be passed over to whom these benefits may and ought to reach. For it is better that these things be done superfluously for those whom they neither hinder nor help, than that they be lacking to those whom they help. Yet each man does these things more diligently for his own kin, that the like may be done for him by his own. But whatever is spent on the burying of the body is no aid to salvation, but an office of humanity, according to that affection by which no one ever hated his own flesh. Whence it is fitting that a man take what care he can for the flesh of his neighbor, once he who bore it has departed. And if those who do not believe in the resurrection of the flesh do these things, how much more ought those to do so who believe; that this office, rendered to a body dead but yet to rise again and to abide in eternity, may also be in some sort a testimony of that same faith!',
  },
];

const CORINTHIANS_LESSONS: LessonText[] = [
  {
    citation: { la: '1 Cor 15:12-22', en: '1 Cor 15:12-22' },
    la: 'Si Christus prædicátur quod resurréxit a mórtuis, quómodo quidam dicunt in vobis, quóniam resurréctio mortuórum non est? Si autem resurréctio mortuórum non est: neque Christus resurréxit. Si autem Christus non resurréxit, inánis est ergo prædicátio nostra, inánis est et fides vestra: invenímur autem et falsi testes Dei: quóniam testimónium díximus advérsus Deum quod suscitáverit Christum, quem non suscitávit, si mórtui non resúrgunt. Nam si mórtui non resúrgunt, neque Christus resurréxit. Quod si Christus non resurréxit, vana est fides vestra: adhuc enim estis in peccátis vestris. Ergo et qui dormiérunt in Christo, periérunt. Si in hac vita tantum in Christo sperántes sumus, miserabilióres sumus ómnibus homínibus. Nunc autem Christus resurréxit a mórtuis primítiæ dormiéntium, quóniam quidem per hóminem mors, et per hóminem resurréctio mortuórum. Et sicut in Adam omnes moriúntur, ita et in Christo omnes vivificabúntur.',
    en: 'Now if Christ be preached, that he arose again from the dead, how do some among you say, that there is no resurrection of the dead? But if there be no resurrection of the dead, then Christ is not risen again. And if Christ be not risen again, then is our preaching vain, and your faith is also vain. Yea, and we are found false witnesses of God: because we have given testimony against God, that he hath raised up Christ; whom he hath not raised up, if the dead rise not again. For if the dead rise not again, neither is Christ risen again. And if Christ be not risen again, your faith is vain, for you are yet in your sins. Then they also that are fallen asleep in Christ, are perished. If in this life only we have hope in Christ, we are of all men most miserable. But now Christ is risen from the dead, the firstfruits of them that sleep: For by a man came death, and by a man the resurrection of the dead. And as in Adam all die, so also in Christ all shall be made alive.',
  },
  {
    citation: { la: '1 Cor 15:35-44', en: '1 Cor 15:35-44' },
    la: 'Sed dicet áliquis: Quómodo resúrgunt mórtui? qualíve córpore vénient? Insípiens, tu quod séminas non vivificátur, nisi prius moriátur: et quod séminas, non corpus, quod futúrum est, séminas, sed nudum granum, ut puta trítici, aut alicújus ceterórum. Deus autem dat illi corpus sicut vult, et unicuíque séminum próprium corpus. Non omnis caro, éadem caro: sed ália quidem hóminum, ália vero pécorum, ália vólucrum, ália autem píscium. Et córpora cæléstia, et córpora terréstria: sed ália quidem cæléstium glória, ália autem terréstrium. Alia cláritas solis, ália cláritas lunæ, et ália cláritas stellárum; stella enim a stella differt in claritáte: sic et resurréctio mortuórum. Seminátur in corruptióne, surget in incorruptióne. Seminátur in ignobilitáte, surget in glória: seminátur in infirmitáte, surget in virtúte: seminátur corpus animále, surget corpus spiritále.',
    en: 'But some man will say: How do the dead rise again? or with what manner of body shall they come? Senseless man, that which thou sowest is not quickened, except it die first. And that which thou sowest, thou sowest not the body that shall be; but bare grain, as of wheat, or of some of the rest. But God giveth it a body as he will: and to every seed its proper body. All flesh is not the same flesh: but one is the flesh of men, another of beasts, another of birds, another of fishes. And there are bodies celestial, and bodies terrestrial: but, one is the glory of the celestial, and another of the terrestrial. One is the glory of the sun, another the glory of the moon, and another the glory of the stars. For star differeth from star in glory. So also is the resurrection of the dead. It is sown in corruption, it shall rise in incorruption. It is sown in dishonour, it shall rise in glory. It is sown in weakness, it shall rise in power. It is sown a natural body, it shall rise a spiritual body.',
  },
  {
    citation: { la: '1 Cor 15:51-58', en: '1 Cor 15:51-58' },
    la: 'Ecce mystérium vobis dico: Omnes quidem resurgémus, sed non omnes immutábimur. In moménto, in ictu óculi, in novíssima tuba: canet enim tuba, et mórtui resúrgent incorrúpti: et nos immutábimur. Opórtet enim corruptíbile hoc indúere incorruptiónem: et mortále hoc indúere immortalitátem. Cum autem mortále hoc indúerit immortalitátem, tunc fiet sermo, qui scriptus est: Absórpta est mors in victória. Ubi est mors victória tua? ubi est mors stímulus tuus? Stímulus autem mortis peccátum est: virtus vero peccáti lex. Deo autem grátias, qui dedit nobis victóriam per Dóminum nostrum Jesum Christum. Itaque fratres mei dilécti, stábiles estóte, et immóbiles: abundántes in ópere Dómini semper, sciéntes quod labor vester non est inánis in Dómino.',
    en: 'Behold, I tell you a mystery. We shall all indeed rise again: but we shall not all be changed. In a moment, in the twinkling of an eye, at the last trumpet: for the trumpet shall sound, and the dead shall rise again incorruptible: and we shall be changed. For this corruptible must put on incorruption; and this mortal must put on immortality. And when this mortal hath put on immortality, then shall come to pass the saying that is written: Death is swallowed up in victory. O death, where is thy victory? O death, where is thy sting? Now the sting of death is sin: and the power of sin is the law. But thanks be to God, who hath given us the victory through our Lord Jesus Christ. Therefore, my beloved brethren, be ye steadfast and unmoveable; always abounding in the work of the Lord, knowing that your labour is not in vain in the Lord.',
  },
];

export function buildMatinsParts(): ResolvedPart[] {
  return office.buildMatinsParts({ nocturn2Lessons: AUGUSTINE_LESSONS, nocturn3Lessons: CORINTHIANS_LESSONS });
}

// ---------------------------------------------------------------------
// Lauds / Vespers — the engine's own generic collect applies unchanged.
// ---------------------------------------------------------------------

export function buildLaudsParts(): ResolvedPart[] {
  return office.buildLaudsParts();
}

export function buildVespersParts(): ResolvedPart[] {
  return office.buildVespersParts();
}

// ---------------------------------------------------------------------
// Prime — All Souls' Day's own "Súpplices, Dómine" collect (Sancti/
// 11-02.txt's `[Oratio mortuorum2]`), plus the day's normal daily
// Martyrology reading (with this office's own special introduction)
// layered on after the engine's bare psalms+collect.
// ---------------------------------------------------------------------

const PRIME_COLLECT = v(
  'Súpplices, Dómine, pro animábus ómnium famulórum famularúmque tuárum preces effúndimus: ut, quidquid conversatióne contraxérunt humána, clemens indúlgeas, et pœnis eórum finem benígnus impónas. Per Dóminum nostrum Jesum Christum, Fílium tuum: qui tecum vivit et regnat in unitáte Spíritus Sancti, Deus, per ómnia sǽcula sæculórum. Amen.',
  'We suppliants, O Lord, pour forth our prayers for the souls of all thy servants and handmaids, that thou wouldst mercifully pardon whatsoever they have committed through human frailty, and graciously vouchsafe to deliver them from the pains of purgatory. Through Jesus Christ, thy Son our Lord, Who liveth and reigneth with thee, in the unity of the Holy Ghost, God, world without end. Amen.',
);

const MARTYROLOGY_VERSICLE = versicle(
  'In memória ætérna erunt justi.',
  'The just shall be in everlasting remembrance.',
  'Ab auditióne mala non timébunt.',
  'They will not fear from hearing evil.',
);

const MARTYROLOGY_COLLECT = v(
  'Deus, véniæ largítor et humánæ salútis amátor: quǽsumus cleméntiam tuam; ut ánimas ómnium fidélium qui ex hoc sǽculo transiérunt, beáta María semper Vírgine intercedénte cum ómnibus Sanctis tuis, ad perpétuæ beatitúdinis consórtium perveníre concédas. Per Christum Dóminum nostrum. Amen.',
  'O God the giver of pardon, and the lover of human salvation, we beseech thy clemency: that thou grant unto the souls of all the faithful who are departed out of this world, blessed Mary ever Virgin making intercession with all thy Saints, to come to the fellowship of eternal blessedness. Through Christ our Lord. Amen.',
);

const MARTYROLOGY_INTRO: Bilingual = {
  la: 'Hac die Commemorátio ómnium Fidélium Defunctórum; in qua commúnis pia Mater Ecclésia, postquam univérsos fílios suos iam in cælo lætántes cóngruis stúduit celebráre præcóniis, mox et omnes adhuc in Purgatório geméntes válidis apud Dóminum et Sponsum Christum satágit suffrágiis adiuváre, ut quam cítius váleant ad societátem supernórum cívium perveníre.',
  en: 'On this day, the Commemoration of all the Faithful Departed, on which day Holy Church, their common Mother, after due diligence to celebrate with fitting praise all her children who now rejoice in heaven, doth strive also to assist by her prayers all them that suffer still in Purgatory, which are of avail before Christ her Lord and Spouse, in order that as speedily as possible they may join the society of the citizens on high.',
};

export function buildPrimeParts(date: string): ResolvedPart[] {
  const parts: ResolvedPart[] = office.buildPrimeParts(PRIME_COLLECT);
  const entry = getMartyrologyEntryFor(date);
  const introduced: ResolvedText = {
    text: {
      la: entry.text.la ? `${MARTYROLOGY_INTRO.la}\n\n${entry.text.la}` : entry.text.la,
      en: entry.text.en ? `${MARTYROLOGY_INTRO.en}\n\n${entry.text.en}` : entry.text.en,
    },
    status: entry.status,
  };
  parts.push({ kind: 'lesson', text: introduced, label: 'Martyrology' });
  parts.push({ kind: 'versicle', text: MARTYROLOGY_VERSICLE });
  parts.push({ kind: 'prayer', text: MARTYROLOGY_COLLECT });
  parts.push(office.CONCLUSIO);
  return parts;
}

// ---------------------------------------------------------------------
// Terce / Sext / None — the engine's own generic collect applies
// unchanged (Sancti/11-02's own `[Oratio mortuorum]` is byte-identical to
// Commune C9's `Oratio 2`).
// ---------------------------------------------------------------------

export function buildTerceParts(): ResolvedPart[] {
  return office.buildTerceParts();
}

export function buildSextParts(): ResolvedPart[] {
  return office.buildSextParts();
}

export function buildNoneParts(): ResolvedPart[] {
  return office.buildNoneParts();
}

// ---------------------------------------------------------------------
// Compline — All Souls' Day's own "Propitiáre, quǽsumus" collect
// (Sancti/11-02.txt's `[Oratio mortuorum1]`).
// ---------------------------------------------------------------------

const COMPLINE_COLLECT = v(
  'Propitiáre, quǽsumus, Dómine, animábus ómnium famulórum famularúmque tuárum, pro quibus majestátem tuam supplíciter exorámus: ut, per hæc piæ deprecatiónis offícia, perveníre mereántur ad réquiem sempitérnam. Per Dóminum nostrum Jesum Christum, Fílium tuum: qui tecum vivit et regnat in unitáte Spíritus Sancti, Deus, per ómnia sǽcula sæculórum. Amen.',
  'We beseech you, O Lord, to be merciful to the souls of all your servants and handmaids for whom we humbly entreat your majesty, that by these offices of pious supplication they may be found worthy to enter into everlasting rest. Through Jesus Christ, thy Son our Lord, Who liveth and reigneth with thee, in the unity of the Holy Ghost, God, world without end. Amen.',
);

/** Compline's own opening (Confiteor/Misereatur/Indulgentiam) is
 * unaffected by All Souls' Day — reused verbatim via the app's own
 * `compline-confiteor` common proper (same text every day) rather than
 * duplicated here, so the caller (hours/compline.ts) prepends that part
 * itself before calling buildComplineParts. */
export function buildComplineParts(): ResolvedPart[] {
  return office.buildComplineParts(COMPLINE_COLLECT);
}
