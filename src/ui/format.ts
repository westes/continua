// Latin month names have no Intl locale data, so the genitive forms below
// (used the same way English "of August" would be, e.g. "18 Augusti 2026")
// are authored directly here.
const MONTH_LABELS_LA = [
  'Ianuarii',
  'Februarii',
  'Martii',
  'Aprilis',
  'Maii',
  'Iunii',
  'Iulii',
  'Augusti',
  'Septembris',
  'Octobris',
  'Novembris',
  'Decembris',
];

const WEEKDAY_LABELS_LA = ['Dominica', 'Feria Secunda', 'Feria Tertia', 'Feria Quarta', 'Feria Quinta', 'Feria Sexta', 'Sabbato'];

/** Formats an ISO date as e.g. "Sunday, August 9, 2026" (`en`) / "Dominica,
 * die 9 Augusti 2026" (`la`) — always in UTC so it matches
 * calendar/weekday.ts's interpretation regardless of the viewer's local
 * timezone. Weekday naming mirrors calendar/day-label.ts's own
 * `WEEKDAY_LABELS` (spelled-out Latin ferial names, not roman numerals). */
export function formatDateLong(isoDate: string): Partial<Record<string, string>> {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const en = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  const day = date.getUTCDate();
  const month = MONTH_LABELS_LA[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const weekday = WEEKDAY_LABELS_LA[date.getUTCDay()];
  const la = `${weekday}, die ${day} ${month} ${year}`;

  return { en, la };
}

const RELATIVE_TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
];

/** "3 days ago" / "just now" from an ISO timestamp -- used for the About
 * panel's "last updated" line (`version.ts`'s `APP_VERSION_DATE`). */
export function formatRelativeTime(isoTimestamp: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(isoTimestamp).getTime();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    const value = Math.floor(diffMs / ms);
    if (value >= 1) return rtf.format(-value, unit);
  }
  return rtf.format(0, 'minute');
}

export function hourLabel(hourId: string): string {
  return hourId.charAt(0).toUpperCase() + hourId.slice(1);
}

const TITLE_CELEBRATION_MAX_LENGTH = 40;

// Words that classify *what sort of* saint this is (bishop, martyr,
// confessor, ...) rather than *who* they are — a saint's name field
// spells these out as a trailing ", Bishop and Confessor" / ", Martyres"
// clause (see e.g. `st-lawrence-justinian.yml`'s "St. Lawrence Justinian,
// Bishop and Confessor"), which is exactly the kind of detail this title
// isn't for: scanning tabs is done by who's being celebrated, not what
// category they fall in. Only English/Latin nominative forms are listed
// since those are the only cases `name`/`nameLa` fields actually use.
const ROLE_TITLE_WORDS = new Set([
  'and', 'of', 'et', 'the',
  'church', 'ecclesiæ', 'ecclesiae',
  'pope', 'popes', 'papa', 'papæ',
  'bishop', 'bishops', 'episcopus', 'episcopi',
  'martyr', 'martyrs', 'martyres',
  'confessor', 'confessors', 'confessores',
  'virgin', 'virgins', 'virgo', 'virgines',
  'apostle', 'apostles', 'apostolus', 'apostoli',
  'doctor', 'doctors', 'doctores',
  'abbot', 'abbots', 'abbas', 'abbates',
  'deacon', 'deacons', 'diaconus', 'diaconi',
  'king', 'kings', 'rex', 'reges',
  'widow', 'widows', 'vidua', 'viduæ',
  'founder', 'founders',
  'priest', 'priests', 'sacerdos', 'sacerdotes',
  'evangelist', 'evangelists', 'evangelista', 'evangelistæ',
]);

/** Strips trailing ", <role words>" clauses (see `ROLE_TITLE_WORDS`) off a
 * name — but only when every word in the last comma-separated clause is
 * one of them, so a real name segment after a comma (e.g. "Ss. Basilides,
 * Cyrinus, Nabor, and Nazarius") is left alone right up to the trailing
 * clauses that actually are just role descriptions. Loops because a name
 * can stack more than one such clause (e.g. "St. Augustine of Hippo,
 * Bishop, Confessor and Doctor of the Church" sheds ", Confessor and
 * Doctor of the Church" and then ", Bishop" in two passes). */
