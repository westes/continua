import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';
import { getTemporalProper } from '../../src/propers';
import { getNocturnReadings } from '../../src/propers/nocturn-readings';

// Closes the gap found by grepping the reference engine for [Oratio 2]/
// [Oratio 3]: every ordinary feria of Ash Wednesday's week and Lent weeks
// 1-4 (weeks 5-6 are Passiontide/Holy Week, already given their own
// identity in an earlier campaign) previously fell back wholesale to that
// week's governing Sunday's collect/antiphons via resolveTemporalId, and
// this app had no per-hour (Lauds vs. Vespers) collect-variation
// mechanism at all. Each id below is a `calendar/movable-feasts.ts`
// identity record (data/calendar/temporal-feasts/<id>.yml, `rank`
// omitted -- defaults `simplex`, same mechanism already used for Passion
// week's own 12 days) with real content sourced from the reference
// engine's Tempora/Quad{1-4}-{1-6}.txt / Quadp3-{3-6}.txt.
//
// Two content-layer checks, not tied to any specific date (so they don't
// rot as the sanctoral calendar grows and starts winning outright on
// more of these days -- ordinary-feria has no rank floor, so any real
// saint can and does win outright on most of these dates, live-verified
// below): every id has a real, verified collect/Benedictus/Magnificat/
// nocturn-reading, and Lauds' and Vespers' collects genuinely differ
// wherever the source gave two distinct texts.
const LENT_FERIA_IDS = [
  'ash-wednesday',
  'thursday-after-ash-wednesday',
  'friday-after-ash-wednesday',
  'saturday-after-ash-wednesday',
  'lent-1-monday',
  'lent-1-tuesday',
  'lent-1-thursday',
  'lent-2-monday',
  'lent-2-tuesday',
  'lent-2-wednesday',
  'lent-2-thursday',
  'lent-2-friday',
  'lent-2-saturday',
  'lent-3-monday',
  'lent-3-tuesday',
  'lent-3-wednesday',
  'lent-3-thursday',
  'lent-3-friday',
  'lent-3-saturday',
  'lent-4-monday',
  'lent-4-tuesday',
  'lent-4-wednesday',
  'lent-4-thursday',
  'lent-4-friday',
  'lent-4-saturday',
];

// The reference source genuinely has no [Oratio 3]/[Ant 3] of its own for
// these two days (unlike every other id above) -- see each id's own
// `-collect.yml` header.
const NO_VESPERS_VARIANT = new Set(['saturday-after-ash-wednesday', 'lent-3-saturday']);

describe('Lent ordinary ferias: content completeness', () => {
  it.each(LENT_FERIA_IDS)('%s has a real, verified collect, Benedictus antiphon, and nocturn reading', (id) => {
    const collect = getTemporalProper(`collect-${id}`);
    expect(collect.status.la).toBe('verified');
    expect(collect.status.en).toBe('verified');

    const benedictus = getTemporalProper(`benedictus-antiphon-${id}`);
    expect(benedictus.status.en).toBe('verified');

    const readings = getNocturnReadings(id);
    expect(readings.length).toBeGreaterThan(0);
    for (const reading of readings) {
      expect(reading.status.la).toBe('verified');
      expect(reading.status.en).toBe('verified');
    }
  });

  it.each(LENT_FERIA_IDS.filter((id) => !NO_VESPERS_VARIANT.has(id)))('%s has a distinct, verified Vespers collect', (id) => {
    const lauds = getTemporalProper(`collect-${id}`);
    const vespers = getTemporalProper(`collect-${id}-vespers`);
    expect(vespers.status.la).toBe('verified');
    expect(vespers.status.en).toBe('verified');
    expect(vespers.text.en).not.toBe(lauds.text.en);
  });

  it.each([...NO_VESPERS_VARIANT])('%s has no separate Vespers collect or Magnificat antiphon (the source has neither)', (id) => {
    expect(getTemporalProper(`collect-${id}-vespers`).status.en).toBe('missing');
    expect(getTemporalProper(`magnificat-antiphon-${id}`).status.en).toBe('missing');
  });

  it.each(LENT_FERIA_IDS.filter((id) => !NO_VESPERS_VARIANT.has(id)))('%s has a real, verified Magnificat antiphon', (id) => {
    expect(getTemporalProper(`magnificat-antiphon-${id}`).status.en).toBe('verified');
  });
});

describe('Lent ordinary ferias: per-hour collect resolution (real dates, 2027)', () => {
  // The Fridays of Lent 2 and 3 (2027-02-26, 2027-03-05) are the Holy Shroud
  // and the Five Holy Wounds now (data/calendar/temporal-feasts); their ferias
  // are commemorated, which tests/calendar/lenten-passion-feasts.test.ts covers.
  // 2027's early Easter (March 28) puts a real sanctoral saint on most of
  // these dates (ordinary-feria has no rank floor -- see
  // calendar/types.ts's TemporalCategory doc comment), so only the days
  // below actually resolve to their own temporal identity that year.
  // (2027-02-25 and 2027-03-02 were dropped 2026-10 when St. Felix III and
  // St. Simplicius, both Simplex, were placed on those dates; the thinning
  // pass later removed both saints, so the dates are back below.)
  // Each is live-verified (2026-09-19) to render genuinely different
  // Lauds/Vespers text through the new getDayCollect(day, hour) path,
  // while Terce still gets the Lauds text unchanged.
  it.each([
    ['2027-02-10', 'ash-wednesday'],
    ['2027-02-16', 'lent-1-tuesday'],
    ['2027-02-25', 'lent-2-thursday'],
    ['2027-03-01', 'lent-3-monday'],
    ['2027-03-02', 'lent-3-tuesday'],
    ['2027-03-03', 'lent-3-wednesday'],
    ['2027-03-11', 'lent-4-thursday'],
    ['2027-03-13', 'lent-4-saturday'],
  ])('%s resolves to %s with distinct Lauds/Vespers collects, Terce unchanged', (date, id) => {
    const day = resolveDay(date);
    expect(day.winner).toEqual({ kind: 'temporal', id });
    const lauds = getDayCollect(day, 'lauds');
    const vespers = getDayCollect(day, 'vespers');
    const terce = getDayCollect(day);
    expect(lauds.status.en).toBe('verified');
    expect(vespers.status.en).toBe('verified');
    expect(vespers.text.en).not.toBe(lauds.text.en);
    expect(terce.text.en).toBe(lauds.text.en);
  });

  it('a real saint below the ordinary-feria threshold still wins outright inside Lent (St. Frances of Rome, Simplex, 2027-03-09)', () => {
    // The concrete evidence behind calendar/types.ts's tier verification:
    // Lent's own ordinary ferias have no rank floor at all, unlike
    // Christmastide's privileged-feria-minor -- confirmed here inside the
    // app itself, not just against the reference engine directly.
    const day = resolveDay('2027-03-09');
    expect(day.temporalCategory).toBe('ordinary-feria');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-frances-of-rome',
      name: 'St. Frances of Rome, Widow',
      nameLa: 'Sancta Francisca Romana, Vidua',
      rank: 'simplex',
    });
  });
});
