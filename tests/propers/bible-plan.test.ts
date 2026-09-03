import { describe, expect, it } from 'vitest';
import { getBiblePlanReadings } from '../../src/propers/bible-plan';

describe('getBiblePlanReadings citation labels', () => {
  const readings = getBiblePlanReadings('post-pentecost-14', 'thursday', '2026-09-17');

  it('collapses a consecutive multi-chapter run of the same book into a range', () => {
    expect(readings[0]?.citation.la).toBe('Job 34-37');
    expect(readings[0]?.citation.en).toBe('Job 34-37');
  });

  it('leaves a single-chapter reading unchanged', () => {
    expect(readings[1]?.citation.la).toBe('Sir 42');
  });

  it('leaves a verse-qualified citation unchanged, never merged into a range', () => {
    expect(readings[2]?.citation.la).toBe('Luke 18:1-23');
  });
});
