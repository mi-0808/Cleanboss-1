import { describe, expect, it, vi } from 'vitest';

import { POST as executePost } from '../../app/api/check/execute/route';
import { POST as resultsPost } from '../../app/api/check/results/route';
import { POST as inspectPost } from '../../app/api/inspect/route';
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
  it('APP-FE-002/003/004: execute API returns 410 when mock is disabled', async () => {
    delete process.env.NEXT_PUBLIC_USE_MOCK;
    delete process.env.USE_MOCK_INFERENCE;

    const res = await executePost();
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.ok).toBe(false);
  });

  it('APP-FE-002/003/004: execute API returns mocked result only when flag is enabled', async () => {
    process.env.USE_MOCK_INFERENCE = '1';
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
    delete process.env.USE_MOCK_INFERENCE;
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

  it('APP-FE-011: inspect API returns app-level error without 500 when key is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXT_PUBLIC_USE_MOCK;
    delete process.env.USE_MOCK_INFERENCE;

    const formData = new FormData();
    formData.append('image', new File([new Uint8Array([1, 2, 3])], 'sample.png', { type: 'image/png' }));

    const req = new Request('http://localhost/api/inspect', {
      method: 'POST',
      body: formData
    });

    const res = await inspectPost(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.message).toContain('OPENAI_API_KEY');
  });
});
