import { getState } from '../app-state';
import { resolveOrdo } from '../hours';
import type { ResolvedPart, ResolvedText, ResolvedVerse } from '../hours/types';
import { hourLabel } from './format';
import { tryGetCanticleName } from '../hours/lauds-canticles';

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
// shown once per currently-displayed language, deduplicated when they
// happen to match (e.g. a plain "Psalm 118" citation reused verbatim in
// both columns) — restricted to `languages` so a language-specific
// abbreviation (Latin "Jac 1:12" vs. English "Jas 1:12") never leaks into
// a single-language view.
function renderCitation(text: ResolvedText, languages: readonly string[]): string {
  if (!text.citation) {
    return '';
  }
  const values = [
    ...new Set(languages.map((lang) => text.citation![lang]).filter((v): v is string => Boolean(v))),
  ];
  return values.length ? `<p class="ordo-part-citation">${escapeHtml(values.join(' / '))}</p>` : '';
}

// A lesson's `label` is either a plain string (an editorial attribution
// written once and reused in both language columns) or a per-language
// object (a genuine translation, e.g. an octave reading's Latin incipit
// vs. its English title) — render the latter as its own lang-columns row
// matching the body text underneath it.
function renderLessonLabel(
  label: string | Partial<Record<string, string>> | undefined,
  languages: readonly string[],
  fallback = 'Reading',
): string {
  if (!label) {
    return `<h3 class="ordo-part-label">${escapeHtml(fallback)}</h3>`;
  }
  if (typeof label === 'string') {
    return `<h3 class="ordo-part-label">${escapeHtml(label)}</h3>`;
  }
  const cols = languages
    .map((lang) => `<span class="lang-column" lang="${lang}">${escapeHtml(label[lang] ?? '')}</span>`)
    .join('');
  return `<h3 class="ordo-part-label lang-columns lang-columns-${languages.length}">${cols}</h3>`;
}

function renderPart(part: ResolvedPart, languages: readonly string[]): string {
  switch (part.kind) {
    case 'hymn':
    case 'chapter':
    case 'prayer':
      return `
        <section class="ordo-part ordo-part-${part.kind}">
          <h3 class="ordo-part-label">${hourLabel(part.kind)}</h3>
          ${renderCitation(part.text, languages)}
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
          ${renderLessonLabel(part.label, languages)}
          ${renderCitation(part.text, languages)}
          ${renderColumns(part.text, languages)}
          ${part.responsory ? `<div class="ordo-part-responsory">${renderColumns(part.responsory, languages)}</div>` : ''}
        </section>
      `;
    // A Gospel pericope, with its paired patristic homily (when authored)
    // nested right after it in the same section rather than as a separate
    // pool entry — see hours/matins.ts's buildReadingPool, which combines
    // the two into one atomic part specifically so they can never end up in
    // different nocturns. `part.source` (rare — see the 'gospel' type's own
    // doc comment) is homily attribution already folded into the pericope's
    // own text at the data layer; `part.homily`, when present, is a
    // genuinely separate reading, rendered with its own label underneath.
    case 'gospel':
      return `
        <section class="ordo-part ordo-part-lesson ordo-part-gospel">
          ${renderLessonLabel(part.label, languages, 'Gospel')}
          ${renderCitation(part.text, languages)}
          ${renderColumns(part.text, languages)}
          ${part.source ? `<p class="ordo-part-citation">${escapeHtml(part.source)}</p>` : ''}
          ${
            part.homily
              ? `
            <div class="ordo-part-homily">
              ${renderLessonLabel(part.homily.source, languages)}
              ${renderColumns(part.homily.text, languages)}
            </div>
          `
              : ''
          }
          ${part.responsory ? `<div class="ordo-part-responsory">${renderColumns(part.responsory, languages)}</div>` : ''}
        </section>
      `;
    case 'psalm': {
      // Cite a bare "Psalm 50" when the whole chantable psalm is being
      // said; only an explicit sub-portion (a stanza of Psalm 118/138/
      // 143/144, e.g. "Psalm 118:1-10") gets verse numbers, since that's
      // a genuinely different citation from the whole psalm.
      const citation = part.verseRange ? `Psalm ${part.psalmNumber}:${part.verseRange}` : `Psalm ${part.psalmNumber}`;
      return `
        <section class="ordo-part ordo-part-psalm">
          ${part.antiphon ? renderColumns(part.antiphon, languages) : ''}
          <h3 class="ordo-part-label">${citation}</h3>
          <div class="psalm-verses">
            ${part.verses.map((v) => `<div class="psalm-verse">${renderColumns(v, languages)}</div>`).join('')}
          </div>
          ${part.gloriaPatri ? `<div class="ordo-part-gloria-patri">${renderColumns(part.gloriaPatri, languages)}</div>` : ''}
        </section>
      `;
    }
    case 'canticle': {
      // The Latin title is always the id capitalized (it's already Latin —
      // canticum-ezechiae -> "Canticum Ezechiae"). English only matches
      // that pattern for names already conventional untranslated in
      // English (Benedictus, Magnificat, Nunc Dimittis); the 7 Lauds
      // weekday OT canticles have a real English name (e.g. "Canticle of
      // Ezechias") authored separately — see lauds-canticles.ts.
      const derivedTitle = part.canticleId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const title: Partial<Record<string, string>> = {
        la: derivedTitle,
        en: tryGetCanticleName(part.canticleId) ?? derivedTitle,
      };
      const titleCols = languages
        .map((lang) => `<span class="lang-column" lang="${lang}">${escapeHtml(title[lang] ?? derivedTitle)}</span>`)
        .join('');
      return `
        <section class="ordo-part ordo-part-canticle">
          ${part.antiphon ? renderColumns(part.antiphon, languages) : ''}
          <h3 class="ordo-part-label lang-columns lang-columns-${languages.length}">${titleCols}</h3>
          ${renderCitation(part.text, languages)}
          ${renderColumns(part.text, languages)}
          ${part.gloriaPatri ? `<div class="ordo-part-gloria-patri">${renderColumns(part.gloriaPatri, languages)}</div>` : ''}
        </section>
      `;
    }
    // Matins only. Not currently emitted by hours/matins.ts (its psalms
    // render as a flat sequence of plain 'psalm'/'antiphon'/'versicle'
    // parts instead) — handled here for the ResolvedPart union's sake,
    // ready for whenever nocturn-grouped UI treatment is wanted.
    case 'nocturn-psalmody':
      return `
        <section class="ordo-part ordo-part-nocturn-psalmody">
          <h3 class="ordo-part-label">Nocturn ${part.nocturn}</h3>
          ${part.psalms.map((p) => renderPart(p, languages)).join('')}
        </section>
      `;
    case 'section-heading':
      return `<h2 class="section-heading">${escapeHtml(part.label)}</h2>`;
    case 'te-deum':
      return `
        <section class="ordo-part ordo-part-te-deum">
          <h3 class="ordo-part-label">Te Deum</h3>
          ${renderColumns(part.text, languages)}
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
