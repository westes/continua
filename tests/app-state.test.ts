import { describe, it, expect } from 'vitest';
import { defaultHourForTime } from '../src/app-state';

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
