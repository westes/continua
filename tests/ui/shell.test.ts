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

    const hourNames = Array.from(root.querySelectorAll('.hour-name')).map((el) => el.textContent);
    expect(hourNames).toEqual([
      'Prime',
      'Compline',
      'Terce',
      'Sext',
      'None',
      'Lauds',
      'Vespers',
      'Matins',
    ]);

    expect(root.querySelector('.hour-item.is-selected .hour-name')?.textContent).toBe('Prime');
    expect(root.querySelector('.hour-view h2')?.textContent).toBe('Prime');
    expect(root.querySelectorAll('.ordo-part-psalm').length).toBeGreaterThan(0);
  });

  it('switches to a not-yet-built hour and shows the pending message', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    const vespersBtn = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hour]')).find(
      (btn) => btn.dataset.hour === 'vespers',
    );
    vespersBtn?.click();

    expect(root.querySelector('.hour-view h2')?.textContent).toBe('Vespers');
    expect(root.querySelector('.hour-view-pending')).not.toBeNull();
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
