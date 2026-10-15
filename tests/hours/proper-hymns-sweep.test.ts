import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Proper hymns found in the reference's saint files that the Common used to
// stand in for (2026-10 hymn sweep, second pass: every reference file for a
// calendar saint, not only the 1617 kalendar's own).
const hymn = (hour: 'matins' | 'lauds' | 'vespers', date: string) => {
  const part = resolveOrdo(hour, date).parts.find((p) => p.kind === 'hymn');
  return part && 'text' in part ? part.text.text : { la: '', en: '' };
};

describe('proper hymns from the reference saint files', () => {
  it.each([
    ['matins', '2025-02-11', 'Te dícimus', 'Apparition of the Immaculate BVM'],
    ['matins', '2023-12-08', 'Præclára custos', 'Immaculate Conception'],
    ['matins', '2023-10-11', 'Cælo Redémptor', 'Maternity of the BVM'],
    ['matins', '2023-05-31', 'Rerum suprémo', 'Queenship of the BVM'],
    ['matins', '2023-09-15', 'O quot undis', 'Seven Sorrows'],
    ['lauds', '2023-07-07', 'Lux o decóra', 'Cyril and Methodius'],
    ['vespers', '2023-07-07', 'Sédibus cæli', 'Cyril and Methodius'],
    ['matins', '2023-07-26', 'Gaude, mater Anna', 'St. Anne'],
    ['lauds', '2023-07-26', 'Succédit nocti', 'St. Anne'],
    ['vespers', '2023-07-26', 'Omnis sanctórum', 'St. Anne'],
    ['vespers', '2023-04-21', 'Fortis en præsul', 'St. Anselm'],
    ['vespers', '2024-08-20', 'Jam Regína', 'St. Bernard'],
    ['lauds', '2024-08-20', 'Lacte quondam', 'St. Bernard'],
    ['vespers', '2024-07-08', 'Domáre cordis', 'St. Elizabeth of Portugal'],
    ['lauds', '2024-07-08', 'Opes decúsque', 'St. Elizabeth of Portugal'],
    ['matins', '2023-11-16', 'Mira noctúrnis', 'St. Gertrude'],
    ['vespers', '2023-10-20', 'Gentis Polónæ', 'St. John Cantius'],
    ['matins', '2023-10-20', 'Corpus domas', 'St. John Cantius'],
    ['lauds', '2023-10-20', 'Te deprecánte', 'St. John Cantius'],
    ['matins', '2023-03-20', 'Cǽlitum Joseph', 'St. Joseph'],
  ])('%s %s: %s (%s)', (hour, date, la) => {
    expect(hymn(hour as 'matins' | 'lauds' | 'vespers', date).la).toContain(la);
  });
});
