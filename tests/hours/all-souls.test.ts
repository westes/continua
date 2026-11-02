import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { HOUR_IDS } from '../../src/hours/types';
import { resolveDay } from '../../src/calendar';

const isAllSouls = (date: string) => resolveDay(date).winner.id === 'all-souls';

function collectStatuses(value: unknown, statuses: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v) => collectStatuses(v, statuses));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'status' && v && typeof v === 'object') {
        statuses.push(...Object.values(v as Record<string, string>));
      } else {
        collectStatuses(v, statuses);
      }
    }
  }
}

describe('All Souls’ Day (Nov 2) — Office of the Dead', () => {
  for (const date of ['2026-11-02', '2027-11-02']) {
    for (const hourId of HOUR_IDS) {
      it(`${hourId} on ${date} has no missing text`, () => {
        const ordo = resolveOrdo(hourId, date);
        const statuses: string[] = [];
        collectStatuses(ordo.parts, statuses);
        expect(statuses.length).toBeGreaterThan(0);
        expect(statuses).not.toContain('missing');
      });
    }
  }

  it('Prime includes the Rule reading before the Conclusio', () => {
    const parts = resolveOrdo('prime', '2026-11-02').parts;
    const i = parts.findIndex((p) => p.kind === 'lesson' && p.label && p.label !== 'Martyrology');
    expect(i).toBeGreaterThan(-1);
    const rule = parts[i] as { text: { status: Record<string, string> } };
    expect(Object.values(rule.text.status)).not.toContain('missing');
    expect(i).toBeLessThan(parts.length - 1);
  });

  it('does not affect Nov 1 First Vespers of All Saints', () => {
    const ordo = resolveOrdo('vespers', '2026-11-01');
    const label = ordo.dayLabel?.en ?? '';
    expect(label.toLowerCase()).not.toContain('all souls');
  });
});

describe('All Souls Matins antiphons', () => {
  it('repeats each of the nine psalm antiphons in full, with its half-line *, after its psalm', () => {
    const ordo = resolveOrdo('matins', '2026-11-02');
    const headings = ordo.parts.map((p, i) => (p.kind === 'section-heading' && p.label.startsWith('Nocturn') ? i : -1)).filter((i) => i >= 0);
    expect(headings).toHaveLength(3);
    for (const start of headings) {
      const kinds: string[] = [];
      for (let i = start + 1; i < start + 7; i++) kinds.push(ordo.parts[i]!.kind);
      expect(kinds).toEqual(['psalm', 'antiphon', 'psalm', 'antiphon', 'psalm', 'antiphon']);
      for (let i = start + 1; i < start + 7; i++) {
        const p = ordo.parts[i]!;
        if (p.kind === 'antiphon') {
          expect(p.text.text.la).toContain('*');
          expect(p.text.text.en).toContain('*');
        }
      }
    }
  });
});

describe('structure: no duplicate or empty headings', () => {
  for (const hourId of HOUR_IDS) {
    it(`${hourId} on 2026-11-02 has no repeated or empty headings`, () => {
      const parts = resolveOrdo(hourId, '2026-11-02').parts;
      const headings = parts.filter((p) => p.kind === 'section-heading').map((p) => (p.kind === 'section-heading' ? p.label : ''));
      expect(new Set(headings).size).toBe(headings.length);
      parts.forEach((p, i) => {
        if (p.kind === 'section-heading') {
          expect(parts[i + 1]).toBeDefined();
          expect(parts[i + 1]!.kind).not.toBe('section-heading');
        }
      });
    });
  }
  it('Matins has exactly Invitatory and Nocturn I, II, III, in that order', () => {
    const labels = resolveOrdo('matins', '2026-11-02')
      .parts.filter((p) => p.kind === 'section-heading')
      .map((p) => (p.kind === 'section-heading' ? p.label : ''));
    expect(labels).toEqual(['Invitatory', 'Nocturn I', 'Nocturn II', 'Nocturn III']);
  });
});

