import type { PropersRef, ResolvedPart, ResolvedText } from './types';
import type { Commemoration, DayWinner, LiturgicalDay, Weekday } from '../calendar/types';
import type { ProperText } from '../propers';
import { getCommonProper, getTemporalProper } from '../propers';
import { getSaintRecord } from '../calendar/feasts';
import { resolveActiveOctave, activeOctavesFor, octaveGoverningPrivilegedDay, isAtLeast, isSundayOrFeast } from '../calendar';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { isInTriduum } from '../calendar/temporal';
import { splitAntiphon, isDoubleOrHigher } from './antiphon';
import vespersMagnificatAntiphonsData from '../data/hours/vespers-magnificat-antiphons.yml';

type BilingualText = Partial<Record<string, string>>;
type TranslationStatus = 'verified' | 'draft' | 'missing';
interface MagnificatWeekdayDefault {
  antiphon: BilingualText;
  status?: Partial<Record<string, TranslationStatus>>;
}
// Monday-Saturday only — Sunday has no fixed weekday default (its own
// antiphon varies by Proper of the Time; see the data file's own header).
const vespersMagnificatAntiphons = vespersMagnificatAntiphonsData as Partial<
  Record<Weekday, MagnificatWeekdayDefault>
>;

function toResolvedText(proper: ProperText): ResolvedText {
  return { text: proper.text, status: proper.status, citation: proper.citation };
}

/** Shared by every hour's resolver — looks up a common proper by id and
 * shapes it as a ResolvedText. */
export function resolveCommon(id: string): ResolvedText {
  return toResolvedText(getCommonProper(id));
}

/** Terce/Sext/None's own Matins-less hymn 'hymn' case — a plain, fixed,
 * self-contained text with no doxology mechanism at all (the closing
 * doxology is baked directly into each hour's own hymn text file; see
 * {terce,sext,none}-hymn.yml) and no override/season tiering. Byte-
 * identical across all three files before being centralized here. */
export function resolveSelfContainedHymn(part: { textRef: PropersRef }): ResolvedPart[] {
  return [{ kind: 'hymn', text: resolveCommon(part.textRef.id) }];
}

// Named temporal winners with real standing of their own, unconditionally
// override-eligible — see hours/lauds.ts's getPsalmodyOverrideFor, which
// shares this set (imported from here, not duplicated) since it's the
// same "does this temporal identity carry its own real office" question.
export const ALWAYS_OVERRIDE_TEMPORAL_IDS = new Set([
  'marian-saturday',
  'christ-the-king',
  'christmas-octave-sunday',
  'immaculate-heart-of-mary',
]);

