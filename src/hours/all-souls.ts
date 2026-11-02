import type { ResolvedPart } from './types';
import * as office from './office-of-the-dead';
import { v } from './office-of-the-dead';
import { isAllSouls } from '../calendar/day-label';

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
