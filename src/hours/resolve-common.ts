import type { ResolvedPart, ResolvedText } from './types';
import type { Commemoration, DayWinner, LiturgicalDay } from '../calendar/types';
import type { ProperText } from '../propers';
import { getCommonProper, getTemporalProper } from '../propers';
import { getSaintRecord } from '../calendar/feasts';
import { resolveActiveOctave } from '../calendar';
import { splitAntiphon } from './antiphon';

function toResolvedText(proper: ProperText): ResolvedText {
  return { text: proper.text, status: proper.status, citation: proper.citation };
}

/** Shared by every hour's resolver — looks up a common proper by id and
 * shapes it as a ResolvedText. */
export function resolveCommon(id: string): ResolvedText {
  return toResolvedText(getCommonProper(id));
}

// Named temporal winners with real standing of their own, unconditionally
// override-eligible — see hours/lauds.ts's getPsalmodyOverrideFor, which
// shares this set (imported from here, not duplicated) since it's the
// same "does this temporal identity carry its own real office" question.
export const ALWAYS_OVERRIDE_TEMPORAL_IDS = new Set(['marian-saturday', 'christ-the-king', 'christmas-octave-sunday']);

/**
 * Which identity's own propers actually supply the office's content
 * (collect, Benedictus antiphon, psalmody override) — usually just
 * `day.winner`, but *not* on a day within an active octave where the
 * temporal day itself has no real standing of its own (`ordinary-feria`)
 * and the winner stayed temporal — an ordinary day within St. Lawrence's
 * own octave, e.g.: live-verified (Tridentine 1910, 2026-08-12) that the
 * chapter/responsory/hymn/versicle, psalms' antiphons, Benedictus
 * antiphon, and day collect all come from the octave's own feast
 * ("{ex Commune aut Festo}" / "{ex Proprio Sanctorum}"), not from the
 * plain temporal day underneath it.
 *
 * Deliberately gated on `ordinary-feria` specifically, not just "an
 * octave is active": the Christmas Octave's own stacked octaves
 * (Christmas + Stephen + John + Holy Innocents, e.g. on Dec 30) are the
 * live-verified counterexample — that day's own temporal identity
 * ("Dominica Infra Octavam Nativitatis", `privileged-feria-minor`) is
 * itself a real, named standing, and *keeps* the office
 * ("{ex Proprio de Tempore}"); the four octaves there each become their
 * own separate "Commemoratio Octavæ ..." block instead (not yet modeled
 * — see TODO.md), rather than any one of them taking over content the
 * way Lawrence's octave does. The dividing line is real standing, not
 * merely "is an octave active."
 *
 * `day.winner`/`day.commemorations` themselves stay exactly as
 * calendar/index.ts computed them either way — this is purely a
 * content-lookup detail, not a recomputation of who "wins." Picks the
 * oldest-started active octave with an authored saint record
 * (activeOctavesFor's own ordering) — matches calendar/day-label.ts's
 * same choice for the display label, for the same reason.
 */
export function resolveOfficeWinner(day: LiturgicalDay): DayWinner {
  if (day.winner.kind === 'sanctoral' || ALWAYS_OVERRIDE_TEMPORAL_IDS.has(day.winner.id)) {
    return day.winner;
  }
  if (day.temporalCategory !== 'ordinary-feria') {
    return day.winner;
  }
  // When more than one octave is active at once (St. Lawrence's and the
  // Assumption's genuinely overlap every Aug 16-17), resolveActiveOctave
  // picks the one that actually governs the day — see its own doc
  // comment for the precedence rule. Falls through to the plain temporal
  // default if that octave turns out to be a temporal-only one with no
  // saint record (e.g. Christmas's or Pentecost's own octave id) — no
  // sanctoral content to synthesize from those.
  const activeOctave = resolveActiveOctave(day.date);
  if (activeOctave) {
    const saint = getSaintRecord(activeOctave.id);
    if (saint) {
      return { kind: 'sanctoral', id: saint.id, name: saint.name, rank: saint.rank };
    }
  }
  return day.winner;
}