/**
 * Which identity's own propers actually supply the office's content
 * (collect, Benedictus antiphon, psalmody override) — usually just
 * `day.winner`, but *not* on a day within an active octave where the
 * temporal day itself has no real standing of its own (`ordinary-feria`),
 * or where a *foreign* octave's own effective rank is strong enough to
 * clear even a privileged day's real threshold
 * (`octaveGoverningPrivilegedDay` — the Immaculate Conception's own
 * octave outright winning several of its days against Advent's
 * privileged-feria-minor ferias, live-verified: Dec 9/10/12/14 at the
 * octave's ordinary Semiduplex, Dec 15 at its own elevated Duplex majus
 * closing day) — an ordinary day within St. Lawrence's own octave, e.g.:
 * live-verified (Tridentine 1910, 2026-08-12) that the
 * chapter/responsory/hymn/versicle, psalms' antiphons, Benedictus
 * antiphon, and day collect all come from the octave's own feast
 * ("{ex Commune aut Festo}" / "{ex Proprio Sanctorum}"), not from the
 * plain temporal day underneath it.
 *
 * Deliberately excludes `christmastide` even though it's otherwise a
 * `privileged-feria-minor` season same as Advent: the Christmas Octave's
 * own stacked octaves (Christmas + Stephen + John + Holy Innocents, e.g.
 * on Dec 30) are the live-verified counterexample — that day's own
 * temporal identity ("Dominica Infra Octavam Nativitatis",
 * `privileged-feria-minor`) is itself a real, named standing, and
 * *keeps* the office ("{ex Proprio de Tempore}") regardless of any of
 * those octaves' own rank; the four octaves there each become their own
 * separate "Commemoratio Octavæ ..." block instead (not yet modeled —
 * see TODO.md), rather than any one of them taking over content the way
 * Lawrence's or the Immaculate Conception's octave does. The dividing
 * line is real standing (own temporal identity vs. a foreign octave
 * merely overlapping a season's ordinary ferias), not merely "is an
 * octave active" — see `octaveGoverningPrivilegedDay`'s own doc comment
 * for the fuller reasoning.
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
  // When more than one octave is active at once (St. Lawrence's and the
  // Assumption's genuinely overlap every Aug 16-17), resolveActiveOctave
  // picks the one that actually governs the day — see its own doc
  // comment for the precedence rule. Falls through to the plain temporal
  // default if that octave turns out to be a temporal-only one with no
  // saint record (e.g. Christmas's or Pentecost's own octave id) — no
  // sanctoral content to synthesize from those.
  const activeOctave =
    day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : octaveGoverningPrivilegedDay(day);
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
 * A day/hour is "ferial or vigil" — the predicate both Lauds' and Vespers'
 * ferial Preces (`lauds-preces`/`vespers-preces`) key off to pick the
 * fuller Tridentine 1906/1910 litany over the short Sunday/feast one.
 * Deliberately not `isSundayOrFeast`/`isSundayOrFeastOffice` — those treat
 * any sanctoral winner, Vigils included, as a "feast." Here a Vigil needs
 * to land on the ferial side instead (per direct instruction), so it's
 * checked for explicitly: a Vigil-ranked sanctoral winner, or a bare
 * temporal winner that isn't Sunday and isn't a named temporal identity
 * like Marian Saturday or Christ the King (which aren't Sunday or a
 * sanctoral winner either, but still aren't a bare ferial office — same
 * reasoning as Lauds' own Cross-suffrage gate). Also excludes any day
 * within an active octave — live-verified (Tridentine 1910, day 3 of St.
 * Lawrence's own octave, both Lauds and Vespers): "Preces Feriales
 * {omittitur}", same exclusion the suffrages already have, for the same
 * reason — an octave day isn't a bare ferial office even though nothing
 * else is winning it outright.
 */
export function isFerialOrVigil(day: LiturgicalDay): boolean {
  const isVigil = day.winner.kind === 'sanctoral' && day.winner.rank === 'vigil';
  const isBareFeria = day.winner.kind === 'temporal' && !getTemporalFeastRecord(day.winner.id);
  const isWithinAnOctave = activeOctavesFor(day.date).length > 0;
  return day.weekday !== 'sunday' && !isWithinAnOctave && (isVigil || isBareFeria);
}

/**
 * A duplex-majus+ saint's own id, or one of the named temporal feasts in
 * ALWAYS_OVERRIDE_TEMPORAL_IDS — the same rank-eligibility test
 * hours/lauds.ts's getPsalmodyOverrideFor uses (and originally
 * duplicated), factored out here so hours/vespers.ts's own per-feast
 * office override (chapter/responsory/hymn/versicle — Vespers has no
 * psalmody-override table of its own to piggyback eligibility on, unlike
 * Lauds) can share the identical eligibility rule. Callers still decide
 * for themselves whether anything's actually been authored for the id
 * returned — same honest incremental-content convention as everywhere
 * else; this only answers "is this day's winner eligible to override at
 * all," not "does an override exist."
 */
export function getOfficeOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(winner.id)) {
    return winner.id;
  }
  if (winner.kind === 'sanctoral' && isAtLeast(winner.rank, 'duplex-majus')) {
    return winner.id;
  }
  return undefined;
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
 * Which seasonal office-content suffix (if any) a day's season maps to —
 * shared by Lauds' and Vespers' own resolveOffice, both of which fall
 * back to the plain weekday default when this is undefined (and both
 * check a per-feast/octave override first, ahead of this). Paschaltide
 * covers eastertide/ascensiontide/pentecost uniformly, matching the
 * source's own single "Pasch" block for both hours — no separate
 * Ascension/Pentecost-specific chapter/hymn exists there.
 */
export function seasonalOfficeSuffix(season: string): string | undefined {
  if (season === 'advent' || season === 'lent' || season === 'passiontide') {
    return season;
  }
  if (PASCHALTIDE_SEASONS.has(season)) {
    return 'paschaltide';
  }
  return undefined;
}

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