describe('All Saints octave readings', () => {
  it('All Souls Matins carries the day-2 Ezekiel, Bede and Augustine readings', () => {
    const labels = resolveOrdo('matins', '2026-11-02')
      .parts.filter((p) => p.kind === 'lesson')
      .map((p) => (p.kind === 'lesson' ? JSON.stringify(p.label ?? '') : ''));
    expect(labels.some((l) => l.includes('Ezekiel'))).toBe(true);
    expect(labels.some((l) => l.includes('Bede'))).toBe(true);
    const gospel = resolveOrdo('matins', '2026-11-02').parts.find((p) => p.kind === 'gospel');
    expect(gospel?.kind === 'gospel' && gospel.text.text.en).toContain('Blessed are the poor in spirit');
    expect(gospel?.kind === 'gospel' && gospel.text.text.la).toContain('Beati pauperes spiritu');
    expect(gospel?.kind === 'gospel' && JSON.stringify(gospel.homily?.source)).toContain('Augustine');
  });
  it('an ordinary octave day (Nov 3 2026) also gets them', () => {
    const text = JSON.stringify(resolveOrdo('matins', '2026-11-03').parts);
    expect(text).toContain('Sermon 18 on the Saints');
    expect(text).toContain('Beati mites');
  });
});

describe('All Souls on a Sunday', () => {
  it('moves to Monday Nov 3 when Nov 2 is a Sunday (2025), and stays on Nov 2 otherwise', () => {
    expect(isAllSouls('2026-11-02')).toBe(true);
    expect(isAllSouls('2025-11-02')).toBe(false);
    expect(isAllSouls('2025-11-03')).toBe(true);
  });
});

describe('All Souls commemorated at Vespers of All Saints', () => {
  it('has a clean label and text in both languages', () => {
    const parts = resolveOrdo('vespers', '2026-11-01').parts as { label?: string; text?: { text: Record<string, string>; status: Record<string, string> } }[];
    const part = parts.find((p) => p.label?.includes('Faithful Departed'));
    expect(part?.label).toBe('Commemoration of All the Faithful Departed');
    expect(part?.text?.status.la).not.toBe('missing');
    expect(part?.text?.status.en).not.toBe('missing');
    expect(part?.text?.text.en).toContain('Maker and the Redeemer');
  });
});