/** Like calendar/index.ts's own isSundayOrFeast, but resolveOfficeWinner-
 * aware — an octave day counts as a "feast" for this purpose too.
 * Live-verified: Prime's capitulum/Preces stay in the Sunday/feast form
 * throughout St. Lawrence's octave (2026-08-12), not just his own actual
 * day (2026-08-10) — both show the identical "ex Psalterio secundum
 * diem" 1 Tim 1:17 text. Deliberately a separate function, not a
 * replacement for the plain isSundayOrFeast: Lauds' own Cross-suffrage
 * gate (hours/lauds.ts) needs the *narrower*, non-office-aware version,
 * since Marian Saturday and an octave day both need to land on the
 * ferial side there despite not being Sunday or a sanctoral `day.winner`
 * either. */
export function isSundayOrFeastOffice(day: LiturgicalDay): boolean {
  return day.weekday === 'sunday' || resolveOfficeWinner(day).kind === 'sanctoral';
}

/**
 * The id to look up for today's office winner's (resolveOfficeWinner)
 * minor-hour content (antiphon + chapter) — `${hourId}-antiphon-${id}`/
 * `${hourId}-capitulum-${id}` first (a per-saint proper file, only ever
 * authored for duplex-majus+ saints in practice), then that saint's
 * `minorHoursCommon` fallback (see resolveMinorHourAntiphon/Chapter
 * below), tried regardless of rank: live-querying the reference engine
 * directly (2026-08, the 94 `propers: null` saints' P/T/S/N pass)
 * confirmed a winning Simplex/Semiduplex saint's own minor hours *do*
 * carry proper/Common antiphons, not the plain ferial default — a real
 * liturgical fact, not an app gap. Any sanctoral winner is therefore
 * eligible here; it's `resolveMinorHourAntiphon`/`resolveMinorHourChapter`
 * that decide, per hour, whether anything's actually been authored for
 * that id (falling through to the weekday default when not). Until
 * 2026-08 this was gated at duplex-majus+ (the same threshold Lauds'
 * own *psalmody* override uses, hours/lauds.ts's getPsalmodyOverrideFor)
 * — that threshold remains correct for the *psalmody* override
 * specifically (a much bigger authored-content commitment, still
 * majus+-only), but was wrongly reused here as if it were a general
 * "is this saint's office strong enough" rule.
 * Also honors ALWAYS_OVERRIDE_TEMPORAL_IDS the same way
 * getPsalmodyOverrideFor does — a named temporal feast (`christ-the-
 * king`, `christmas-octave-sunday`) is eligible regardless of rank, since
 * it has no FeastClass to compare against in the first place.
 * Returns the id to look up, or `undefined` when nothing sanctoral or
 * named-temporal is happening today (a plain temporal day just stays on
 * its own weekday default, same as always).
 */
export function getMinorHourOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(winner.id)) {
    return winner.id;
  }
  if (winner.kind === 'sanctoral') {
    return winner.id;
  }
  return undefined;
}

