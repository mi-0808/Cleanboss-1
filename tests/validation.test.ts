import { describe, expect, it } from 'vitest';

import { saveResultSchema } from '../lib/validation/save-result';

describe('saveResultSchema', () => {
  it('accepts valid payload', () => {
    const parsed = saveResultSchema.safeParse({
      deviceCode: 'iphone16-fixed-01',
      overallResult: 'OK',
      retryCount: 0,
      itemResults: [
        { itemCode: 'hair', score: 1, threshold: 0.7, result: 'OK' },
        { itemCode: 'zipper', score: 1, threshold: 0.7, result: 'OK' },
        { itemCode: 'buttons', score: 1, threshold: 0.7, result: 'OK' },
        { itemCode: 'glove_gap', score: 1, threshold: 0.7, result: 'OK' }
      ]
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects if item count is not 4', () => {
    const parsed = saveResultSchema.safeParse({
      deviceCode: 'iphone16-fixed-01',
      overallResult: 'OK',
      retryCount: 0,
      itemResults: [{ itemCode: 'hair', score: 1, threshold: 0.7, result: 'OK' }]
    });

    expect(parsed.success).toBe(false);
  });
});
