import { NextRequest, NextResponse } from 'next/server';

import { saveResultSchema } from '@/lib/validation/save-result';

const inMemoryStore: Array<Record<string, unknown>> = [];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = saveResultSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const record = {
    ...parsed.data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  inMemoryStore.push(record);

  return NextResponse.json({ id: record.id }, { status: 201 });
}