/**
 * "Tempore Paschali" — the reference engine's own window for Paschaltide
 * text changes. Deliberately the same three-season set as Compline's own
 * Marian-antiphon table (`data/hours/marian-antiphon-by-season.yml`'s
 * `eastertide`/`ascensiontide`/`pentecost` all mapping to Regina Caeli, not
 * just `eastertide` alone) — "Paschalis" runs through the end of the
 * Pentecost octave in both cases, not just to Ascension.
 *
 * RESOLVED (2026-08): the earlier version of this comment claimed only
 * Apostles/Martyr-Bishop/Several-Martyrs get a Paschaltide change at all,
 * and that Confessors/Virgins/Doctors never do. Live-querying settled
 * this more precisely, per the "St. Athanasius/allelúja" investigation
 * (TODO.md): the reference source (Commune/C1p.txt, C2p.txt, C2bp.txt,
 * C3p.txt, C3bp.txt) really does give *some* categories — Apostles,
 * Martyr, Martyr-Bishop, Several Martyrs, Pope-Martyrs — their own
 * wholesale-different Paschaltide text (often, not always, doubling the
 * alleluia as genuinely different content, confirmed by reading the raw
 * chain rather than guessing from the rendered page). But categories
 * *without* one of those (Confessor-Bishop/Doctor, Abbot, Virgin — all
 * three live-verified this pass: St. Athanasius, St. Robert, St.
 * Catherine of Siena) still change during this same window: the engine
 * mechanically appends a single ", allelúja"/", alleluia" to the closing
 * clause of the otherwise-unchanged base text. `appendPaschaltideAlleluia`
 * below models that fallback; the dedicated-chain categories are still
 * handled the older way, by trying a same-id `-paschaltide` file first
 * (only authored for `common-of-apostles` so far — the other four
 * dedicated-chain categories fall through to the mechanical suffix too
 * until someone authors their real wholesale text, which is a strictly
 * better approximation than rendering the bare non-Paschaltide default).
 */
const PASCHALTIDE_SEASONS = new Set(['eastertide', 'ascensiontide', 'pentecost']);

/**
 * The reference engine's mechanical Paschaltide fallback for a Common
 * antiphon with no dedicated wholesale-different text of its own: a
 * single ", allelúja."/", alleluia." tacked onto the closing clause,
 * text otherwise byte-identical to the non-Paschaltide default. Live-
 * verified across three unrelated categories (St. Athanasius/Confessor-
 * Bishop, St. Robert/Abbot, St. Catherine of Siena/Virgin) — never
 * doubled, and the app's stored antiphon text already carries the
 * incipit/full split as one string with an embedded "*"
 * (`splitNamedAntiphon`/`splitAntiphon`), so appending to the very end
 * only ever lands in the "full" half, matching the reference engine's own
 * behavior exactly (its *incipit*-only rendering, sung before the psalm,
 * never carries the suffix — only the closing, full-text rendering after
 * it does).
 *
 * Skips a language whose stored text already ends in "allelúja"/
 * "alleluia" — `common-of-pope-martyrs` is the one category this
 * actually matters for: its own stored files were, unavoidably, captured
 * from a live query already inside Paschaltide (its only two members'
 * fixed dates structurally can never be queried at any other real point
 * in the calendar without landing in the Sacred Triduum instead, where
 * they're always fully transferred and never render at all — see
 * TODO.md) — so what's stored there already *is* the Paschaltide text,
 * and blindly appending here would double up.
 *
 * Deliberately scoped to antiphons only, not capitula: a capitulum's own
 * closing versicles get the same suffix in the reference engine too
 * (confirmed, St. Robert's Terce capitulum), but that text is one
 * embedded R./V. blob per language, not a clean appendable tail, and
 * reproducing that safely wasn't attempted this pass — see TODO.md.
 */
function appendPaschaltideAlleluia(resolved: ResolvedText): ResolvedText {
  const suffixByLang: Partial<Record<string, string>> = { la: 'allelúja', en: 'alleluia' };
  const text: Partial<Record<string, string>> = { ...resolved.text };
  for (const [lang, suffix] of Object.entries(suffixByLang)) {
    const t = text[lang];
    if (!t || /allel(?:úja|uia)\.?\s*$/i.test(t)) {
      continue;
    }
    text[lang] = `${t.replace(/\.\s*$/, '')}, ${suffix}.`;
  }
  return { ...resolved, text };
}

/** Applies appendPaschaltideAlleluia only when the day actually falls in
 * Paschaltide and there's real text to append it to — the shared guard
 * both resolveMinorHourAntiphon's Common fallback and getBenedictusAntiphon
 * use, so neither has to repeat the two checks inline. */
