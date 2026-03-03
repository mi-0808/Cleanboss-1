import { describe, expect, it, vi } from 'vitest';

import { POST as executePost } from '../../app/api/check/execute/route';
import { POST as resultsPost } from '../../app/api/check/results/route';
import * as inference from '../../lib/inference/mock-inference';

const validPayload = {
  deviceCode: 'iphone16-fixed-01',
  overallResult: 'OK',
  retryCount: 0,
  itemResults: [
    { itemCode: 'hair', score: 1, threshold: 0.7, result: 'OK' },
    { itemCode: 'neck_gap', score: 1, threshold: 0.7, result: 'OK' },
    { itemCode: 'glove_gap', score: 1, threshold: 0.7, result: 'OK' }
  ]
};

describe('check APIs', () => {
  it('APP-FE-002/003/004: execute API returns overall result and item results', async () => {
    vi.spyOn(inference, 'runMockInference').mockReturnValueOnce([
      { itemCode: 'hair', score: 0.95, threshold: 0.7, result: 'OK' },
      { itemCode: 'neck_gap', score: 0.2, threshold: 0.7, result: 'NG', reasonCode: '首元に隙間（肌の露出）があります' },
      { itemCode: 'glove_gap', score: 0.91, threshold: 0.7, result: 'OK' }
    ] as any);

    const res = await executePost();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallResult).toBe('NG');
    expect(body.itemResults).toHaveLength(3);
    expect(body.ngReasons).toContain('首元に隙間（肌の露出）があります');
  });

  it('APP-DATA-006: results API returns 201 and id for valid payload', async () => {
    const req = { json: async () => validPayload } as any;
    const res = await resultsPost(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(10);
  });

  it('APP-FE-008: results API returns 400 for invalid payload', async () => {
    const req = {
      json: async () => ({ ...validPayload, itemResults: [validPayload.itemResults[0]] })
    } as any;
    const res = await resultsPost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});
