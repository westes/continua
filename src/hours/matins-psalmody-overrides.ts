/** Matins' own analogue of hours/lauds-psalmody-overrides.ts. Two data
 * stores, both keyed by id:
 *
 * - `data/hours/matins-psalmody-overrides/categories/*.yml` — the
 *   generic Common-of-* Matins psalmody (psalm numbers, versicles,
 *   canticle refs, and the plain Common antiphon text), one file per
 *   `SaintRecord.common` category. Live-verified against a saint with no
 *   proper antiphon of his own (so his own output *is* the category
 *   default) — see e.g. `categories/common-of-a-martyr.yml`'s own doc
 *   comment. Reference/documentation content only: not consulted by
 *   `getMatinsPsalmodyOverride` below, per this project's "stay on the
 *   ferial fallback until proper antiphon text is authored per-saint"
 *   decision (2026-08) — a saint without their own entry in `saints/`
 *   still falls all the way back to matins.ts's own plain ferial table,
 *   never to a category's generic antiphon text. Recorded so the next
 *   saint authored in an already-proven category doesn't have to
 *   re-derive/re-verify the same shared psalm numbers and versicles.
 *
 * - `data/hours/matins-psalmody-overrides/saints/*.yml` — real proper
 *   antiphon text for one specific saint (only authored where a saint
 *   genuinely has proper text of their own, confirmed against the live
 *   engine, not merely inherited Common text). Each carries its own
 *   `category` field cross-referencing the file above, but is otherwise
 *   fully self-contained (own psalm numbers, not merged with the
 *   category file at load time) — a saint's proper psalmody occasionally
 *   swaps one slot's psalm number from the category default too (see
 *   `saints/st-lawrence.yml`'s own note), so per-saint files stay
 *   authoritative rather than being computed as a diff.
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
export interface MatinsPsalmodyOverride {
  id: string;
  category?: string;
  nocturn1: MatinsPsalmodyNocturn;
  nocturn2: MatinsPsalmodyNocturn;
  nocturn3: MatinsPsalmodyNocturn;
}
export interface MatinsPsalmodyCategory {
  id: string;
  nocturn1: MatinsPsalmodyNocturn;
  nocturn2: MatinsPsalmodyNocturn;
  nocturn3: MatinsPsalmodyNocturn;
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
}

export function getMatinsPsalmodyOverride(id: string | undefined): MatinsPsalmodyOverride | undefined {
  return id ? overrides.get(id) : undefined;
}

export function getMatinsPsalmodyCategory(id: string | undefined): MatinsPsalmodyCategory | undefined {
  return id ? categories.get(id) : undefined;
}