function withPaschaltideAlleluia(resolved: ResolvedText, day: LiturgicalDay): ResolvedText {
  if (!PASCHALTIDE_SEASONS.has(day.season)) {
    return resolved;
  }
  if (resolved.status.la === 'missing' && resolved.status.en === 'missing') {
    return resolved;
  }
  return appendPaschaltideAlleluia(resolved);
}

/** A Little Hour's (or Prime's) plain per-weekday antiphon, overridden by
 * a duplex-majus+ feast's own proper (`${hourId}-antiphon-${id}`) when
 * authored, then by that saint's shared Common (`${hourId}-antiphon-
 * ${minorHoursCommon}`, see SaintRecord's own doc comment) — tried first
 * in its Paschaltide-variant form (`${minorHoursCommon}-paschaltide`)
 * when the day falls in Paschaltide and that variant has been authored,
 * per PASCHALTIDE_SEASONS's own doc comment — when a proper one hasn't
 * been authored — same honest "not gated behind whether content exists,
 * just eligible to override at all" fallback as every other override in
 * this codebase: an eligible feast with none of these authored yet just
 * falls through to the plain weekday default silently. The plain (non-
 * `-paschaltide`) Common fallback itself still picks up a seasonal change
 * in Paschaltide — see `withPaschaltideAlleluia`.
 */
