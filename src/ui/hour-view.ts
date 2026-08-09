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

function renderPart(part: ResolvedPart, languages: readonly string[]): string {
  switch (part.kind) {
    case 'hymn':
    case 'chapter':
    case 'responsory':
    case 'versicle':
    case 'prayer':
      return `
        <section class="ordo-part ordo-part-${part.kind}">
          <h3 class="ordo-part-label">${hourLabel(part.kind)}</h3>
          ${renderColumns(part.text, languages)}
        </section>
      `;
    case 'psalm':
      return `
        <section class="ordo-part ordo-part-psalm">
          <h3 class="ordo-part-label">Psalm ${part.psalmNumber}</h3>
          ${part.antiphon ? renderColumns(part.antiphon, languages) : ''}
          <ol class="psalm-verses">
            ${part.verses.map((v) => `<li class="psalm-verse">${renderColumns(v, languages)}</li>`).join('')}
          </ol>
        </section>
      `;
    case 'canticle':
      return `
        <section class="ordo-part ordo-part-canticle">
          <h3 class="ordo-part-label">Canticle</h3>
          ${part.antiphon ? renderColumns(part.antiphon, languages) : ''}
        </section>
      `;
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
      ${ordo.parts.map((part) => renderPart(part, languages)).join('')}
    </div>
  `;
}