export interface OfficeBundle {
  chapter: ResolvedText;
  responsory: ResolvedText;
  hymn: ResolvedText;
  versicle: ResolvedText;
}

/**
 * The chapter/responsory/hymn/versicle bundle following Lauds'/Vespers'
 * psalmody (hours/lauds.ts's and hours/vespers.ts's own resolveOffice) —
 * a saint's own proper bundle (`${hourId}-{part}-${id}`) when authored,
 * else that saint's Common bundle (`${hourId}-{part}-${commonId}`,
 * SaintRecord's main `common` field, not `minorHoursCommon` — this is the
 * saint's overall classification, the same one driving their day collect).
 * Eligibility is deliberately rank-agnostic, `getMinorHourOverrideId`'s
 * test (any sanctoral winner, or a named ALWAYS_OVERRIDE_TEMPORAL_IDS
 * feast) rather than resolveOffice's old duplex-majus+-only gate: a
 * simplex feast's own or Common's chapter/hymn is real, distinct
 * liturgical content, not something only strong feasts are entitled to —
 * confirmed 2026-08-25 (St. Louis, King of France, simplex, was silently
 * falling all the way to the plain ferial default instead of his Common
 * of a Confessor Not Bishop). Same honest "eligible, not gated on whether
 * content exists" convention as everywhere else: returns `undefined` when
 * neither the proper nor the Common has this bundle authored yet, so the
 * caller falls through to its own seasonal/weekday default.
 *
 * `resolveChapterFor` lets Vespers reuse its own chapter lookup (which
 * itself falls back to the byte-identical Lauds capitulum file when no
 * `vespers-capitulum-<id>.yml` exists — see vespersCapitulumForOverride)
 * instead of the plain `${hourId}-capitulum-${id}` default used here.
 */
