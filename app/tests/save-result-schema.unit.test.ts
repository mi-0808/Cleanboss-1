import { describe, expect, it } from 'vitest';

import { saveResultSchema } from '../../lib/validation/save-result';

const validPayload = {
  deviceCode: 'iphone16-fixed-01',
  overallResult: 'OK' as const,
  retryCount: 0,
  itemResults: [
    { itemCode: 'hair', score: 1, threshold: 0.7, result: 'OK' as const },
    { itemCode: 'neck_gap', score: 1, threshold: 0.7, result: 'OK' as const },
    { itemCode: 'glove_gap', score: 1, threshold: 0.7, result: 'OK' as const }
  ]
};

describe('saveResultSchema', () => {
  it('APP-DATA-001: 正常ペイロード受理', () => {
    const parsed = saveResultSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('APP-DATA-002: score下限違反', () => {
    const parsed = saveResultSchema.safeParse({
      ...validPayload,
      itemResults: [{ ...validPayload.itemResults[0], score: -0.1 }, ...validPayload.itemResults.slice(1)]
    });
    expect(parsed.success).toBe(false);
  });

  it('APP-DATA-003: score上限違反', () => {
    const parsed = saveResultSchema.safeParse({
      ...validPayload,
      itemResults: [{ ...validPayload.itemResults[0], score: 1.1 }, ...validPayload.itemResults.slice(1)]
    });
    expect(parsed.success).toBe(false);
  });

  it('APP-DATA-004: itemCode列挙外', () => {
    const parsed = saveResultSchema.safeParse({
      ...validPayload,
      itemResults: [{ ...validPayload.itemResults[0], itemCode: 'mask' }, ...validPayload.itemResults.slice(1)]
    });
    expect(parsed.success).toBe(false);
  });

  it('APP-DATA-005: retryCount範囲外', () => {
    const parsed = saveResultSchema.safeParse({ ...validPayload, retryCount: 11 });
    expect(parsed.success).toBe(false);
  });
});
