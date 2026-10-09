import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { lookupPart } from '../../src/hours/resolve-part';

const la = (t: { text: { la?: string } }) => t.text.la?.split('\n')[0];

describe('lookupPart (hymn)', () => {
  it("takes the winner's Common when the winner has no hymn of its own (Oct 9, several martyrs)", () => {
    const day = resolveDay('2026-10-09');
    expect(la(lookupPart({ day, hour: 'matins', part: 'hymn', temporalKeys: ['ferial'] }))).toBe('Ætérna Christi múnera,');
  });

  it("takes a shared office's file before the Common (Octave Day of All Saints uses All Saints')", () => {
    const day = resolveDay('2026-11-08');
    const own = lookupPart({ day, hour: 'matins', part: 'hymn', temporalKeys: ['sunday'] });
    expect(la(own)).toBe(la(lookupPart({ day: resolveDay('2026-11-01'), hour: 'matins', part: 'hymn', temporalKeys: ['sunday'] })));
  });

  it("uses the hour's temporal keys for a ferial winner", () => {
    const day = resolveDay('2026-12-01');
    expect(la(lookupPart({ day, hour: 'vespers', part: 'hymn', temporalKeys: ['advent'] }))).toBe('Cónditor alme síderum,');
  });

  it('ignoreWinner skips the winner-keyed steps', () => {
    const day = resolveDay('2026-10-09');
    const text = lookupPart({ day, hour: 'matins', part: 'hymn', temporalKeys: ['ferial-friday'], ignoreWinner: true });
    expect(la(text)).not.toBe('Ætérna Christi múnera,');
  });

  it('returns missing, not a ferial fallback, when nothing is authored', () => {
    const day = resolveDay('2026-10-09');
    const text = lookupPart({ day, hour: 'compline', part: 'hymn', temporalKeys: [], ignoreWinner: true });
    expect(text.status).toEqual({ la: 'missing', en: 'missing' });
  });

  it("a date override wins the Magnificat whoever wins the day (O Antiphon on St. Thomas, Dec 21)", () => {
    const day = resolveDay('2026-12-21');
    const text = lookupPart({ day, hour: 'vespers', part: 'magnificat', temporalKeys: [] });
    expect(la(text)).toContain('O Oriens');
  });

  it("the winner's own First Vespers Magnificat beats the month-week one (Christ the King, Oct 24 eve)", () => {
    const day = resolveDay('2026-10-25');
    const text = lookupPart({ day, hour: 'vespers', part: 'magnificat', temporalKeys: ['month-week-10-4'], variant: 'first' });
    expect(la(text)).toContain('Dabit illi');
  });

  it("All Saints of the Benedictine Order (Nov 13) has its own Matins hymn, not a gap or a ferial one", () => {
    const day = resolveDay('2026-11-13');
    const text = lookupPart({ day, hour: 'matins', part: 'hymn', temporalKeys: ['ferial'] });
    expect(la(text)).toBe('Jesu Salvátor sǽculi,');
    expect(text.status.en).toBe('draft');
  });
});
