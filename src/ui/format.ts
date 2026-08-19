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
