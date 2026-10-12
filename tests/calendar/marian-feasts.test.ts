import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveEveningDay } from '../../src/calendar/vespers';
import { resolveOrdo } from '../../src/hours';
import { getDayCollect } from '../../src/hours/resolve-common';
import type { HourId } from '../../src/hours';

// The Marian and devotional feasts from the regional Sancti files (aliquibus
// locis/Brasilia), each Duplex majus on a fixed date. Dates are chosen so no
// higher-ranked day or Sunday takes the day.
const FEASTS: {
  id: string;
  date: string;
  commemorated?: string;
  label: string;
  eve: string;
  // the evening on which the feast's own Vespers are said: its eve, unless
  // the next day outranks or ties it (then its own evening is the next
  // feast's, as the Holy House's is not -- Dec 11 is a Simplex)
  vespersDate: string;
  vespersPsalms: number[];
  collect: string;
}[] = [
  {
    id: 'mediatrix-of-all-graces', date: '2027-10-01', commemorated: 'st-remigius', label: 'Mediatrix of All Graces',
    eve: '2027-09-30', vespersDate: '2027-09-30', vespersPsalms: [109, 112, 121, 126], collect: 'noster apud Patrem mediátor',
  },
  {
    id: 'translation-of-the-holy-house', date: '2026-12-10', commemorated: 'st-melchiades', label: 'Translation of the Holy House',
    eve: '2026-12-09', vespersDate: '2026-12-10', vespersPsalms: [109, 112, 121, 126], collect: 'Domum per incarnati Verbi mystérium',
  },
  {
    id: 'betrothal-of-the-bvm', date: '2027-01-23', commemorated: 'st-emerentiana', label: 'Betrothal of the Blessed Virgin Mary',
    eve: '2027-01-22', vespersDate: '2027-01-22', vespersPsalms: [109, 112, 121, 126], collect: 'Desponsatiónis ejus votiva solémnitas',
  },
  {
    id: 'our-lady-help-of-christians', date: '2025-05-24', label: 'Help of Christians',
    eve: '2025-05-23', vespersDate: '2025-05-23', vespersPsalms: [109, 112, 121, 126], collect: 'perpétuum auxílium',
  },
  {
    id: 'most-holy-redeemer', date: '2027-10-23', label: 'Most Holy Redeemer',
    eve: '2027-10-22', vespersDate: '2027-10-22', vespersPsalms: [109, 110, 115, 129], collect: 'Unigénitum tuum mundi Redemptorem',
  },
];