describe('All Souls Matins goes through the ordinary Matins resolver', () => {
  const parts = resolveOrdo('matins', '2026-11-02').parts;
  const lessonsIn = (n: number) => parts.filter((p) => p.kind === 'lesson' && p.nocturn === n);

  it('keeps three Requiem lessons, each with a responsory, in every nocturn', () => {
    for (const n of [1, 2, 3]) {
      const withResponsory = lessonsIn(n).filter((p) => p.kind === 'lesson' && p.responsory);
      expect(withResponsory.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('reads the Bible plan first in Nocturn I, ahead of the Job lessons', () => {
    const first = lessonsIn(1)[0];
    expect(first?.kind === 'lesson' && first.text.citation?.en).toBeTruthy();
    const job = lessonsIn(1).findIndex((p) => p.kind === 'lesson' && p.text.citation?.en?.startsWith('Job'));
    expect(job).toBeGreaterThan(0);
  });

  it('has no hymn, Te Deum or opening versicle, and uses the Requiem Gloria', () => {
    expect(parts.some((p) => p.kind === 'hymn' || p.kind === 'te-deum')).toBe(false);
    const psalm = parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 5);
    expect(psalm?.kind === 'psalm' && psalm.gloriaPatri?.text.en).toContain('Eternal rest');
  });
});

describe('All Souls Lauds and Vespers go through the ordinary resolvers', () => {
  const kinds = (hour: 'lauds' | 'vespers', date: string) => resolveOrdo(hour, date).parts.map((p) => p.kind);

  it('Lauds has no chapter, hymn, responsory, versicle or Preces, and says psalms 62 and 66 together', () => {
    const parts = resolveOrdo('lauds', '2026-11-02').parts;
    for (const kind of ['chapter', 'hymn', 'responsory', 'versicle'] as const) {
      expect(parts.some((p) => p.kind === kind)).toBe(false);
    }
    const psalms = parts.flatMap((p) => (p.kind === 'psalm' ? [p.psalmNumber] : []));
    expect(psalms).toEqual([50, 64, 62, 66, 148, 149, 150]);
  });

  it('Lauds and Vespers say the Requiem Gloria and close with the Requiem couplet', () => {
    for (const hour of ['lauds', 'vespers'] as const) {
      const parts = resolveOrdo(hour, '2026-11-02').parts;
      for (const p of parts) {
        if (p.kind === 'psalm' && p.gloriaPatri) {
          expect(p.gloriaPatri.text.en).toContain('Eternal rest');
        }
      }
      const last = parts[parts.length - 1]!;
      expect(last.kind).toBe('preces');
      expect((last as { text: { text: Record<string, string> } }).text.text.en).toContain('May they rest in peace');
    }
  });

  it('Vespers keeps only the Dead’s own versicle before the Magnificat', () => {
    const k = kinds('vespers', '2026-11-02');
    expect(k.filter((x) => x === 'versicle')).toHaveLength(1);
    expect(k).not.toContain('chapter');
    expect(k).not.toContain('hymn');
  });

  it('Vespers of the transferred All Souls (Monday Nov 3, 2025) is still the Dead’s, not St. Charles’s', () => {
    const parts = resolveOrdo('vespers', '2025-11-03').parts;
    expect(parts.some((p) => p.kind === 'psalm' && p.psalmNumber === 114)).toBe(true);
    expect(parts.some((p) => p.kind === 'chapter')).toBe(false);
  });
});

describe('All Souls Prime goes through the ordinary Prime resolver', () => {
  it('says three bare psalms with the Requiem Gloria, the Martyrology with its introduction, and the Rule', () => {
    const parts = resolveOrdo('prime', '2026-11-02').parts;
    const kinds = parts.map((p) => p.kind);
    for (const kind of ['hymn', 'chapter', 'responsory'] as const) {
      expect(kinds).not.toContain(kind);
    }
    expect(parts.flatMap((p) => (p.kind === 'psalm' ? [p.psalmNumber] : []))).toEqual([87, 27, 31]);
    const martyrologyOf = (list: typeof parts) => list.find((p) => p.kind === 'lesson' && p.label === 'Martyrology') as { text: { text: Record<string, string> } };
    // The Martyrology entry for All Souls is read at Prime the evening before.
    expect(martyrologyOf(resolveOrdo('prime', '2026-11-01').parts).text.text.en).toContain('Commemoration of all the Faithful Departed');
    expect(martyrologyOf(parts).text.text.en).not.toContain('Commemoration of all the Faithful Departed');
    expect(parts.some((p) => p.kind === 'lesson' && /Rule of our Holy Father/.test(String(p.label)))).toBe(true);
  });
});

describe('All Souls Terce, Sext and None go through the ordinary little-hour resolvers', () => {
  const expected = { terce: [37, 37, 55], sext: [69, 84, 85], none: [101, 101, 101] } as const;
  for (const hour of ['terce', 'sext', 'none'] as const) {
    it(`${hour} says three bare psalms, the Fidelium collect and the Requiem closing`, () => {
      const parts = resolveOrdo(hour, '2026-11-02').parts;
      expect(parts.flatMap((p) => (p.kind === 'psalm' ? [p.psalmNumber] : []))).toEqual(expected[hour]);
      for (const kind of ['hymn', 'chapter', 'versicle'] as const) {
        expect(parts.some((p) => p.kind === kind)).toBe(false);
      }
      const prayer = parts.find((p) => p.kind === 'prayer') as { text: { text: Record<string, string> } };
      expect(prayer.text.text.en).toContain('Maker and the Redeemer');
      expect((parts[parts.length - 1] as { text: { text: Record<string, string> } }).text.text.en).toContain('May they rest in peace');
    });
  }
});
