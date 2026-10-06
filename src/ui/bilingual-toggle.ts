import { getState, setLanguages, type AppState } from '../app-state';
import { urlFor } from '../router';
import { mountDropdown } from './dropdown';

// Hardcoded to en/la since those are the only languages with any data so
// far. The two-language ceiling (never three+ columns) is the real
// constraint per the plan; the specific set of offered languages is
// expected to grow independently of that.
const OPTIONS: { label: string; languages: AppState['languages'] }[] = [
  { label: 'English', languages: ['en'] },
  { label: 'Latin', languages: ['la'] },
  { label: 'English + Latin', languages: ['en', 'la'] },
];

export function renderLanguageToggle(container: HTMLElement): void {
  const { date, selectedHour, languages } = getState();
  const current = languages.join('+');
  const currentLabel = OPTIONS.find((opt) => opt.languages.join('+') === current)?.label ?? current;

  mountDropdown(container, {
    label: 'Display language',
    current: currentLabel,
    className: 'language-toggle',
    panelHtml: OPTIONS.map((opt) => {
      const isActive = opt.languages.join('+') === current;
      const url = urlFor(date, selectedHour, opt.languages);
      return `<a href="${url}" class="dropdown-item lang-btn${isActive ? ' is-active' : ''}" aria-current="${isActive ? 'true' : 'false'}" data-langs="${opt.languages.join(',')}">${opt.label}</a>`;
    }).join(''),
  });

  container.querySelectorAll<HTMLAnchorElement>('[data-langs]').forEach((link) => {
    link.addEventListener('click', (event) => {
      // Let modifier/middle clicks fall through to normal browser navigation
      // (open in new tab, etc.) — only plain left-clicks are SPA-routed.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      const langs = link.dataset.langs!.split(',') as AppState['languages'];
      setLanguages(langs);
    });
  });
}
