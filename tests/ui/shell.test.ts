// @vitest-environment jsdom
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
    window.history.replaceState(null, '', '/2026-08-09/prime');
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
    expect(root.querySelector('.hour-title')?.textContent).toBe('Prime');
    expect(root.querySelectorAll('.ordo-part-psalm').length).toBeGreaterThan(0);
  });

  it('shows tomorrow\'s saint (not today\'s) in the header when Vespers/Compline anticipate First Vespers', () => {
    // Live-verified case (calendar/vespers.ts): Aug 25, 2026 is St. Louis
    // (Simplex), but St. Zephyrinus (Aug 26, also Simplex) claims First
    // Vespers over him -- the evening's real identity is tomorrow's, not
    // today's. The header previously always used the daytime `resolveDay`
    // regardless of selected hour, so it kept showing St. Louis even while
    // the hour content itself had already switched to St. Zephyrinus.
    setDate('2026-08-25');
    setSelectedHour('vespers');
    window.history.replaceState(null, '', '/2026-08-25/vespers');
    const root = document.getElementById('app')!;
    mountShell(root);

    expect(root.querySelector('.day-nav-label')?.textContent).toContain('Zephyrinus');
    expect(root.querySelector('.day-nav-label')?.textContent).not.toContain('Louis');
    expect(root.querySelector('.day-nav-vespers-status')?.textContent).toContain('First Vespers');
  });

  it('shows a plain Second Vespers status when Vespers is not anticipating tomorrow', () => {
    // Sep 6, 2026 is an ordinary Sunday with no saint the next day either,
    // so nothing anticipates it.
    setDate('2026-09-06');
    setSelectedHour('vespers');
    window.history.replaceState(null, '', '/2026-09-06/vespers');
    const root = document.getElementById('app')!;
    mountShell(root);

    expect(root.querySelector('.day-nav-vespers-status')?.textContent).toContain('Second Vespers');
  });

  it('shows First Vespers and the Sunday leading the header when Vespers anticipates a Sunday that wins outright (temporal, not sanctoral, winner)', () => {
    // Regression test: getVespersStatusLabel used to detect anticipation
    // only via a tag that's only ever set for a *sanctoral* tomorrow-
    // winner (see the equivalent calendar-level test in
    // tests/calendar/day-label.test.ts) -- 2026-08-29 (the Decollation of
    // St. John Baptist, Duplex) anticipates 2026-08-30's ordinary Sunday,
    // which wins outright over Ss. Felix and Adauctus (Simplex), so
    // tomorrow's winner is `temporal`, not `sanctoral`.
    setDate('2026-08-29');
    setSelectedHour('vespers');
    window.history.replaceState(null, '', '/2026-08-29/vespers');
    const root = document.getElementById('app')!;
    mountShell(root);

    expect(root.querySelector('.day-nav-label')?.textContent).toContain('13th Sunday after Trinity');
    expect(root.querySelector('.day-nav-vespers-status')?.textContent).toContain('First Vespers');
  });

  it('switches to Matins and shows its real content, not the pending message', () => {
    const root = document.getElementById('app')!;
    mountShell(root);

    const matinsBtn = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hour]')).find(
      (btn) => btn.dataset.hour === 'matins',
    );
    matinsBtn?.click();

    expect(root.querySelector('.hour-title')?.textContent).toBe('Matins');
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

    expect(root.querySelector('.hour-title')?.textContent).toBe('Compline');
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
