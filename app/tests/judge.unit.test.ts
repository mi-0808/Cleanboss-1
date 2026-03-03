import { describe, expect, it } from 'vitest';

import { judgeOverall } from '../../lib/rules/judge';
import type { ItemResult } from '../../lib/rules/types';

const okItems: ItemResult[] = [
  { itemCode: 'hair', score: 0.9, threshold: 0.7, result: 'OK' as const },
  { itemCode: 'neck_gap', score: 0.9, threshold: 0.7, result: 'OK' as const },
  { itemCode: 'glove_gap', score: 0.9, threshold: 0.7, result: 'OK' as const }
];

describe('judgeOverall', () => {
  it('APP-FE-009: 全項目OKでoverall OK', () => {
    const result = judgeOverall(okItems);

    expect(result.overallResult).toBe('OK');
    expect(result.ngReasons).toEqual([]);
  });

  it('APP-FE-010: 1項目NGでoverall NG', () => {
    const result = judgeOverall([
      ...okItems.slice(0, 1),
      {
        itemCode: 'neck_gap',
        score: 0.2,
        threshold: 0.7,
        result: 'NG' as const,
        reasonCode: '首元に隙間（肌の露出）があります'
      },
      ...okItems.slice(2),
    ]);

    expect(result.overallResult).toBe('NG');
    expect(result.ngReasons).toContain('首元に隙間（肌の露出）があります');
  });

  it('APP-FE-006: 項目ゼロはERROR', () => {
    const result = judgeOverall([]);

    expect(result.overallResult).toBe('ERROR');
    expect(result.ngReasons).toEqual(['NO_ITEM_RESULTS']);
  });
});
