import { NextResponse } from 'next/server';

import { runMockInference } from '@/lib/inference/mock-inference';
import { judgeOverall } from '@/lib/rules/judge';

export async function POST() {
  const started = Date.now();
  const itemResults = runMockInference();
  const judged = judgeOverall(itemResults);

  return NextResponse.json({
    overallResult: judged.overallResult,
    ngReasons: judged.ngReasons,
    itemResults,
    inferenceMs: Date.now() - started
  });
}
