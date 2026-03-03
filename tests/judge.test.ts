import { describe, expect, it } from 'vitest';

import { judgeOverall } from '../lib/rules/judge';

describe('judgeOverall', () => {
  it('returns OK when all items are OK', () => {
    const result = judgeOverall([
      { itemCode: 'hair', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'zipper', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'buttons', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'glove_gap', score: 0.9, threshold: 0.7, result: 'OK' }
    ]);

    expect(result.overallResult).toBe('OK');
    expect(result.ngReasons).toHaveLength(0);
  });

  it('returns NG when one item is NG', () => {
    const result = judgeOverall([
      { itemCode: 'hair', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'zipper', score: 0.2, threshold: 0.7, result: 'NG', reasonCode: 'zipper_LOW_CONFIDENCE' },
      { itemCode: 'buttons', score: 0.9, threshold: 0.7, result: 'OK' },
      { itemCode: 'glove_gap', score: 0.9, threshold: 0.7, result: 'OK' }
    ]);

    expect(result.overallResult).toBe('NG');
    expect(result.ngReasons).toContain('zipper_LOW_CONFIDENCE');
  });
});
