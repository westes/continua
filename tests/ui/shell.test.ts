import { beforeEach, describe, expect, it } from 'vitest';
import { mountShell } from '../../src/ui/shell';
import { setDate, setSelectedHour, setLanguages } from '../../src/app-state';

describe('shell', () => {
  // app-state is a module-level singleton, so each test must reset every
  // field it might have mutated — not just the one it cares about — or
  // state leaks across tests in this file.
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    setDate('2026-08-09');
    setSelectedHour('prime');
    setLanguages(['en']);
    window.history.replaceState(null, '', '/vu/2026-08-09/prime');
  });

  it('renders the day nav, all 8 hours, and Prime content by default', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    expect(root.querySelector('.day-nav-date')?.textContent).toContain('August 9, 2026');
    // The "day being celebrated" text now lives in the merged day-nav
    // header, not repeated inside each hour's own view.
    expect(root.querySelector('.day-nav-label')?.textContent).toBeTruthy();
    expect(root.querySelector('.hour-view .day-label')).toBeNull();

    const hourNames = Array.from(root.querySelectorAll('.hour-name')).map((el) => el.textContent);
    expect(hourNames).toEqual([
      'Matins',
      'Lauds',
      'Prime',
      'Terce',
      'Sext',
      'None',
      'Vespers',
      'Compline',
    ]);

    expect(root.querySelector('.hour-item.is-selected .hour-name')?.textContent).toBe('Prime');
    expect(root.querySelector('.hour-view h2')?.textContent).toBe('Prime');
    expect(root.querySelectorAll('.ordo-part-psalm').length).toBeGreaterThan(0);
  });

  it('switches to Matins and shows its real content, not the pending message', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    const matinsBtn = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hour]')).find(
      (btn) => btn.dataset.hour === 'matins',
    );
    matinsBtn?.click();

    expect(root.querySelector('.hour-view h2')?.textContent).toBe('Matins');
    expect(root.querySelector('.hour-view-pending')).toBeNull();
    // Ferial psalmody always resolves regardless of date (unauthored
    // reading content is the only genuinely date-gated part) — see
    // hours/matins.ts.
    expect(root.querySelectorAll('.ordo-part-psalm').length).toBeGreaterThan(0);
  });

  it('switches to Compline and shows its real content, not the pending message', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    const complineBtn = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hour]')).find(
      (btn) => btn.dataset.hour === 'compline',
    );
    complineBtn?.click();

    expect(root.querySelector('.hour-view h2')?.textContent).toBe('Compline');
    expect(root.querySelector('.hour-view-pending')).toBeNull();
    expect(root.querySelectorAll('.ordo-part-psalm').length).toBe(3);
  });

  it('moving to the next day updates the displayed date', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    root.querySelector<HTMLButtonElement>('[data-action="next"]')?.click();
    expect(root.querySelector('.day-nav-date')?.textContent).toContain('August 10, 2026');
  });

  it('switching to two-language mode renders two columns per verse', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    const bilingualBtn = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-langs]')).find(
      (btn) => btn.dataset.langs === 'en,la',
    );
    bilingualBtn?.click();

    const firstVerseColumns = root.querySelector('.psalm-verse .lang-columns');
    expect(firstVerseColumns?.classList.contains('lang-columns-2')).toBe(true);
    expect(firstVerseColumns?.querySelectorAll('.lang-column').length).toBe(2);
  });
});
