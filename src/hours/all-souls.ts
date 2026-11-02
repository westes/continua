import type { ResolvedPart, ResolvedText } from './types';
import { getMartyrologyEntryFor } from '../martyrology';
import * as office from './office-of-the-dead';
import { v, versicle, type Bilingual } from './office-of-the-dead';
import { octaveCommemorationPart, resolveCommon } from './resolve-common';
import { getRegulaReadingFor } from '../regula';
import { isAllSouls } from '../calendar/day-label';
import { resolveDay, resolveActiveOctave } from '../calendar';

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
export { isAllSouls };

export const REQUIEM_GLORIA_PATRI = office.REQUIEM_GLORIA_PATRI;

// Matins is no longer built here: it goes through the ordinary Matins resolver
// (hours/matins.ts), with this feast's `office: dead` setting its shape and its
// content in data/<lang>/propers/all-souls.yml.

// ---------------------------------------------------------------------
// Lauds / Vespers — the engine's own generic collect applies unchanged.
// All Souls' Day doesn't suppress a simultaneously-active octave the way
// the historical rubric does (Sancti/11-02.txt's own "Omit ... Commemoratio
// Suffragium") — vu's generous-commemorations design (see this project's design notes) keeps
// it, the same `getDayCollects`/`octaveCommemorationPart` machinery every
// other day's Lauds/Vespers already uses for an active octave, appended
// after the day's own Requiem content.
// ---------------------------------------------------------------------

function octaveCommemoration(date: string): ResolvedPart[] {
  const day = resolveDay(date);
  const octave = resolveActiveOctave(day.date);
  if (!octave) {
    return [];
  }
  return [octaveCommemorationPart({ kind: 'octave', id: octave.id, name: octave.name, nameLa: octave.nameLa })];
}

/** Splices the octave commemoration in right after the day's own collect
 * and before `office.CONCLUSIO` — same position `getDayCollects`' extra
 * commemoration parts take on every other day's Lauds/Vespers, not after
 * the closing Benedicamus Domino. */
function withOctaveCommemoration(parts: ResolvedPart[], date: string): ResolvedPart[] {
  return [...parts.slice(0, -1), ...octaveCommemoration(date), ...parts.slice(-1)];
}

export function buildLaudsParts(date: string): ResolvedPart[] {
  return withOctaveCommemoration(office.buildLaudsParts(), date);
}

export function buildVespersParts(date: string): ResolvedPart[] {
  return withOctaveCommemoration(office.buildVespersParts(), date);
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
  // The daily Rule reading is not part of the Office of the Dead proper; it is
  // a deliberate addition so All Souls' Prime keeps what every other day has.
  const rule = getRegulaReadingFor(date);
  parts.push(
    { kind: 'preces', text: resolveCommon('prime-regula-blessing') },
    { kind: 'lesson', text: { text: rule.text, status: rule.status }, label: rule.label.en ?? rule.label.la },
    { kind: 'preces', text: resolveCommon('lesson-close') },
  );
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
