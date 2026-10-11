// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { mountShell } from '../../src/ui/shell';
import { getState, setDate, setSelectedHour, setLanguages } from '../../src/app-state';

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('dropdowns', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    setDate('2026-08-09');
    setSelectedHour('prime');
    setLanguages(['en']);
    window.history.replaceState(null, '', '/2026-08-09/prime');
    mountShell(document.getElementById('app')!);
  });

  it('starts collapsed and shows the current choice on the trigger', () => {
    const triggers = document.querySelectorAll<HTMLButtonElement>('.dropdown-trigger');
    expect(triggers).toHaveLength(2);
    triggers.forEach((t) => expect(t.getAttribute('aria-expanded')).toBe('false'));
    expect(document.querySelector('.language-toggle .dropdown-current')?.textContent).toBe('English');
    expect(document.querySelector('.hour-dropdown .dropdown-current')?.textContent).toBe('Prime');
    expect(document.querySelector<HTMLElement>('.language-toggle .dropdown-panel')!.hidden).toBe(true);
  });

  it('opens on click, closes on Escape', () => {
    const trigger = document.querySelector<HTMLButtonElement>('.hour-dropdown .dropdown-trigger')!;
    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector<HTMLElement>('.hour-dropdown .dropdown-panel')!.hidden).toBe(false);
    press('Escape', {}, document.activeElement ?? document.body);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('choosing a language updates state and re-renders collapsed', () => {
    document.querySelector<HTMLButtonElement>('.language-toggle .dropdown-trigger')!.click();
    document.querySelector<HTMLAnchorElement>('[data-langs="la"]')!.click();
    expect(getState().languages).toEqual(['la']);
    expect(document.querySelector('.language-toggle .dropdown-current')?.textContent).toBe('Latin');
    expect(document.querySelector('.language-toggle .dropdown-trigger')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('choosing an hour updates state', () => {
    document.querySelector<HTMLAnchorElement>('[data-hour="vespers"]')!.click();
    expect(getState().selectedHour).toBe('vespers');
    expect(document.querySelector('.hour-dropdown .dropdown-current')?.textContent).toBe('Vespers');
  });
});

describe('keyboard shortcuts', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    setDate('2026-08-09');
    setSelectedHour('prime');
    setLanguages(['en']);
    window.history.replaceState(null, '', '/2026-08-09/prime');
    mountShell(document.getElementById('app')!);
  });

  it.each([
    [']', {}], ['ArrowDown', { altKey: true }],
  ])('%s steps to the next hour', (key, init) => {
    press(key, init);
    expect(getState().selectedHour).toBe('terce');
  });

  it.each([
    ['[', {}], ['ArrowUp', { altKey: true }],
  ])('%s steps to the previous hour', (key, init) => {
    press(key, init);
    expect(getState().selectedHour).toBe('lauds');
  });

  it.each([
    ['.', {}, '2026-08-10'], ['ArrowRight', { altKey: true }, '2026-08-10'],
    [',', {}, '2026-08-08'], ['ArrowLeft', { altKey: true }, '2026-08-08'],
  ])('%s moves the day', (key, init, expected) => {
    press(key, init);
    expect(getState().date).toBe(expected);
    expect(getState().selectedHour).toBe('prime');
  });

  it('rolls hours over day boundaries', () => {
    setSelectedHour('compline');
    press(']');
    expect(getState()).toMatchObject({ date: '2026-08-10', selectedHour: 'matins' });
    press('[');
    expect(getState()).toMatchObject({ date: '2026-08-09', selectedHour: 'compline' });
  });

  it.each([['n', {}], ['N', {}], ['n', { altKey: true, code: 'KeyN' }]])('%s goes to now', (key, init) => {
    setDate('2020-01-01');
    press(key, init);
    expect(getState().date).not.toBe('2020-01-01');
  });

  it('ignores keys while typing, with modifiers, or with a dialog open', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    press(']', {}, input);
    press(']', { ctrlKey: true });
    press(']', { metaKey: true });
    expect(getState().selectedHour).toBe('prime');
    document.querySelector<HTMLDialogElement>('dialog')!.setAttribute('open', '');
    press(']');
    expect(getState().selectedHour).toBe('prime');
  });

  it('prevents default on handled keys and announces the result', () => {
    const event = press('ArrowRight', { altKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(document.querySelector('[data-slot="announcer"]')?.textContent).toContain('August 10, 2026');
  });
});
