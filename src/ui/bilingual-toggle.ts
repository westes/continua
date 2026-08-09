import { getState, setLanguages, type AppState } from '../app-state';

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
  const { languages } = getState();
  const current = languages.join('+');

  container.innerHTML = `
    <div class="language-toggle" role="group" aria-label="Display language">
      ${OPTIONS.map((opt) => {
        const isActive = opt.languages.join('+') === current;
        return `<button type="button" class="lang-btn${isActive ? ' is-active' : ''}" data-langs="${opt.languages.join(',')}">${opt.label}</button>`;
      }).join('')}
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('[data-langs]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const langs = btn.dataset.langs!.split(',') as AppState['languages'];
      setLanguages(langs);
    });
  });
}
