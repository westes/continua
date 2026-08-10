import { describe, expect, it } from 'vitest';
import { decideOccurrence, compareFeastClass, isAtLeast } from '../../src/calendar/commemorations';

describe('compareFeastClass / isAtLeast', () => {
  it('orders the six ranks low to high', () => {
    expect(compareFeastClass('simplex', 'duplex-1-classis')).toBeLessThan(0);
    expect(compareFeastClass('duplex-1-classis', 'simplex')).toBeGreaterThan(0);
    expect(compareFeastClass('duplex', 'duplex')).toBe(0);
  });

  it('isAtLeast is inclusive of the threshold itself', () => {
    expect(isAtLeast('duplex-majus', 'duplex-majus')).toBe(true);
    expect(isAtLeast('duplex', 'duplex-majus')).toBe(false);
  });
});

describe('decideOccurrence', () => {
  it('temporal wins trivially when nothing is assigned to the date', () => {
    expect(decideOccurrence('ordinary-feria', null)).toEqual({ winner: 'temporal', commemorated: false });
    expect(decideOccurrence('privileged-sunday', null)).toEqual({ winner: 'temporal', commemorated: false });
  });

  it('an ordinary feria always yields to any real feast, uncommemorated', () => {
    expect(decideOccurrence('ordinary-feria', 'simplex')).toEqual({ winner: 'sanctoral', commemorated: false });
    expect(decideOccurrence('ordinary-feria', 'duplex-1-classis')).toEqual({ winner: 'sanctoral', commemorated: false });
  });

  it('a privileged feria yields to nothing short of the top class', () => {
    expect(decideOccurrence('privileged-feria', 'duplex-2-classis')).toEqual({
      winner: 'temporal',
      commemorated: false,
    });
    expect(decideOccurrence('privileged-feria', 'duplex-1-classis')).toEqual({
      winner: 'temporal',
      commemorated: true,
    });
  });

  it('an ordinary Sunday yields outright only to the top class, and is commemorated by the two ranks below it', () => {
    expect(decideOccurrence('ordinary-sunday', 'duplex-1-classis')).toEqual({
      winner: 'sanctoral',
      commemorated: false,
    });
    expect(decideOccurrence('ordinary-sunday', 'duplex-2-classis')).toEqual({
      winner: 'temporal',
      commemorated: true,
    });
    expect(decideOccurrence('ordinary-sunday', 'duplex-majus')).toEqual({
      winner: 'temporal',
      commemorated: true,
    });
    expect(decideOccurrence('ordinary-sunday', 'duplex')).toEqual({ winner: 'temporal', commemorated: false });
  });

  it('a privileged Sunday is never displaced, and only the top two ranks are even commemorated', () => {
    expect(decideOccurrence('privileged-sunday', 'duplex-1-classis')).toEqual({
      winner: 'temporal',
      commemorated: true,
    });
    expect(decideOccurrence('privileged-sunday', 'duplex-2-classis')).toEqual({
      winner: 'temporal',
      commemorated: true,
    });
    expect(decideOccurrence('privileged-sunday', 'duplex-majus')).toEqual({
      winner: 'temporal',
      commemorated: false,
    });
  });
});
