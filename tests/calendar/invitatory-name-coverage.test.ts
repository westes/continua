import { describe, expect, it } from 'vitest';
import { properEntries } from '../../src/propers/store';

// Some Common invitatory antiphons are name templates ("beátæ {N}"). Any saint
// on such a Common needs invitatoryName, or a literal {N} shows the moment its
// rank reaches the doubled-antiphon tier -- so every saint carries one, not
// only those currently ranked high enough to need it.
const invitatoryEntries = [...properEntries].filter(([id]) => id.startsWith('matins-invitatory-'));
const saints = import.meta.glob<{ default: { id: string; common?: string; invitatoryName?: { la: string[]; en: string[] } } }>(
  '../../src/data/calendar/saints/*.yml',
  { eager: true },
);

const templateCommons = invitatoryEntries
  .filter(([, entry]) => Object.values(entry.text).some((t) => t?.includes('{N}')))
  .map(([id]) => id.replace(/^matins-invitatory-/, ''));

describe('invitatoryName coverage', () => {
  it('finds the name-template Commons', () => {
    expect(templateCommons.length).toBeGreaterThan(0);
  });
  it('every saint on a name-template Common carries an invitatoryName in both languages', () => {
    const missing = Object.values(saints)
      .map((m) => m.default)
      .filter((saint) => saint.common && templateCommons.includes(saint.common))
      .filter((saint) => !saint.invitatoryName?.la.length || !saint.invitatoryName?.en.length)
      .map((saint) => saint.id);
    expect(missing).toEqual([]);
  });
});
