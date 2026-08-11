import type { ResolvedText } from './types';
import type { LiturgicalDay } from '../calendar/types';
import type { ProperText } from '../propers';
import { getCommonProper, getTemporalProper } from '../propers';
import { getSaintRecord } from '../calendar/feasts';
import { splitAntiphon } from './antiphon';

function toResolvedText(proper: ProperText): ResolvedText {
  return { text: proper.text, status: proper.status, citation: proper.citation };
}

/** Shared by every hour's resolver — looks up a common proper by id and
 * shapes it as a ResolvedText. */
export function resolveCommon(id: string): ResolvedText {
  return toResolvedText(getCommonProper(id));
}

/**
 * The day's own collect — real for the vast majority of days (a temporal
 * winner always resolves, since all 52 Sunday collects are authored and
 * ferias inherit the governing Sunday's via calendar/temporal-id.ts), and
 * honestly "missing" for the handful of days a saint wins outright until
 * that saint's own propers are authored (`saints/<id>.yml`'s `propers`
 * field is still `null` for all of them today) — same "resolve as
 * pending" convention as everywhere else, not a special case to handle.
 */
export function getDayCollect(day: LiturgicalDay): ResolvedText {
  if (day.winner.kind === 'temporal') {
    return toResolvedText(getTemporalProper(`${day.winner.id}-collect`));
  }
  const saint = getSaintRecord(day.winner.id);
  if (saint?.propers) {
    return resolveCommon(`${saint.propers}-collect`);
  }
  return { text: {}, status: { la: 'missing', en: 'missing' } };
}

/**
 * The day's own collect, plus one more per commemoration (calendar/
 * types.ts's LiturgicalDay.commemorations) — Lauds/Vespers say all of
 * these in sequence, unlike the Little Hours' single getDayCollect.
 *
 * Simplification, not yet corrected: real practice compresses this into
 * one "Orémus" and lets only the *last* collect close with the full
 * doxology, with earlier ones trailing straight into the next ("And:").
 * Each collect file (data/propers/temporal/*-collect.yml, the per-saint
 * *-collect.yml files) already bakes in its own "Orémus."/"Per Dóminum...
 * Amen." for the single-collect case every other hour uses today, and
 * stripping that back out per-collect to chain them properly would need
 * text surgery this doesn't attempt — so on a commemorated day, each
 * collect here renders as its own complete, separate block instead. An
 * octave commemoration never contributes a collect (none authored — the
 * octave content pull only ever sourced Matins readings, see propers/
 * octave-readings.ts), so those are silently skipped, same as a
 * not-yet-authored saint's own collect resolves to "missing" rather than
 * throwing.
 */
export function getDayCollects(day: LiturgicalDay): ResolvedText[] {
  const collects = [getDayCollect(day)];
  for (const commemoration of day.commemorations) {
    if (commemoration.kind === 'temporal') {
      collects.push(toResolvedText(getTemporalProper(`${commemoration.id}-collect`)));
    } else if (commemoration.kind === 'sanctoral') {
      const saint = getSaintRecord(commemoration.id);
      collects.push(
        saint?.propers
          ? resolveCommon(`${saint.propers}-collect`)
          : { text: {}, status: { la: 'missing', en: 'missing' } },
      );
    }
  }
  return collects;
}

/**
 * Lauds' Benedictus antiphon, resolved the same way as getDayCollect: a
 * per-saint `${propers}-antiphon` (already authored during the sanctoral
 * pull, sourced from each saint's own raw [Ant 1] — see e.g.
 * st-lawrence-antiphon.yml) for a sanctoral winner, `${id}-benedictus-
 * antiphon` (not authored yet for any temporal id — resolves "missing",
 * same pending convention as everywhere else) for a temporal one.
 */
export function getBenedictusAntiphon(day: LiturgicalDay): ResolvedText {
  if (day.winner.kind === 'temporal') {
    return toResolvedText(getTemporalProper(`${day.winner.id}-benedictus-antiphon`));
  }
  const saint = getSaintRecord(day.winner.id);
  if (saint?.propers) {
    return resolveCommon(`${saint.propers}-antiphon`);
  }
  return { text: {}, status: { la: 'missing', en: 'missing' } };
}

export function verifiedText(text: Partial<Record<string, string>>): ResolvedText {
  const status: Partial<Record<string, 'verified'>> = {};
  for (const lang of Object.keys(text)) {
    status[lang] = 'verified';
  }
  return { text, status };
}

const STATUS_RANK = { verified: 0, draft: 1, missing: 2 } as const;

/** Joins a hymn's body with its (seasonally-variable) final doxology
 * stanza, per language — status is the worse of the two per language. */
export function appendDoxology(body: ResolvedText, doxology: ResolvedText): ResolvedText {
  const text: Partial<Record<string, string>> = { ...body.text };
  const status: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = { ...body.status };
  for (const lang of Object.keys(doxology.text)) {
    const doxText = doxology.text[lang];
    if (doxText) {
      text[lang] = text[lang] ? `${text[lang]}\n\n${doxText}` : doxText;
    }
    const bodyStatus = status[lang] ?? 'missing';
    const doxStatus = doxology.status[lang] ?? 'missing';
    status[lang] = STATUS_RANK[doxStatus] > STATUS_RANK[bodyStatus] ? doxStatus : bodyStatus;
  }
  return { text, status };
}

/** Splits a bilingual antiphon (one string per language, each with an
 * embedded "*") into its incipit and full forms, per language — each
 * prefixed "Ant. " inline, the same way "V."/"R." are baked directly into
 * versicle text rather than rendered as a separate UI marker. */
export function splitNamedAntiphon(text: Partial<Record<string, string>>): {
  incipit: ResolvedText;
  full: ResolvedText;
} {
  const incipitText: Partial<Record<string, string>> = {};
  const fullText: Partial<Record<string, string>> = {};
  for (const [lang, t] of Object.entries(text)) {
    if (!t) {
      continue;
    }
    const split = splitAntiphon(t);
    incipitText[lang] = `Ant. ${split.incipit}`;
    fullText[lang] = `Ant. ${split.full}`;
  }
  return { incipit: verifiedText(incipitText), full: verifiedText(fullText) };
}
