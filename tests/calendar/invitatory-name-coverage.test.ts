import { describe, expect, it } from 'vitest';

// Some Common invitatory antiphons are name templates ("beátæ {N}"). Any saint
// on such a Common needs invitatoryName, or a literal {N} shows the moment its
// rank reaches the doubled-antiphon tier -- so every saint carries one, not
// only those currently ranked high enough to need it.
const invitatories = import.meta.glob<string>('../../src/data/propers/common/matins-invitatory-*.yml', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const saints = import.meta.glob<{ default: { id: string; common?: string; invitatoryName?: { la: string[]; en: string[] } } }>(
  '../../src/data/calendar/saints/*.yml',
  { eager: true },
);

const templateCommons = Object.entries(invitatories)
  .filter(([, raw]) => raw.includes('{N}'))
  .map(([path]) => path.replace(/^.*matins-invitatory-/, '').replace(/\.yml$/, ''));

describe('invitatoryName coverage', () => {
  it('finds the name-template Commons', () => {
    expect(templateCommons.length).toBeGreaterThan(0);
  });
  it.each(Object.values(saints).map((m) => m.default))('$id', (saint) => {
    if (!saint.common || !templateCommons.includes(saint.common)) return;
    expect(saint.invitatoryName?.la.length).toBeGreaterThan(0);
    expect(saint.invitatoryName?.en.length).toBeGreaterThan(0);
  });
});