export function resolveMinorHourAntiphon(
  hourId: string,
  day: LiturgicalDay,
  weekdayDefault: Partial<Record<string, string>>,
): ResolvedText {
  const overrideId = getMinorHourOverrideId(day);
  if (overrideId) {
    const proper = resolveCommon(`${hourId}-antiphon-${overrideId}`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
    const commonId = getSaintRecord(overrideId)?.minorHoursCommon;
    if (commonId) {
      if (PASCHALTIDE_SEASONS.has(day.season)) {
        const paschal = resolveCommon(`${hourId}-antiphon-${commonId}-paschaltide`);
        if (paschal.status.la !== 'missing' || paschal.status.en !== 'missing') {
          return paschal;
        }
      }
      const common = resolveCommon(`${hourId}-antiphon-${commonId}`);
      if (common.status.la !== 'missing' || common.status.en !== 'missing') {
        return withPaschaltideAlleluia(common, day);
      }
    }
  }
  // The plain weekday default (data/hours/{hour}-antiphons.yml) never
  // carries its own status field at all — always implicitly verified by
  // the file's own live-checked convention, not a guess.
  return verifiedText(weekdayDefault);
}

/** Same idea as resolveMinorHourAntiphon, for the chapter
 * (`${hourId}-capitulum-${id}`, then `${hourId}-capitulum-
 * ${minorHoursCommon}`, tried Paschaltide-variant-first the same way) —
 * falls back to `fallbackId` (the plain per-annum/per-weekday one already
 * in place for that hour) when nothing eligible is authored, either
 * proper or shared-Common. */
export function resolveMinorHourChapter(hourId: string, day: LiturgicalDay, fallbackId: string): ResolvedText {
  const overrideId = getMinorHourOverrideId(day);
  if (overrideId) {
    const proper = resolveCommon(`${hourId}-capitulum-${overrideId}`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
    const commonId = getSaintRecord(overrideId)?.minorHoursCommon;
    if (commonId) {
      if (PASCHALTIDE_SEASONS.has(day.season)) {
        const paschal = resolveCommon(`${hourId}-capitulum-${commonId}-paschaltide`);
        if (paschal.status.la !== 'missing' || paschal.status.en !== 'missing') {
          return paschal;
        }
      }
      const common = resolveCommon(`${hourId}-capitulum-${commonId}`);
      if (common.status.la !== 'missing' || common.status.en !== 'missing') {
        return common;
      }
    }
  }
  return resolveCommon(fallbackId);
}

/** Fills a Common collect template's literal `{N}` placeholders with a
 * saint's own name(s) per language (SaintRecord.collectName) — the same
 * substitution the reference source's own Commune files perform
 * (`beáti N. Confessóris tui` etc.), just resolved at authoring-adjacent
 * read time here instead of duplicating the same template text once per
 * saint who shares it. Positional: the template's `{N}` occurrences fill
 * left-to-right from `names`, in document order — most templates have
 * one, a few (two co-named saints commemorated together) have two. */
function substituteName(text: ResolvedText, name: { la: string[]; en: string[] }): ResolvedText {
  const substituted: Partial<Record<string, string>> = {};
  for (const [lang, t] of Object.entries(text.text)) {
    if (!t) {
      continue;
    }
    const values = lang === 'la' ? name.la : lang === 'en' ? name.en : undefined;
    if (!values) {
      substituted[lang] = t;
      continue;
    }
    let i = 0;
    substituted[lang] = t.replace(/\{N\}/g, () => values[i++] ?? '{N}');
  }
  return { text: substituted, status: text.status };
}

/**
 * The day's own collect — real for the vast majority of days (a temporal
 * winner always resolves, since all 52 Sunday collects are authored and
 * ferias inherit the governing Sunday's via calendar/temporal-id.ts), a
 * Common-template collect with the saint's own name substituted in when
 * they have no proper collect of their own but a `collectCommon` fallback
 * is authored (`SaintRecord.collectCommon`/`collectName`, e.g. St. Agatha
 * and St. Lucy — a proper antiphon but a Common-sourced collect, live-
 * verified), and honestly "missing" for the remaining days a saint wins
 * outright until either is authored. `collectCommon` is the *full*
 * `resolveCommon` id already (`collect-c2`, not `c2` — no suffix gets
 * appended, unlike `minorHoursCommon` above), matching how the
 * `collect-c*.yml` files are actually named. Uses resolveOfficeWinner,
 * not the raw `day.winner` — see its own doc comment for why those two
 * differ on an octave day.
 */
export function getDayCollect(day: LiturgicalDay): ResolvedText {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal') {
    return toResolvedText(getTemporalProper(`${winner.id}-collect`));
  }
  const saint = getSaintRecord(winner.id);
  if (saint?.propers) {
    const proper = resolveCommon(`${saint.propers}-collect`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
  }
  if (saint?.collectCommon && saint.collectName) {
    const template = resolveCommon(saint.collectCommon);
    if (template.status.la !== 'missing' || template.status.en !== 'missing') {
      return substituteName(template, saint.collectName);
    }
  }
  return { text: {}, status: { la: 'missing', en: 'missing' } };
}

/** A sanctoral commemoration's own rendering: the fuller Ant+V/R+collect
 * bundle (`${propers}-commemoration`, e.g. st-clare-commemoration.yml)
 * when authored — live-verified this is the real shape a commemoration
 * takes, not a bare collect — falling back to just the collect alone
 * (still labeled, unlike the old unlabeled bare-collect rendering this
 * replaces) when only that's been authored, and to an honestly labeled
 * "missing" block when neither has. Always labeled ("Commemoration of St.
 * X") so an unauthored one reads as "this saint's commemoration isn't
 * written up yet," not as a mystery blank prayer. */
function sanctoralCommemorationPart(commemoration: Extract<Commemoration, { kind: 'sanctoral' }>): ResolvedPart {
  const label = `Commemoration of ${commemoration.name}`;
  const saint = getSaintRecord(commemoration.id);
  if (saint?.propers) {
    const combined = resolveCommon(`${saint.propers}-commemoration`);
    if (combined.status.la !== 'missing' || combined.status.en !== 'missing') {
      return { kind: 'preces', text: combined, label };
    }
    return { kind: 'preces', text: resolveCommon(`${saint.propers}-collect`), label };
  }
  return { kind: 'preces', text: { text: {}, status: { la: 'missing', en: 'missing' } }, label };
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
 * octave commemoration never contributes anything of its own here — once
 * resolveOfficeWinner is in play, its content is already the primary
 * collect above, so a separate entry would just be a redundant repeat.
 */
export function getDayCollects(day: LiturgicalDay): ResolvedPart[] {
  const parts: ResolvedPart[] = [{ kind: 'prayer', text: getDayCollect(day) }];
  for (const commemoration of day.commemorations) {
    if (commemoration.kind === 'temporal') {
      parts.push({ kind: 'prayer', text: toResolvedText(getTemporalProper(`${commemoration.id}-collect`)) });
    } else if (commemoration.kind === 'sanctoral') {
      parts.push(sanctoralCommemorationPart(commemoration));
    }
  }
  return parts;
}

/**
 * Lauds' Benedictus antiphon, resolved the same way as getDayCollect: a
 * per-saint `${propers}-antiphon` (already authored during the sanctoral
 * pull, sourced from each saint's own raw [Ant 1] — see e.g.
 * st-lawrence-antiphon.yml) for a sanctoral winner, `${id}-benedictus-
 * antiphon` (not authored yet for any temporal id — resolves "missing",
 * same pending convention as everywhere else) for a temporal one, then
 * `saint.benedictusCommon` (`benedictus-antiphon-${benedictusCommon}.yml`,
 * see SaintRecord's own doc comment) when neither exists — run through
 * `withPaschaltideAlleluia` on the way out, so a Common-category
 * Benedictus antiphon picks up the same seasonal suffix its Prime/Terce/
 * Sext/None counterparts do (see PASCHALTIDE_SEASONS's own doc comment);
 * a saint's own unique `${propers}-antiphon` deliberately isn't — that
 * would need its own live-requery to confirm one way or the other, not
 * assumed from the Common-category finding. Uses resolveOfficeWinner, not
 * the raw `day.winner` — on an octave day this is the octave's own
 * feast's antiphon (live-verified: St. Lawrence's "In cratícula", not the
 * commemorated St. Clare's, and not the plain temporal day's), not a
 * *commemorated* saint's, which is a separate, weaker standing (see
 * getDayCollects/sanctoralCommemorationPart).
 */
export function getBenedictusAntiphon(day: LiturgicalDay): ResolvedText {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal') {
    return toResolvedText(getTemporalProper(`${winner.id}-benedictus-antiphon`));
  }
  const saint = getSaintRecord(winner.id);
  if (saint?.propers) {
    const proper = resolveCommon(`${saint.propers}-antiphon`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
  }
  if (saint?.benedictusCommon) {
    return withPaschaltideAlleluia(resolveCommon(`benedictus-antiphon-${saint.benedictusCommon}`), day);
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
 * versicle text rather than rendered as a separate UI marker.
 *
 * Takes the antiphon's real status and carries it through to both
 * outputs unchanged — previously hardcoded `verified` on everything it
 * touched regardless of the source's actual status (`verifiedText()`),
 * so a `draft` antiphon (e.g. St. Scholastica's, self-translated — see
 * TODO.md) silently lost its "unverified draft text" marker
 * (`src/ui/styles.css`'s `.text-draft`, a dashed underline + tooltip)
 * the moment it passed through here — which every antiphon does, since
 * this is the shared incipit/full split used by every hour. */
export function splitNamedAntiphon(antiphon: ResolvedText): {
  incipit: ResolvedText;
  full: ResolvedText;
} {
  const incipitText: Partial<Record<string, string>> = {};
  const fullText: Partial<Record<string, string>> = {};
  const incipitStatus: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  const fullStatus: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  for (const [lang, t] of Object.entries(antiphon.text)) {
    if (!t) {
      continue;
    }
    const split = splitAntiphon(t);
    incipitText[lang] = `Ant. ${split.incipit}`;
    fullText[lang] = `Ant. ${split.full}`;
    const status = antiphon.status[lang] ?? 'missing';
    incipitStatus[lang] = status;
    fullStatus[lang] = status;
  }
  return { incipit: { text: incipitText, status: incipitStatus }, full: { text: fullText, status: fullStatus } };
}
