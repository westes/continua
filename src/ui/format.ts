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

/** Browser tab title: "vu · Hour · Celebration" — enough to tell tabs
 * apart when several hours/days are open at once, without the full
 * commemoration list `getDayLabel` appends (that's for the page header,
 * not for scanning tabs by "which one am I looking for"). `dayLabel` is
 * `getDayLabel`'s output; every one of its branches joins the primary
 * name and any trailing commemorations/transfer notes with the same
 * ` — ` separator, so splitting on it and taking the first piece reliably
 * recovers just the primary celebration, truncated if it's still long. The
 * rank parenthetical every branch appends to that primary name (e.g. "St.
 * Jerome (Duplex)") and any trailing "what sort of saint" clause (e.g.
 * "St. Lawrence Justinian, Bishop and Confessor") are stripped too —
 * neither is what you're scanning tabs for, just the name. */
export function documentTitle(hourId: string, dayLabel: Partial<Record<string, string>>, languages: readonly string[]): string {
  const primaryLanguage = languages[0] ?? 'en';
  const fullLabel = dayLabel[primaryLanguage] ?? dayLabel.en ?? dayLabel.la ?? '';
  let celebration = stripRoleDescriptor((fullLabel.split(' — ')[0] ?? '').replace(/ \([^()]*\)$/, ''));
  if (celebration.length > TITLE_CELEBRATION_MAX_LENGTH) {
    celebration = `${celebration.slice(0, TITLE_CELEBRATION_MAX_LENGTH - 1)}…`;
  }
  const parts = ['vu', hourLabel(hourId), celebration].filter(Boolean);
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
