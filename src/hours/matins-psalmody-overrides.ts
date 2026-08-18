import { getSaintRecord } from '../calendar/feasts';

/** Matins' own analogue of hours/lauds-psalmody-overrides.ts. Two data
 * stores, both keyed by id, consulted in a three-tier fallback by
 * `getMatinsPsalmodyOverride` below (assumes the caller has already
 * gated on rank — this module is only ever consulted for a Sunday/
 * Duplex+ three-nocturn day, never a plain ferial one):
 *
 * 1. **Proper** — `data/hours/matins-psalmody-overrides/saints/*.yml`,
 *    real proper antiphon text for one specific saint (only authored
 *    where a saint genuinely has proper text of their own, confirmed
 *    against the live engine, not merely inherited Common text). Each
 *    carries its own `category` field cross-referencing the file below,
 *    but is otherwise fully self-contained (own psalm numbers, not
 *    merged with the category file at load time) — a saint's proper
 *    psalmody occasionally swaps one slot's psalm number from the
 *    category default too (see `saints/st-lawrence.yml`'s own note), so
 *    per-saint files stay authoritative rather than being computed as a
 *    diff.
 * 2. **Common** — `data/hours/matins-psalmody-overrides/categories/
 *    *.yml`, the generic Common-of-* Matins psalmody (psalm numbers,
 *    versicles, canticle refs, and the plain Common antiphon text), one
 *    file per `SaintRecord.common` category, live-verified against a
 *    saint with no proper antiphon of his own (so his own output *is*
 *    the category default) — see e.g. `categories/common-of-a-
 *    martyr.yml`'s own doc comment. A category file may declare
 *    `aliases` for a second `SaintRecord.common` id that shares its
 *    exact scheme (e.g. Common-of-a-Martyr-Bishop's own Matins
 *    psalmody redirects outright to Common-of-a-Martyr in the reference
 *    engine — one scheme, not two — so `common-of-a-martyr.yml` lists
 *    `common-of-a-martyr-bishop` as an alias rather than duplicating the
 *    file).
 * 3. **Ferial fallback** — no entry in either store yet; `matins.ts`'s
 *    own `ferialPsalmodyThreeNocturns`, redistributed into 3 nocturns.
 *    This is genuinely a stand-in (the plain weekday table, not this
 *    saint's or even this Common's own text) and is expected to shrink
 *    over time as more categories get authored, not as a permanent third
 *    class of content.
 *
 * `id` is looked up against `hours/resolve-common.ts`'s
 * `resolveOfficeWinner(day).id` when it's sanctoral, exactly like every
 * other per-feast/per-category content lookup in this app. */
export interface MatinsPsalmodyGroup {
  psalms: number[];
  antiphon: Partial<Record<string, string>>;
}
export interface ScriptureCanticleRef {
  book: string;
  chapter: number;
  verses?: string;
}
export interface MatinsPsalmodyNocturn {
  groups?: MatinsPsalmodyGroup[];
  canticles?: { refs: ScriptureCanticleRef[] }[];
  antiphon?: Partial<Record<string, string>>;
  versicle: { v: Partial<Record<string, string>>; r: Partial<Record<string, string>> };
}
export interface MatinsPsalmodyScheme {
  nocturn1: MatinsPsalmodyNocturn;
  nocturn2: MatinsPsalmodyNocturn;
  nocturn3: MatinsPsalmodyNocturn;
}
export interface MatinsPsalmodyOverride extends MatinsPsalmodyScheme {
  id: string;
  category?: string;
}
export interface MatinsPsalmodyCategory extends MatinsPsalmodyScheme {
  id: string;
  aliases?: string[];
}

const saintModules = import.meta.glob<{ default: MatinsPsalmodyOverride }>(
  '../data/hours/matins-psalmody-overrides/saints/*.yml',
  { eager: true },
);
const categoryModules = import.meta.glob<{ default: MatinsPsalmodyCategory }>(
  '../data/hours/matins-psalmody-overrides/categories/*.yml',
  { eager: true },
);

const overrides = new Map<string, MatinsPsalmodyOverride>();
for (const mod of Object.values(saintModules)) {
  overrides.set(mod.default.id, mod.default);
}

const categories = new Map<string, MatinsPsalmodyCategory>();
for (const mod of Object.values(categoryModules)) {
  categories.set(mod.default.id, mod.default);
  for (const alias of mod.default.aliases ?? []) {
    categories.set(alias, mod.default);
  }
}

export function getMatinsPsalmodyOverride(id: string | undefined): MatinsPsalmodyScheme | undefined {
  if (!id) return undefined;
  return overrides.get(id) ?? categories.get(getSaintRecord(id)?.common ?? '');
}