const HOURS: HourId[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers'];

describe('Marian and devotional feasts', () => {
  it.each(FEASTS)('$id wins $date; its day-mate (if any) is commemorated', ({ id, date, commemorated }) => {
    const day = resolveDay(date);
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id, rank: 'duplex-majus' });
    if (commemorated) {
      expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: commemorated }));
    }
  });

  it.each(FEASTS)('$id: every hour resolves with no missing part and its own collect', ({ id, date, label, collect }) => {
    const day = resolveDay(date);
    expect(getDayCollect(day).status.la).toBe('verified');
    expect(getDayCollect(day).text.la).toContain(collect);
    for (const hour of HOURS) {
      const ordo = resolveOrdo(hour, date);
      for (const part of ordo.parts) {
        const text = 'text' in part ? part.text : undefined;
        if (!text || !('status' in text)) continue;
        expect(text.status.la, `${id} ${hour} ${part.kind}: Latin missing`).not.toBe('missing');
        expect(text.status.en, `${id} ${hour} ${part.kind}: English missing`).not.toBe('missing');
      }
      expect(JSON.stringify(ordo.dayLabel)).toContain(label);
    }
  });

  it.each(FEASTS.filter((f) => f.id !== 'translation-of-the-holy-house'))(
    '$id has its own First Vespers the evening before',
    ({ id, eve }) => {
      expect(resolveEveningDay(eve).winner).toMatchObject({ kind: 'sanctoral', id });
    },
  );

  it.each(FEASTS.filter((f) => f.id !== 'betrothal-of-the-bvm' && f.id !== 'our-lady-help-of-christians'))(
    '$id: Vespers psalmody is the Monastic four, the fifth antiphon under the fourth psalm',
    ({ vespersDate, vespersPsalms }) => {
      const psalms = resolveOrdo('vespers', vespersDate).parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
      expect(psalms).toEqual(vespersPsalms);
    },
  );

  it.each(FEASTS)('$id keeps three nocturns at Matins, with a Gospel and its homily', ({ date }) => {
    const ordo = resolveOrdo('matins', date);
    expect(ordo.parts.filter((p) => p.kind === 'section-heading' && /^Nocturn/.test(p.label ?? '')).length).toBe(3);
    expect(ordo.parts.filter((p) => p.kind === 'gospel').length).toBeGreaterThanOrEqual(1);
  });

  it('Mediatrix: its own nine Matins antiphons carry the source psalms', () => {
    const psalms = resolveOrdo('matins', '2027-10-01').parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalms).toEqual(expect.arrayContaining([8, 18, 23, 44, 45, 86, 95, 96, 97]));
  });

  it('Holy House: Matins and Lauds hymns are the Dedication Common\'s, in its own Vespers antiphons the house is named', () => {
    const matins = resolveOrdo('matins', '2026-12-10');
    const hymn = matins.parts.find((p) => p.kind === 'hymn');
    expect(hymn && 'text' in hymn ? hymn.text.text.la : '').toContain('Urbs beáta Jerúsalem');
    const vespers = JSON.stringify(resolveOrdo('vespers', '2026-12-10').parts.filter((p) => p.kind === 'psalm'));
    expect(vespers).toContain('Propter domum');
  });

  it('Redeemer: no Lauds or Vespers responsory, by design, and the three hymns end in the Nativity doxology', () => {
    // Lauds that day, Vespers the evening before (its own First Vespers: the
    // evening of Oct 23 itself is the Archangel Raphael's, equal rank, tomorrow)
    expect(resolveOrdo('lauds', '2027-10-23').parts.some((p) => p.kind === 'responsory')).toBe(false);
    expect(resolveOrdo('vespers', '2027-10-22').parts.some((p) => p.kind === 'responsory')).toBe(false);
    for (const [hour, date] of [['matins', '2027-10-23'], ['lauds', '2027-10-23'], ['vespers', '2027-10-22']] as const) {
      const hymn = resolveOrdo(hour, date).parts.find((p) => p.kind === 'hymn');
      expect(hymn && 'text' in hymn ? hymn.text.text.la : '').toContain('Qui natus es de Vírgine');
    }
  });

  it('Mediatrix, Oct 1 2026: the Guardian Angels (equal rank, tomorrow) take the evening and Mediatrix is commemorated', () => {
    const ev = resolveEveningDay('2026-10-01');
    expect(ev.winner).toMatchObject({ kind: 'sanctoral', id: 'guardian-angels' });
    expect(ev.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'mediatrix-of-all-graces' }));
  });

  it('a Doctor commemorated at Vespers is named in the commemoration antiphon (St. Jerome, Sep 30)', () => {
    const vespers = JSON.stringify(resolveOrdo('vespers', '2027-09-30').parts);
    expect(vespers).toContain('beáte Hierónyme');
    expect(vespers).not.toContain('beáte N.');
  });
});

describe('Most Precious Blood: no Lauds or Vespers responsory', () => {
  // The source (Sancti/07-01.txt) has short responsories only for Terce, Sext
  // and None; the slot is absent by design, not missing.
  it.each([
    ['lauds', '2026-07-01'],
    ['vespers', '2026-07-01'],
    ['lauds', '2027-03-12'],
    ['vespers', '2027-03-11'],
  ] as const)('%s on %s has no responsory part', (hour, date) => {
    expect(resolveOrdo(hour, date).parts.some((p) => p.kind === 'responsory')).toBe(false);
  });
});
