/** Same shape as data/hours/lauds-antiphons.yml's per-weekday entries
 * (see hours/lauds.ts) — a whole-block substitute for the plain ferial
 * weekday psalmody, keyed by id: either a saint's own id (gated at
 * duplex-majus+, see hours/lauds.ts's getPsalmodyOverrideFor) or the
 * literal 'marian-saturday' (applies unconditionally whenever it wins).
 * Deliberately per-feast, not per-Common — explicit choice, even though
 * it means most duplex-majus+ saints across the year don't have one of
 * these authored yet and fall back to the plain weekday default until
 * they do (same "mechanism first, content incrementally" pattern as
 * everywhere else — not a bug, an expected, honest gap). */
export interface LaudsPsalmodyOverride {
  id: string;
  groups: { psalms: number[]; antiphon: Partial<Record<string, string>> }[];
  // `split`: see hours/lauds.ts's PsalmodyBlock — no current override
  // needs it, but the shape stays aligned with the plain weekday default.
  canticle: { id: string; antiphon: Partial<Record<string, string>>; split?: number };
  laudate: { antiphon: Partial<Record<string, string>> };
}

const modules = import.meta.glob<{ default: LaudsPsalmodyOverride }>(
  '../data/hours/lauds-psalmody-overrides/*.yml',
  { eager: true },
);

const overrides = new Map<string, LaudsPsalmodyOverride>();
for (const mod of Object.values(modules)) {
  overrides.set(mod.default.id, mod.default);
}

export function getLaudsPsalmodyOverride(id: string): LaudsPsalmodyOverride | undefined {
  return overrides.get(id);
}