function stripRoleDescriptor(name: string): string {
  let current = name;
  for (;;) {
    const lastComma = current.lastIndexOf(',');
    if (lastComma === -1) return current;
    const clause = current.slice(lastComma + 1).trim();
    const words = clause.split(/\s+/).filter(Boolean);
    if (words.length === 0 || !words.every((word) => ROLE_TITLE_WORDS.has(word.toLowerCase()))) {
      return current;
    }
    current = current.slice(0, lastComma);
  }
}

/** Browser tab title: "Continua · Hour · Celebration" — enough to tell tabs
 * apart when several hours/days are open at once, without the full
 * commemoration list `getDayLabel` appends (that's for the page header,
 * not for scanning tabs by "which one am I looking for"). `titleName` is
 * `calendar/day-label.ts`'s `getDayTitleName(day)` — the day's own primary
 * identity alone, preferring each record's authored `titleName`/
 * `titleNameLa` over its full name wherever the app has one (2026-09-09
 * user decision: an explicit, curated short form beats a generic
 * truncation/suffix-stripping heuristic, which risks silently dropping
 * disambiguating text rather than shortening it on purpose — an earlier
 * version of this function tried exactly that heuristic and still left
 * "Nativity of the Blessed…" on the Nativity BVM's own octave title).
 * `getDayTitleName` returns `undefined` for the one branch with no named
 * record to shorten (the plain ordinal label, e.g. "Wednesday in the 11th
 * week after Trinity") — `dayLabel` (`getDayLabel`'s own output) is the
 * fallback for that case: every branch there joins the primary name and
 * any trailing commemorations/transfer notes with the same ` — `
 * separator, so splitting on it and taking the first piece reliably
 * recovers just the primary celebration. Either way, the rank
 * parenthetical every `getDayLabel` branch appends to its primary name
 * (e.g. "St. Jerome (Duplex)") and any trailing "what sort of saint"
 * clause (e.g. "St. Lawrence Justinian, Bishop and Confessor") are
 * stripped, and the result is truncated if it's still long — none of that
 * is what you're scanning tabs for, just the name. */
export function documentTitle(
  hourId: string,
  dayLabel: Partial<Record<string, string>>,
  languages: readonly string[],
  titleName?: Partial<Record<string, string>>,
): string {
  const primaryLanguage = languages[0] ?? 'en';
  const fullLabel = dayLabel[primaryLanguage] ?? dayLabel.en ?? dayLabel.la ?? '';
  const titlePrimary = titleName?.[primaryLanguage] ?? titleName?.en ?? titleName?.la;
  const primary = titlePrimary ?? (fullLabel.split(' — ')[0] ?? '').replace(/ \([^()]*\)$/, '');
  let celebration = stripRoleDescriptor(primary);
  if (celebration.length > TITLE_CELEBRATION_MAX_LENGTH) {
    // Trim back to the last whole word before the cap, so a long name
    // (e.g. an octave of the Nativity/Immaculate Conception/Sacred Heart)
    // ends in "…" after a real word rather than a chopped-off fragment
    // mid-word. Falls back to the hard slice only for the pathological
    // case of a single word longer than the whole cap.
    const truncated = celebration.slice(0, TITLE_CELEBRATION_MAX_LENGTH - 1);
    const lastSpace = truncated.lastIndexOf(' ');
    celebration = `${lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated}…`;
  }
  const parts = ['Continua', hourLabel(hourId), celebration].filter(Boolean);
  return parts.join(' · ');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Renders one `<div class="lang-column">` per currently-active language
 * for a bilingual text map — the same pattern hour-view.ts's own
 * `renderColumns` uses for resolved liturgical text, shared here so
 * day-nav.ts's header can reuse it instead of re-implementing it. */
export function renderBilingual(text: Partial<Record<string, string>>, languages: readonly string[], className: string): string {
  const cols = languages
    .map((lang) => `<div class="lang-column" lang="${lang}">${escapeHtml(text[lang] ?? '')}</div>`)
    .join('');
  return `<div class="${className} lang-columns lang-columns-${languages.length}">${cols}</div>`;
}