export function resolveOfficeBundle(
  hourId: string,
  day: LiturgicalDay,
  resolveChapterFor: (id: string) => ResolvedText = (id) => resolveCommon(`${hourId}-capitulum-${id}`),
): OfficeBundle | undefined {
  const overrideId = getMinorHourOverrideId(day);
  if (!overrideId) {
    return undefined;
  }
  const tryId = (id: string): OfficeBundle | undefined => {
    const chapter = resolveChapterFor(id);
    if (chapter.status.la === 'missing' && chapter.status.en === 'missing') {
      return undefined;
    }
    return {
      chapter,
      responsory: resolveResponsory(resolveCommon(`${hourId}-responsory-${id}`), day),
      hymn: resolveCommon(`${hourId}-hymn-${id}`),
      versicle: resolveCommon(`${hourId}-versicle-${id}`),
    };
  };
  const proper = tryId(overrideId);
  if (proper) {
    return proper;
  }
  const commonId = getSaintRecord(overrideId)?.common;
  return commonId ? tryId(commonId) : undefined;
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

/** An octave commemoration's own rendering — the fuller "Commemoratio
 * Octavæ ..." Ant+V/R+collect bundle (`${id}-octave-commemoration`, e.g.
 * christmas-day-octave-commemoration.yml), same shape and fallback
 * pattern as sanctoralCommemorationPart. No per-saint `propers`
 * indirection needed: an octave commemoration's id already is the base
 * feast/saint id (`christmas-day`, `st-stephen-protomartyr`, ...),
 * matching the proper file's own id 1:1. */
function octaveCommemorationPart(commemoration: Extract<Commemoration, { kind: 'octave' }>): ResolvedPart {
  const label = `Commemoration of the Octave of ${commemoration.name}`;
  const combined = resolveCommon(`${commemoration.id}-octave-commemoration`);
  if (combined.status.la !== 'missing' || combined.status.en !== 'missing') {
    return { kind: 'preces', text: combined, label };
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
 * collect here renders as its own complete, separate block instead.
 *
 * An octave commemoration skips rendering its own block here only when
 * it's the *specific* octave whose content resolveOfficeWinner already
 * substituted as the primary collect above (same
 * `day.temporalCategory === 'ordinary-feria'` gate, same
 * `resolveActiveOctave` pick — see resolveOfficeWinner's own doc
 * comment) — rendering it again would be a redundant repeat. Every
 * *other* simultaneously-active octave still gets its own block: e.g.
 * Aug 17, St. Lawrence's own elevated closing day and the Assumption's
 * ordinary day 3 genuinely overlap — Lawrence's own content governs the
 * primary collect (the higher-ranked of the two, resolveActiveOctave's
 * own pick), but the Assumption's octave is still real and distinct, not
 * a duplicate of Lawrence's, so it still renders its own commemoration
 * block here (once authored). On a day the temporal identity itself
 * keeps real standing (the Christmas Octave's own stacking days, e.g.
 * Dec 26-31), resolveOfficeWinner never substitutes anything, so no
 * octave is skipped and every active one renders here — the only place
 * those four octaves' real "Commemoratio Octavæ ..." content surfaces.
 */
export function getDayCollects(day: LiturgicalDay): ResolvedPart[] {
  const parts: ResolvedPart[] = [{ kind: 'prayer', text: getDayCollect(day) }];
  // Mirrors resolveOfficeWinner's own gate: an octave only actually
  // supplied the primary collect when the day's winner itself wasn't a
  // real sanctoral feast (or one of the ALWAYS_OVERRIDE_TEMPORAL_IDS) —
  // otherwise the winner's own content stood on its own (e.g. St.
  // Bernard, Aug 20, outright beats the Assumption octave's threshold)
  // and the octave still needs its own commemoration block below.
  const substitutedOctaveId =
    day.winner.kind !== 'sanctoral' && !ALWAYS_OVERRIDE_TEMPORAL_IDS.has(day.winner.id) && day.temporalCategory === 'ordinary-feria'
      ? resolveActiveOctave(day.date)?.id
      : undefined;
  for (const commemoration of day.commemorations) {
    if (commemoration.kind === 'temporal') {
      parts.push({ kind: 'prayer', text: toResolvedText(getTemporalProper(`${commemoration.id}-collect`)) });
    } else if (commemoration.kind === 'sanctoral') {
      parts.push(sanctoralCommemorationPart(commemoration));
    } else if (commemoration.kind === 'octave' && commemoration.id !== substitutedOctaveId) {
      parts.push(octaveCommemorationPart(commemoration));
    }
  }
  return parts;
}

const SUFFRAGE_IDS = ['lauds-suffrage-cross', 'lauds-suffrage-bvm', 'lauds-suffrage-joseph', 'lauds-suffrage-apostles', 'lauds-suffrage-peace'];
const SUFFRAGE_LABELS: Record<string, string> = {
  'lauds-suffrage-cross': 'Of the Holy Cross',
  'lauds-suffrage-bvm': 'Of the Blessed Virgin Mary',
  'lauds-suffrage-joseph': 'Of St. Joseph',
  'lauds-suffrage-apostles': 'Of the Holy Apostles Peter and Paul',
  'lauds-suffrage-peace': 'For Peace',
};

/**
 * The four fixed Tridentine suffrages (Holy Cross, BVM, Joseph, Ss. Peter
 * & Paul, Peace), said after the day's collect(s) — shared by Lauds and
 * Vespers (live-verified 2026-08-25: Monastic Tridentinum 1617 renders
 * the identical "Suffragium" block, same four antiphons/prayers, after
 * *both* hours, not just Lauds — vu previously only had this mechanism
 * wired up at Lauds, an honest content gap rather than a deliberate
 * Lauds-only design). `omitOnDouble` gates the whole set at once (real
 * practice: suffrages drop on a Double-or-higher feast) — see below for
 * the caveat on what real practice also suppresses them for that isn't
 * modeled.
 */
export function resolveSuffrages(day: LiturgicalDay, omitOnDouble: boolean | undefined): ResolvedPart[] {
  // isDoubleOrHigher only ever looks at a sanctoral rank — Christ the
  // King is modeled as a named temporal winner (see
  // ALWAYS_OVERRIDE_TEMPORAL_IDS above) with no FeastClass to check at
  // all, so it needs its own explicit inclusion here. Confirmed live:
  // "Suffragium{omittitur}" — the whole set drops, same as any other
  // Double-or-higher day.
  const isChristTheKing = day.winner.kind === 'temporal' && day.winner.id === 'christ-the-king';
  // Confirmed live against Monastic Tridentinum 1617 directly (this
  // isn't a Tridentine-1906-only quirk -- the same exclusions hold
  // under the app's own primary rubric track): suffrages are omitted
  // *entirely* during Advent, Christmastide, and Passiontide (not all
  // of Lent -- ordinary Lent ferias still get them, checked directly
  // against 2026-02-20; only the last two weeks), and on any day
  // within an active octave, however low that octave's own rank is
  // -- checked directly against day 3 of St. Lawrence's own
  // (Semiduplex) octave, which still omits them despite being well
  // below the Duplex+ rank threshold below.
  const isSeasonallyExcluded = day.season === 'advent' || day.season === 'christmastide' || day.season === 'passiontide';
  const isWithinAnOctave = activeOctavesFor(day.date).length > 0;
  if (omitOnDouble && (isDoubleOrHigher(day.winner) || isChristTheKing || isSeasonallyExcluded || isWithinAnOctave)) {
    return [];
  }
  // "Of the Holy Cross" is the real *ferial*-office suffrage, sourced
  // from Tridentine 1906/1910 (a different track than the other four,
  // which come from Monastic 1617 -- that track has no Cross suffrage
  // at Lauds at all) -- live-verified against a plain ferial win, a
  // plain Sunday win, a low-rank saint's own win (even bare Simplex),
  // and Marian Saturday: Cross shows only when the bare temporal
  // feria itself is what's being prayed -- the exact *opposite* of
  // "Sunday or a feast of the Lord." In this app's own vocabulary,
  // that's `!isSundayOrFeast(day)` (the same ferial/festive split
  // Prime's capitulum already keys off) with one more exclusion for a
  // named temporal identity like Marian Saturday, which isn't Sunday
  // or a sanctoral winner either but still isn't a bare ferial office.
  const showCross = !isSundayOrFeast(day) && !(day.winner.kind === 'temporal' && getTemporalFeastRecord(day.winner.id));
  // "Of the Blessed Virgin Mary" is omitted specifically when the
  // day's own office is already Marian (would be redundant to
  // suffrage Mary again on her own day) -- confirmed live on Marian
  // Saturday (Simplex-strength, so it reaches this far rather than
  // being excluded outright above); the only case this app currently
  // has of a day using the Marian common below the suffrage-omitting
  // Duplex+ threshold (every actual Marian *feast* modeled so far is
  // Duplex-majus+ and already returns above).
  const isMarianSaturday = day.winner.kind === 'temporal' && day.winner.id === 'marian-saturday';
  const ids = SUFFRAGE_IDS.filter((id) => {
    if (id === 'lauds-suffrage-cross') return showCross;
    if (id === 'lauds-suffrage-bvm') return !isMarianSaturday;
    return true;
  });
  return ids.map((id) => ({
    kind: 'preces' as const,
    text: resolveCommon(id),
    label: SUFFRAGE_LABELS[id],
  }));
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

/**
 * Vespers' Magnificat antiphon — mirrors getBenedictusAntiphon's lookup
 * order exactly (temporal id, then a saint's own `${propers}-magnificat-
 * antiphon`, then their Common category's `magnificat-antiphon-${common}`
 * — none of that content authored yet, a separate future pass the same
 * shape as the Benedictus one was), but with one real difference: a bare
 * ferial weekday (Mon-Sat) has actual content to fall back to —
 * data/hours/vespers-magnificat-antiphons.yml's classic "quote the
 * Magnificat's own text in sequence" set — which Benedictus has no
 * equivalent of. `withPaschaltideAlleluia` applied to that fallback too,
 * by analogy with the Common-category treatment above; not independently
 * confirmed for this specific case.
 */
export function getMagnificatAntiphon(day: LiturgicalDay): ResolvedText {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal') {
    const named = toResolvedText(getTemporalProper(`${winner.id}-magnificat-antiphon`));
    if (named.status.la !== 'missing' || named.status.en !== 'missing') {
      return named;
    }
    const weekdayDefault = vespersMagnificatAntiphons[day.weekday];
    if (weekdayDefault) {
      const resolved = weekdayDefault.status
        ? { text: weekdayDefault.antiphon, status: weekdayDefault.status }
        : verifiedText(weekdayDefault.antiphon);
      return withPaschaltideAlleluia(resolved, day);
    }
    return named;
  }
  const saint = getSaintRecord(winner.id);
  if (saint?.propers) {
    const proper = resolveCommon(`${saint.propers}-magnificat-antiphon`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
  }
  if (saint?.benedictusCommon) {
    return withPaschaltideAlleluia(resolveCommon(`magnificat-antiphon-${saint.benedictusCommon}`), day);
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

/** The antiphon actually shown *before* a psalm/canticle: full text on a
 * Double-rank winner or higher, incipit only below that (see
 * `isDoubleOrHigher`'s own doc comment for the underlying rule) — the one
 * idiom every hour's psalmody independently repeated (`splitNamedAntiphon`
 * + `isDoubleOrHigher(...) ? full : incipit`) before being centralized
 * here. The closing repeat after the psalm/canticle is always `full`,
 * unconditionally, at each call site — this helper only decides the
 * opening. */
export function openingAntiphon(antiphon: ResolvedText, winner: DayWinner): ResolvedText {
  const { incipit, full } = splitNamedAntiphon(antiphon);
  return isDoubleOrHigher(winner) ? full : incipit;
}

/** Fixed wording, same as lauds.ts's weekday-canticle Gloria Patri —
 * appended after every psalm (hours/index.ts) except during the Sacred
 * Triduum. Not "verified" via verifiedText() because it's boilerplate
 * used everywhere, not a sourced proper text. */
const GLORIA_PATRI: BilingualText = {
  la: 'V. Glória Patri, et Fílio, * et Spirítui Sancto.\nR. Sicut erat in princípio, et nunc, et semper, * et in sǽcula sæculórum. Amen.',
  en: 'V. Glory be to the Father, and to the Son, * and to the Holy Ghost.\nR. As it was in the beginning, is now, * and ever shall be, world without end. Amen.',
};

/** The closing Gloria Patri for a psalm, or `undefined` during the Sacred
 * Triduum (calendar/temporal.ts's isInTriduum) when it's omitted
 * entirely — not just seasonally varied wording, an actual omission. */
export function resolveGloriaPatri(day: LiturgicalDay): ResolvedText | undefined {
  if (isInTriduum(day.date)) {
    return undefined;
  }
  return verifiedText(GLORIA_PATRI);
}

// The responsory's own closing Gloria is a DIFFERENT rule from the psalm/
// canticle one above: wider window (all of Passiontide, Passion Sunday
// through Holy Saturday -- `season === 'passiontide'` already covers
// exactly that span, no separate date-window helper needed), and it
// doesn't apply to a Sancti (saint) feast's own day even within that
// window -- live-verified: St. Joseph (Duplex I, 2027-03-19, landing in
// Passiontide that year) keeps "In manus tuas"'s Gloria at Compline, while
// an ordinary ferial day in the same window (2027-03-15) omits it, at both
// Compline and Prime's chapter-responsory.
//
// Every currently-authored responsory -- Gloria-bearing or already
// Gloria-free (e.g. lauds-responsory-passiontide.yml, a genuinely
// different proper-of-season chant, not a stripped copy of the ordinary
// one) -- ends the same way regardless: a short "R. [repetenda]" after
// the verse, then (only when shown) this same fixed Gloria line, then
// always a final "R. [full repetenda]" line. So the two forms differ by
// exactly one known, fixed-wording line -- omitting it is a filter, not a
// data migration.
const RESPONSORY_GLORIA_LINE: BilingualText = {
  la: 'V. Glória Patri, et Fílio, * et Spirítui Sancto.',
  en: 'V. Glory be to the Father, and to the Son, * and to the Holy Ghost.',
};

export function omitResponsoryGloria(day: LiturgicalDay): boolean {
  return day.season === 'passiontide' && day.winner.kind !== 'sanctoral';
}

/** Strips the responsory's closing Gloria line from `text` when the day
 * calls for its omission (see omitResponsoryGloria); returns `text`
 * unchanged otherwise. Safe to call on already-Gloria-free text (e.g. the
 * proper-of-season responsories) -- the line just won't be found. */
export function resolveResponsory(text: ResolvedText, day: LiturgicalDay): ResolvedText {
  if (!omitResponsoryGloria(day)) {
    return text;
  }
  const stripped: Partial<Record<string, string>> = {};
  for (const [lang, t] of Object.entries(text.text)) {
    const gloriaLine = RESPONSORY_GLORIA_LINE[lang];
    stripped[lang] = t && gloriaLine ? t.split('\n').filter((line) => line !== gloriaLine).join('\n') : t;
  }
  return { ...text, text: stripped };
}
