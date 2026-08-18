/** Matins' own analogue of hours/lauds-psalmody-overrides.ts, but keyed
 * by Common category rather than per-saint: live-verified (see
 * data/hours/matins-psalmody-overrides/st-lawrence.yml's own header)
 * that the psalm *numbers* for Nocturns 1-2 are shared across saints of
 * the same Common category (a plain-Duplex Martyr and a plain-Duplex
 * Martyr-Bishop share all but one of the same twelve psalm numbers) —
 * only the antiphon text varies, proper to the individual saint when
 * authored, generic Common-of-* text otherwise. Deliberately the
 * opposite indexing choice from Lauds' own per-feast override (see that
 * file's own doc comment) — Lauds' 5-antiphon pool is shared across
 * every Duplex-majus+ feast regardless of category, so per-feast is the
 * natural key there; Matins' pool varies *by* category, so per-category
 * is the natural key here.
 *
 * `id` is looked up against `hours/resolve-common.ts`'s
 * `resolveOfficeWinner(day).id` when it's sanctoral, exactly like every
 * other per-feast/per-category content lookup in this app — but the
 * `id` values populated so far are individual saint ids (St. Lawrence
 * proper), not Common-category ids, since only the live-verified proof
 * has been authored; extending this to a real Common-category key
 * (`common-of-a-martyr`, etc., matching `SaintRecord.common`) with
 * per-saint antiphon overrides layered on top is the deferred bulk-
 * content work (see TODO.md) — not built yet, so a saint without their
 * own entry here falls back to the plain ferial weekday table
 * (matins.ts's own fallback), not to some other saint's proper
 * antiphons. */
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
  nocturn1: MatinsPsalmodyNocturn;
  nocturn2: MatinsPsalmodyNocturn;
  nocturn3: MatinsPsalmodyNocturn;
}

const modules = import.meta.glob<{ default: MatinsPsalmodyOverride }>(
  '../data/hours/matins-psalmody-overrides/*.yml',
  { eager: true },
);

const overrides = new Map<string, MatinsPsalmodyOverride>();
for (const mod of Object.values(modules)) {
  overrides.set(mod.default.id, mod.default);
}

export function getMatinsPsalmodyOverride(id: string | undefined): MatinsPsalmodyOverride | undefined {
  return id ? overrides.get(id) : undefined;
}
