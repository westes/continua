import { getSaintRecord } from '../calendar/feasts';

/** Same shape as data/hours/lauds-antiphons.yml's per-weekday entries
 * (see hours/lauds.ts) — a whole-block substitute for the plain ferial
 * weekday psalmody. Two tiers, consulted in order by
 * `getLaudsPsalmodyOverride` (mirrors matins-psalmody-overrides.ts's own
 * saint/category split):
 *
 * 1. **Proper** — `data/hours/lauds-psalmody-overrides/*.yml`, keyed by a
 *    saint's own id (gated at duplex-majus+, see hours/lauds.ts's
 *    getPsalmodyOverrideFor) or the literal 'marian-saturday' (applies
 *    unconditionally whenever it wins) — real proper antiphon text for a
 *    saint who has one, live-verified.
 * 2. **Common** — `data/hours/lauds-psalmody-overrides/categories/*.yml`,
 *    one file per `SaintRecord.common` category (with optional `aliases`
 *    for a second category id sharing the identical scheme, e.g. Common-
 *    of-a-Confessor-Doctor reuses Common-of-a-Confessor-Bishop's Lauds
 *    psalmody verbatim in the reference engine). Live-verified fact
 *    (2026-08-28, `votive=C1`..`C11` queries): the psalm *numbers* here
 *    (92, 99, 62, Canticum Trium Puerorum) are the same for every
 *    Common — only the antiphons vary by category — which is exactly why
 *    the existing per-feast overrides above (e.g. st-lawrence.yml) already
 *    reuse those same three numbers with their own proper antiphons; the
 *    category tier is just the generic version of that when no per-feast
 *    proper has been authored yet.
 *
 * Falls through to the plain weekday default (data/hours/lauds-
 * antiphons.yml) when neither tier has anything for this id — same
 * "mechanism first, content incrementally" pattern as everywhere else,
 * not a bug. */
export interface LaudsPsalmodyOverride {
  id: string;
  groups: { psalms: number[]; antiphon: Partial<Record<string, string>> }[];
  // `split`: see hours/lauds.ts's PsalmodyBlock — no current override
  // needs it, but the shape stays aligned with the plain weekday default.
  //
  // `id` is optional: every category so far uses the same canticle
  // regardless of weekday (so authors it directly), but Common-of-a-
  // Dedication's own canticle *antiphon* is fixed while the underlying
  // canticle text rotates through the plain weekday cycle exactly like
  // ferial Lauds (live-verified against votive=C8 across all 7 weekdays,
  // 2026-09-05) — omitting `id` here signals hours/lauds.ts's
  // resolvePsalmody to splice in that day's own ferial canticle id/split.
  canticle: { id?: string; antiphon: Partial<Record<string, string>>; split?: number };
  laudate: { antiphon: Partial<Record<string, string>> };
}
export interface LaudsPsalmodyCategory extends LaudsPsalmodyOverride {
  aliases?: string[];
}

const modules = import.meta.glob<{ default: LaudsPsalmodyOverride }>(
  '../data/hours/lauds-psalmody-overrides/*.yml',
  { eager: true },
);
const categoryModules = import.meta.glob<{ default: LaudsPsalmodyCategory }>(
  '../data/hours/lauds-psalmody-overrides/categories/*.yml',
  { eager: true },
);

const overrides = new Map<string, LaudsPsalmodyOverride>();
for (const mod of Object.values(modules)) {
  overrides.set(mod.default.id, mod.default);
}

const categories = new Map<string, LaudsPsalmodyCategory>();
for (const mod of Object.values(categoryModules)) {
  categories.set(mod.default.id, mod.default);
  for (const alias of mod.default.aliases ?? []) {
    categories.set(alias, mod.default);
  }
}

export function getLaudsPsalmodyOverride(id: string | undefined): LaudsPsalmodyOverride | undefined {
  if (!id) return undefined;
  return getLaudsSaintOverride(id) ?? getLaudsCommonOverride(id);
}

/** Saint-specific proper only, skipping the Common-category tier. */
export function getLaudsSaintOverride(id: string | undefined): LaudsPsalmodyOverride | undefined {
  if (!id) return undefined;
  return overrides.get(id);
}

/** Common-category lookup only, joining via `SaintRecord.common`. When
 * `paschaltide` is true, tries `${common}-paschaltide` first — same
 * "dedicated wholesale-different Paschaltide text" tier already used for
 * the minor hours' own Common antiphons (see resolve-common.ts's
 * PASCHALTIDE_SEASONS doc comment) — falling back to the plain category
 * when no such variant has been authored, same honest incremental
 * pattern as everywhere else. */
export function getLaudsCommonOverride(id: string | undefined, paschaltide = false): LaudsPsalmodyOverride | undefined {
  if (!id) return undefined;
  const common = getSaintRecord(id)?.common;
  if (!common) return undefined;
  if (paschaltide) {
    const variant = categories.get(`${common}-paschaltide`);
    if (variant) return variant;
  }
  return categories.get(common);
}
