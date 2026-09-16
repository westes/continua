// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defaultHourForTime, goToToday, goToNow, getState, setDate, setSelectedHour } from '../src/app-state';

function setVisible(visible: boolean): void {
  Object.defineProperty(document, 'visibilityState', { value: visible ? 'visible' : 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

function at(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

describe('defaultHourForTime', () => {
  it.each([
    [0, 30, 'matins'],
    [3, 0, 'matins'],
    [5, 59, 'matins'],
    [6, 0, 'lauds'],
    [6, 30, 'lauds'],
    [7, 59, 'lauds'],
    [8, 0, 'prime'],
    [8, 30, 'prime'],
    [8, 59, 'prime'],
    [9, 0, 'terce'],
    [10, 0, 'terce'],
    [11, 59, 'terce'],
    [12, 0, 'sext'],
    [13, 0, 'sext'],
    [14, 59, 'sext'],
    [15, 0, 'none'],
    [16, 0, 'none'],
    [16, 59, 'none'],
    [17, 0, 'vespers'],
    [18, 0, 'vespers'],
    [20, 59, 'vespers'],
    [21, 0, 'compline'],
    [22, 0, 'compline'],
    [23, 59, 'compline'],
  ] as const)('%i:%i -> %s', (hour, minute, expected) => {
    expect(defaultHourForTime(at(hour, minute))).toBe(expected);
  });
});

describe('goToToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 28, 10, 0, 0)); // 2026-08-28 10:00 local -> terce
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('jumps to today and preserves the current hour when on a different date', () => {
    setDate('2026-08-01');
    setSelectedHour('vespers');

    goToToday();

    expect(getState().date).toBe('2026-08-28');
    expect(getState().selectedHour).toBe('vespers');
  });

  it('leaves the hour untouched when already on today', () => {
    setDate('2026-08-28');
    setSelectedHour('vespers');

    goToToday();

    expect(getState().date).toBe('2026-08-28');
    expect(getState().selectedHour).toBe('vespers');
  });

  it('is idempotent: clicking twice has the same effect as clicking once', () => {
    setDate('2026-08-01');
    setSelectedHour('vespers');

    goToToday();
    goToToday();

    expect(getState().date).toBe('2026-08-28');
    expect(getState().selectedHour).toBe('vespers');
  });
});

describe('goToNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 28, 10, 0, 0)); // 2026-08-28 10:00 local -> terce
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('jumps to today and snaps the hour to the current time-of-day default', () => {
    setDate('2026-08-01');
    setSelectedHour('vespers');

    goToNow();

    expect(getState().date).toBe('2026-08-28');
    expect(getState().selectedHour).toBe('terce');
  });

  it('snaps the hour even when already on today', () => {
    setDate('2026-08-28');
    setSelectedHour('vespers');

    goToNow();

    expect(getState().date).toBe('2026-08-28');
    expect(getState().selectedHour).toBe('terce');
  });
});

describe('resume-refresh on visibilitychange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 28, 10, 0, 0)); // 2026-08-28 10:00 local -> terce
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('snaps a following-today date/hour forward when the tab resumes after midnight', () => {
    goToNow(); // pins followingToday, lands on 2026-08-28 terce

    vi.setSystemTime(new Date(2026, 7, 29, 7, 0, 0)); // next day, 07:00 -> lauds
    setVisible(true);

    expect(getState().date).toBe('2026-08-29');
    expect(getState().selectedHour).toBe('lauds');
  });

  it('leaves a deliberately-navigated date alone on resume', () => {
    setDate('2026-08-01'); // explicit navigation unpins followingToday
    setSelectedHour('vespers');

    vi.setSystemTime(new Date(2026, 7, 29, 7, 0, 0));
    setVisible(true);

    expect(getState().date).toBe('2026-08-01');
    expect(getState().selectedHour).toBe('vespers');
  });

  it('does nothing when the date is already current', () => {
    goToNow();
    goToNow();
    setVisible(true);

    expect(getState().date).toBe('2026-08-28');
    expect(getState().selectedHour).toBe('terce');
  });
});
