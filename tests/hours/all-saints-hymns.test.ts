import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// The older pre-Urban VIII hymns (the reference's [HymnusM ...] tags, which its
// Monastic and 1570 versions take over [Hymnus ...]); see TODO.md's
// 2026-10-14 hymn sweep.
const hymn = (hour: 'matins' | 'lauds' | 'vespers', date: string) => {
  const part = resolveOrdo(hour, date).parts.find((p) => p.kind === 'hymn');
  return part && 'text' in part ? part.text.text.la : '';
};

describe('All Saints keeps the older hymns', () => {
  it('Vespers and Matins: "Christe Redemptor omnium"', () => {
    expect(hymn('vespers', '2027-11-01')).toContain('Christe Redémptor ómnium');
    expect(hymn('matins', '2027-11-01')).toContain('Christe Redémptor ómnium');
  });

  it('Lauds: "Jesu Salvator saeculi"', () => {
    expect(hymn('lauds', '2027-11-01')).toContain('Jesu Salvátor sǽculi');
  });
});
