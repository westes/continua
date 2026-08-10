import { getState } from '../app-state';
import { resolveOrdo } from '../hours';
import type { ResolvedPart, ResolvedText, ResolvedVerse } from '../hours/types';
import { hourLabel } from './format';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cellFor(resolved: ResolvedText | ResolvedVerse, lang: string): string {
  const status = resolved.status[lang] ?? 'missing';
  const text = resolved.text[lang];
  if (status === 'missing' || !text) {
    return '<span class="text-pending">(translation pending)</span>';
  }
  const escaped = escapeHtml(text);
  return status === 'draft' ? `<span class="text-draft" title="unverified draft text">${escaped}</span>` : escaped;
}

function renderColumns(resolved: ResolvedText | ResolvedVerse, languages: readonly string[]): string {
  const cols = languages
    .map((lang) => `<div class="lang-column" lang="${lang}">${cellFor(resolved, lang)}</div>`)
    .join('');
  return `<div class="lang-columns lang-columns-${languages.length}">${cols}</div>`;
}

// Scripture quotations always carry a full citation (book, chapter, verse) —
// shown once, deduplicated across languages when they happen to match.
function renderCitation(text: ResolvedText): string {
  if (!text.citation) {
    return '';
  }
  const values = [...new Set(Object.values(text.citation).filter((v): v is string => Boolean(v)))];
  return values.length ? `<p class="ordo-part-citation">${escapeHtml(values.join(' / '))}</p>` : '';
}

function renderPart(part: ResolvedPart, languages: readonly string[]): string {
  switch (part.kind) {
    case 'hymn':
    case 'chapter':
    case 'prayer':
      return `
        <section class="ordo-part ordo-part-${part.kind}">
          <h3 class="ordo-part-label">${hourLabel(part.kind)}</h3>
          ${renderCitation(part.text)}
          ${renderColumns(part.text, languages)}
        </section>
      `;
    // Short liturgical dialogue — reads fine without a jargon label.
    case 'responsory':
    case 'versicle':
      return `
        <section class="ordo-part ordo-part-${part.kind}">
          ${renderColumns(part.text, languages)}
        </section>
      `;
    case 'antiphon':
      return `
        <section class="ordo-part ordo-part-antiphon">
          ${renderColumns(part.text, languages)}
        </section>
      `;
    case 'preces':
      return `
        <section class="ordo-part ordo-part-preces">
          ${part.label ? `<h3 class="ordo-part-label">${escapeHtml(part.label)}</h3>` : ''}
          ${renderColumns(part.text, languages)}
        </section>
      `;
    case 'lesson':
      return `
        <section class="ordo-part ordo-part-lesson">
          <h3 class="ordo-part-label">${part.label ? escapeHtml(part.label) : 'Reading'}</h3>
          ${renderCitation(part.text)}
          ${renderColumns(part.text, languages)}
        </section>
      `;
    case 'psalm': {
      // Always cite the full range, not just the psalm number — a 4-verse
      // slice of Psalm 118 is a different citation from the whole psalm.
      const first = part.verses[0]?.n;
      const last = part.verses[part.verses.length - 1]?.n;
      const citation =
        first === undefined
          ? `Psalm ${part.psalmNumber}`
          : first === last
            ? `Psalm ${part.psalmNumber}:${first}`
            : `Psalm ${part.psalmNumber}:${first}-${last}`;
      return `
        <section class="ordo-part ordo-part-psalm">
          ${part.antiphon ? renderColumns(part.antiphon, languages) : ''}
          <h3 class="ordo-part-label">${citation}</h3>
          <ol class="psalm-verses">
            ${part.verses.map((v) => `<li class="psalm-verse">${renderColumns(v, languages)}</li>`).join('')}
          </ol>
        </section>
      `;
    }
    case 'canticle': {
      const title = part.canticleId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return `
        <section class="ordo-part ordo-part-canticle">
          ${part.antiphon ? renderColumns(part.antiphon, languages) : ''}
          <h3 class="ordo-part-label">${escapeHtml(title)}</h3>
          ${renderCitation(part.text)}
          ${renderColumns(part.text, languages)}
        </section>
      `;
    }
  }
}

export function renderHourView(container: HTMLElement): void {
  const { date, selectedHour, languages } = getState();
  const ordo = resolveOrdo(selectedHour, date);

  if (ordo.notImplemented) {
    container.innerHTML = `
      <div class="hour-view hour-view-pending">
        <h2>${hourLabel(selectedHour)}</h2>
        <p>This hour hasn't been built yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="hour-view">
      <h2>${hourLabel(selectedHour)}</h2>
      ${ordo.dayLabel ? `<p class="day-label">${escapeHtml(ordo.dayLabel)}</p>` : ''}
      ${ordo.parts.map((part) => renderPart(part, languages)).join('')}
    </div>
  `;
}
