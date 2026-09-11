import { resolveCommonCategoryId } from './psalmody-common-category';

/** Vespers' own analogue of hours/lauds-psalmody-overrides.ts (and, more
 * distantly, matins-psalmody-overrides.ts) — a whole-block substitute for
 * the plain ferial weekday psalmody (data/hours/vespers-antiphons.yml),
 * gated the same duplex-majus+ way as Lauds' own override
 * (hours/vespers.ts's getPsalmodyOverrideFor, reusing resolve-common.ts's
 * getOfficeOverrideId). Two tiers, consulted in order by
 * `getVespersPsalmodyOverride`:
 *
 * 1. **Proper** — `data/hours/vespers-psalmody-overrides/saints/*.yml`,
 *    a specific saint's own proper Vespers psalmody, keyed by saint id.
 *    None authored yet (no duplex-majus+ saint in this app currently has
 *    proper Vespers psalm antiphons distinct from their Common's) — the
 *    tier exists so one can be added later without a mechanism change,
 *    same "mechanism first, content incrementally" pattern as Lauds'.
 * 2. **Common** — `data/hours/vespers-psalmody-overrides/categories/
 *    *.yml`, one file per `SaintRecord.common` category (with optional
 *    `aliases` for a second category id sharing the identical scheme).
 *    Live-verified (2026-08-28, `votive=C1`..`C11` queries against
 *    Divinum Officium, Monastic Tridentinum 1617): unlike Lauds (whose
 *    psalm *numbers* are the same fixed set for every Common), Vespers'
 *    psalm numbers genuinely differ by Common — e.g. Common-of-an-Apostle
 *    is 109/112/115/138, Common-of-a-Confessor-Bishop is 109/111/112/131
 *    — so this tier carries its own `groups` per category, not just
 *    antiphons layered onto one shared number set.
 *
 * Falls through to the plain weekday default (data/hours/vespers-
 * antiphons.yml) when neither tier has anything for this id. */
export interface VespersPsalmodyGroup {
  psalms: (number | { number: number; verses?: string })[];
  antiphon: Partial<Record<string, string>>;
}
export interface VespersPsalmodyOverride {
  id: string;
  groups: VespersPsalmodyGroup[];
}
export interface VespersPsalmodyCategory extends VespersPsalmodyOverride {
  aliases?: string[];
}

const saintModules = import.meta.glob<{ default: VespersPsalmodyOverride }>(
  '../data/hours/vespers-psalmody-overrides/saints/*.yml',
  { eager: true },
);
const categoryModules = import.meta.glob<{ default: VespersPsalmodyCategory }>(
  '../data/hours/vespers-psalmody-overrides/categories/*.yml',
  { eager: true },
);

const overrides = new Map<string, VespersPsalmodyOverride>();
for (const mod of Object.values(saintModules)) {
  overrides.set(mod.default.id, mod.default);
}

const categories = new Map<string, VespersPsalmodyCategory>();
for (const mod of Object.values(categoryModules)) {
  categories.set(mod.default.id, mod.default);
  for (const alias of mod.default.aliases ?? []) {
    categories.set(alias, mod.default);
  }
}

export function getVespersPsalmodyOverride(id: string | undefined): VespersPsalmodyOverride | undefined {
  if (!id) return undefined;
  return getVespersSaintOverride(id) ?? getVespersCommonOverride(id);
}

/** Saint-specific proper only, skipping the Common-category tier. */
export function getVespersSaintOverride(id: string | undefined): VespersPsalmodyOverride | undefined {
  if (!id) return undefined;
  return overrides.get(id);
}

/** Common-category lookup only, joining via `SaintRecord.common`. When
 * `paschaltide` is true, tries `${common}-paschaltide` first — same
 * "dedicated wholesale-different Paschaltide text" tier already used for
 * the minor hours' own Common antiphons (see resolve-common.ts's
 * PASCHALTIDE_SEASONS doc comment) — falling back to the plain category
 * when no such variant has been authored, same honest incremental
 * pattern as everywhere else. The id-derivation itself is shared with
 * Lauds'/Matins' own Common-override functions — see
 * psalmody-common-category.ts. */
export function getVespersCommonOverride(id: string | undefined, paschaltide = false): VespersPsalmodyOverride | undefined {
  const categoryId = resolveCommonCategoryId(id, paschaltide, (candidate) => categories.has(candidate));
  return categoryId ? categories.get(categoryId) : undefined;
}
