// Sanctoral occurrence resolution: given a date, which saint(s) are
// assigned via data/calendar/sanctoral-calendar.yml's day -> saint-id
// mapping, and their rank from data/calendar/saints/<id>.yml. See
// calendar/temporal.ts for the separate temporal-cycle resolution, and
// calendar/commemorations.ts for how a candidate returned here actually
// gets weighed against the day's temporal standing.
//
// Doesn't resolve clashes *among* multiple saints sharing a date — real
// practice has its own precedence/commemoration rules for that too, not
// modeled here. If a day has more than one candidate, calendar/index.ts
// just picks the highest-ranked as the day's sole sanctoral contender.
import type { FeastClass, OctaveConfig } from './types';
import { withRankOverride } from './rank-overrides';
import sanctoralCalendarData from '../data/calendar/sanctoral-calendar.yml';

export interface SaintRecord {
  id: string;
  name: string;
  /** Latin form of `name`, when authored — see calendar/types.ts's
   * `SanctoralIdentity.nameLa` doc comment for the display fallback. */
  nameLa?: string;
  /** Short form of `name` for the browser tab title only (see
   * `ui/format.ts`'s `documentTitle`/`calendar/day-label.ts`'s
   * `getDayTitleName`) — optional, authored only for the handful of names
   * that overflow the title's length cap even after the generic role-
   * clause stripping (e.g. `nativity-bvm.yml`'s "The Nativity of the
   * Blessed Virgin Mary" → "Nativity of the BVM"). 2026-09-09 user
   * decision: an explicit, curated override beats a generic truncation/
   * suffix-stripping heuristic, which risks silently dropping
   * disambiguating text (e.g. which BVM feast) rather than shortening it
   * on purpose. Absent for the vast majority of saints, who don't need
   * one — the tab title falls back to `name` (still role-clause-stripped
   * and, failing that, word-boundary-truncated) when this is missing. */
  titleName?: string;
  /** Latin form of `titleName`, when authored. Rarely needed — the tab
   * title falls back to `nameLa`/`name` for Latin when absent, same
   * fallback chain `nameLa` itself uses. */
  titleNameLa?: string;
  rank: FeastClass;
  common: string;
  propers: string | null;
  /** Parts this feast deliberately has none of (`lauds-responsory`, ...),
   * so the lookup returns nothing instead of inheriting the Common's. */
  noParts?: string[];
  /**
   * Fallback id for the day collect (`getDayCollect`) when this saint has
   * no proper collect of their own (`propers` may still be non-null —
   * e.g. St. Agatha and St. Lucy both have a proper antiphon but a
   * Common-sourced collect) — the *full* id of a `data/propers/common/
   * collect-c*.yml` file (e.g. `collect-c2-1`, not `c2-1` — no suffix
   * gets appended), a *template* with a literal `{N}` standing in for
   * the saint's own name, substituted via `collectName` below.
   * Deliberately more granular than `common` above: the reference
   * source's own Commune files split e.g. "Common of a Martyr Bishop"
   * into several differently-worded collect templates (its own `C2`,
   * `C2-1`, `C2a-1`, `C2b`, `C2b-1` — no clean semantic label recovered
   * for *why* each saint gets a particular one, so these ids trace
   * straight back to the source's own naming, e.g. `collect-c2-1`,
   * rather than inventing a name that might be wrong.
   */
  collectCommon?: string;
  /** The `{N}` substitution values for `collectCommon`'s template, in
   * whatever grammatical case that specific template's own placeholder
   * position needs — taken directly from the reference source's own
   * per-saint `[Name]` section (Latin/English/Sancti or SanctiM
   * `MM-DD.txt`), not re-declined by hand. Arrays, filled in
   * left-to-right against the template's own `{N}` occurrences in
   * document order — most saints need exactly one name, but several
   * Common templates (e.g. `collect-c3`, two co-named Martyr-Bishops)
   * have two or more `{N}` placeholders for a group commemorated
   * together, one array entry per saint in the group. */
  collectName?: { la: string[]; en: string[] };
  /**
   * Common category whose psalmody (Matins/Lauds/Vespers psalm numbers and
   * antiphons) this saint takes, when it differs from `common` -- the
   * engine's own `[Rule]` for Ss. Jerome and Thomas Aquinas is "ex C5"
   * (Confessor not a Bishop) although the app files both under
   * `common-of-a-confessor-doctor`, whose psalmody is the Bishop-Doctors'
   * ("Ecce sacerdos magnus"). Absent for every other saint: `common`
   * governs, see hours/psalmody-common-category.ts.
   */
  psalmodyCommon?: string;
  /**
   * The saint's name as it falls into a Common text's literal "N."
   * (the Doctors' Magnificat antiphon, "beáte N., divínæ legis amátor"):
   * Latin in the vocative, English as plain name. The engine takes the
   * Latin from the saint file's `Ant=` line and renders an unfilled "N."
   * where a file lacks one (Basil, for one); here every doctor has one.
   */
  invocationName?: { la: string; en: string };
  /**
   * The `{N}` substitution value(s) for the Matins invitatory antiphon's
   * own Common template (`hours/matins.ts`'s `resolveMatinsInvitatoryText`,
   * via `hours/resolve-common.ts`'s `substituteName` — the same helper
   * `getDayCollect` already uses for `collectCommon`/`collectName`, just a
   * separate field here since the invitatory's own `{N}` position needs
   * its own grammatical case, not necessarily the same one `collectName`
   * was declined for). Currently only needed for Common-of-a-Holy-Woman
   * (`Commune/C7.txt`'s own `[Invit]`, "Laudémus Deum nostrum * In
   * confessióne beátæ N.." — genitive singular, e.g. "Marthæ") — every
   * other Common category in use has name-free invitatory text. Absent
   * for saints whose Common invitatory antiphon needs no substitution. */
  invitatoryName?: { la: string[]; en: string[] };
  /** See calendar/types.ts's OctaveConfig doc comment. Absent for the vast
   * majority of saints — only ones with a real octave declare it. */
  octave?: OctaveConfig;
  /** Announce this feast in the Martyrology the evening before ("On the
   * morrow we celebrate the feast of ..."), only when it is that day's
   * winner (hours/martyrology-announcement.ts). The wording is generated
   * from `name`, so it follows a transfer, a rename, and a feast the user's
   * calendar doesn't keep. */
  martyrologyAnnouncement?: true;
  /** For a `rank: vigil` record only — the real id of the feast this is
   * the eve of (e.g. `st-andrew`, not derivable from this record's own id
   * by stripping a `vigil-of-` prefix: several vigils' ids don't match
   * their feast's id exactly — `vigil-of-the-assumption` vs `assumption`,
   * `vigil-of-st-james` vs `st-james-the-greater`). Lets
   * calendar/vespers.ts's evening-anticipation merge recognize "today's
   * Vigil is being displaced by the very feast it's the eve of" precisely
   * (rather than guessing from date adjacency alone) and skip
   * commemorating the Vigil redundantly alongside its own feast. */
  vigilOf?: string;
  /** This feast, when it keeps its own Second Vespers (see
   * calendar/vespers.ts's keepsOwnSecondVespers), refuses to commemorate
   * whatever wins the following day there — the feast-side mirror of a
   * privileged Sunday/major-feria refusing a weak commemoration *back*
   * (calendar/commemorations.ts), which vu had no equivalent of at all
   * until this field. Modeled as an explicit per-feast flag rather than
   * porting the reference engine's fractional-rank privilege matrix
   * (crank/rank thresholds, a "Festum Domini" distinction, an outright
   * hardcoded pair exception for Most Precious Blood vs. the Sacred
   * Heart on the rare late-Easter date they collide) — that matches this
   * repo's own "explicit per-feast fact, verified against the live
   * engine one date at a time" convention (same as `vigilOf` above)
   * rather than a general formula applied blanket and hoped correct.
   * Absent (the default) preserves today's status quo: any sanctoral
   * successor gets commemorated regardless of rank. Not yet set on any
   * saint — add only after checking a specific date against the live
   * reference engine, not speculatively for every `duplex-1-classis`
   * feast. NOT a fit for the Precious Blood/Sacred Heart case itself
   * (that exclusion is specific to one neighbor, not "never commemorate
   * anyone" — see this field's own doc comment above) — see TODO.md. */
  forbidsSuccessorCommemoration?: true;
}

