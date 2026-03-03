import { NextResponse } from 'next/server';

import { runMockInference } from '@/lib/inference/mock-inference';
import { judgeOverall } from '@/lib/rules/judge';

function isMockEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK === '1' || process.env.USE_MOCK_INFERENCE === '1';
}

export async function POST() {
  if (!isMockEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        message: 'このエンドポイントのモック判定は無効です。/api/inspect を使用してください。'
      },
      { status: 410 }
    );
  }

  const started = Date.now();
  const itemResults = runMockInference();
  const judged = judgeOverall(itemResults);

  return NextResponse.json({
    ok: true,
    overallResult: judged.overallResult,
    ngReasons: judged.ngReasons,
    itemResults,
    inferenceMs: Date.now() - started,
    mode: 'mock'
  });
}
