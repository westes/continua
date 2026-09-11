import { getSaintRecord } from '../calendar/feasts';

/**
 * The one piece genuinely duplicated, byte-for-byte, across Lauds'/
 * Vespers'/Matins' own psalmody-override modules: given a saint id, resolve
 * which Common-category id its psalmody should fall back to — its own
 * `SaintRecord.common`, trying a `-paschaltide`-suffixed variant first when
 * one exists and the caller is asking for it. Everything else about those
 * three modules (their override *shapes* — Lauds' canticle/laudate fields,
 * Vespers' verse-range psalm entries, Matins' 3-nocturn scheme; whether a
 * Paschaltide tier even applies at all — Matins has none; how each hour's
 * own call site gates and merges its result) is genuinely different per
 * hour and stays that way — see each module's own doc comment; this helper
 * only centralizes the id-derivation step, not the surrounding lookup.
 * `hasVariant` lets each hour's own `categories` store decide what "exists"
 * means, without this helper needing to know how that hour stores them.
 */
export function resolveCommonCategoryId(
  saintId: string | undefined,
  paschaltide: boolean,
  hasVariant: (id: string) => boolean,
): string | undefined {
  if (!saintId) return undefined;
  const common = getSaintRecord(saintId)?.common;
  if (!common) return undefined;
  if (paschaltide) {
    const variant = `${common}-paschaltide`;
    if (hasVariant(variant)) return variant;
  }
  return common;
}