const sanctoralCalendar = sanctoralCalendarData as { days: Record<string, string[]> };

const saintModules = import.meta.glob<{ default: SaintRecord }>('../data/calendar/saints/*.yml', {
  eager: true,
});

const saintsById = new Map<string, SaintRecord>();
for (const mod of Object.values(saintModules)) {
  saintsById.set(mod.default.id, mod.default);
}

export interface SanctoralCandidate {
  id: string;
  name: string;
  nameLa?: string;
  rank: FeastClass;
}

/** Which saint(s) (if any) are assigned to this date. `isoDate`'s year is ignored — the sanctoral cycle repeats every civil year. */
/** The saint's full record — used when something more than id/name/rank is
 * needed, e.g. hours/resolve-common.ts's getDayCollect looking up whether
 * a real collect has been authored for a winning saint. */
export function getSaintRecord(id: string): SaintRecord | undefined {
  const saint = saintsById.get(id);
  return saint && withRankOverride(saint);
}

export function getSanctoralCandidatesFor(isoDate: string): SanctoralCandidate[] {
  const monthDay = isoDate.slice(5);
  const ids = sanctoralCalendar.days[monthDay] ?? [];
  return ids.map((id) => {
    const saint = getSaintRecord(id);
    if (!saint) {
      throw new Error(`sanctoral-calendar.yml references unknown saint id '${id}'`);
    }
    return { id: saint.id, name: saint.name, nameLa: saint.nameLa, rank: saint.rank };
  });
}
