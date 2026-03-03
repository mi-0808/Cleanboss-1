import { describe, expect, it } from 'vitest';

import { judgeOverall } from '../lib/rules/judge';

describe('judgeOverall', () => {
  it('returns OK when all items are OK', () => {
    const result = judgeOverall([
      { itemCode: 'hair', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'neck_gap', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'glove_gap', score: 0.9, threshold: 0.7, result: 'OK' }
    ] as any);

    expect(result.overallResult).toBe('OK');
    expect(result.ngReasons).toHaveLength(0);
  });

  it('returns NG when one item is NG', () => {
    const result = judgeOverall([
      { itemCode: 'hair', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'neck_gap', score: 0.2, threshold: 0.7, result: 'NG', reasonCode: '首元に隙間（肌の露出）があります' },
      { itemCode: 'glove_gap', score: 0.9, threshold: 0.7, result: 'OK' }
    ] as any);

    expect(result.overallResult).toBe('NG');
    expect(result.ngReasons).toContain('首元に隙間（肌の露出）があります');
  });
});
