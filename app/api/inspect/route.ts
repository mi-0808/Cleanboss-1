import OpenAI from 'openai';
import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';

import { visionCheckResultSchema, visionResponseJsonSchema } from '@/lib/vision/schema';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
]);
const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif']);

type InspectSuccess = {
  ok: true;
  judgement: 'OK' | 'NG';
  issues: string[];
  notes: string;
};

type InspectFailure = {
  ok: false;
  message: string;
  requestId?: string;
};

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

function extractJsonText(response: unknown): string | null {
  const res = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof res.output_text === 'string' && res.output_text.length > 0) {
    return res.output_text;
  }

  if (!Array.isArray(res.output)) {
    return null;
  }

  for (const chunk of res.output) {
    if (!Array.isArray(chunk.content)) {
      continue;
    }

    for (const item of chunk.content) {
      if (item?.type === 'output_text' && typeof item.text === 'string' && item.text.length > 0) {
        return item.text;
      }
    }
  }

  return null;
}

function toApiResult(overall: 'ok' | 'ng', issues: string[], summary: string): InspectSuccess {
  return {
    ok: true,
    judgement: overall === 'ok' ? 'OK' : 'NG',
    issues,
    notes: summary
  };
}

async function inferWithRetry(client: OpenAI, imageDataUrl: string) {
  const prompt = [
    'あなたはクリーンウェア着用チェック担当です。',
    '画像を見て、着用ミスがあれば具体的に列挙してください。',
    '問題がなければ issues を空配列にし、summary に「問題なし」と記載してください。',
    '必ずJSONのみを返してください。'
  ].join('\n');

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await client.responses.create({
      model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: imageDataUrl, detail: 'auto' }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'cleanwear_inspect_result',
          schema: visionResponseJsonSchema,
          strict: true
        }
      }
    });

    const text = extractJsonText(response);
    if (!text) {
      if (attempt === 1) {
        throw new Error('モデル応答からJSONを取得できませんでした。');
      }
      continue;
    }

    const parsed = visionCheckResultSchema.safeParse(JSON.parse(text));
    if (parsed.success) {
      const issues = parsed.data.issues.map((issue) => `${issue.message}（対処: ${issue.suggestion}）`);
      return toApiResult(parsed.data.overall, issues, parsed.data.summary);
    }

    if (attempt === 1) {
      throw new Error('モデル応答JSONの形式が不正です。');
    }
  }

  throw new Error('判定に失敗しました。');
}

function isMockEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK === '1' || process.env.USE_MOCK_INFERENCE === '1';
}

function createDataUrl(mimeType: string, buffer: Buffer): string {
  // Buffer#toString("base64") does not include line breaks.
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function normalizeForOpenAI(imageBuffer: Buffer): Promise<{ mimeType: 'image/jpeg'; buffer: Buffer }> {
  try {
    const normalized = await sharp(imageBuffer, { animated: true })
      .rotate()
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    return { mimeType: 'image/jpeg', buffer: normalized };
  } catch {
    throw new Error('INVALID_IMAGE_DATA');
  }
}

function getOpenAIErrorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return null;
}

function getOpenAIRequestId(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'request_id' in error) {
    const requestId = (error as { request_id?: unknown }).request_id;
    if (typeof requestId === 'string' && requestId.length > 0) {
      return requestId;
    }
  }
  return null;
}

function getOpenAIErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.length > 0) {
      return code;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json<InspectFailure>(
        { ok: false, message: 'image フィールドに画像ファイルが必要です。' },
        { status: 400 }
      );
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json<InspectFailure>(
        { ok: false, message: '画像ファイルのみアップロードできます。' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(image.type)) {
      return NextResponse.json<InspectFailure>(
        {
          ok: false,
          message:
            '対応形式はJPEG/PNG/GIF/WebP/HEICです。対応外形式は変換して再試行してください。'
        },
        { status: 400 }
      );
    }

    if (image.size <= 0) {
      return NextResponse.json<InspectFailure>({ ok: false, message: '空の画像ファイルは送信できません。' }, { status: 400 });
    }

    if (image.size > MAX_SIZE) {
      return NextResponse.json<InspectFailure>(
        { ok: false, message: '画像サイズは10MB以下にしてください。' },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();
    if (!client) {
      if (isMockEnabled()) {
        return NextResponse.json<InspectSuccess>({
          ok: true,
          judgement: 'NG',
          issues: ['モックモードです。OPENAI_API_KEY を設定すると実推論になります。'],
          notes: 'モック判定結果'
        });
      }

      return NextResponse.json<InspectFailure>(
        { ok: false, message: 'OPENAI_API_KEY が未設定です。モックは既定で無効です。' },
        { status: 500 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    if (imageBuffer.length === 0) {
      return NextResponse.json<InspectFailure>({ ok: false, message: '空の画像ファイルは送信できません。' }, { status: 400 });
    }

    const normalized = await normalizeForOpenAI(imageBuffer);
    const imageDataUrl = createDataUrl(normalized.mimeType, normalized.buffer);

    try {
      const inferred = await inferWithRetry(client, imageDataUrl);
      return NextResponse.json<InspectSuccess>(inferred);
    } catch (error) {
      const status = getOpenAIErrorStatus(error);
      const requestId = getOpenAIRequestId(error);
      const errorCode = getOpenAIErrorCode(error);
      if (requestId) {
        console.error('inspect openai request failed', { requestId, status, errorCode });
      }

      if (status === 400) {
        const baseMessage = HEIC_MIME_TYPES.has(image.type)
          ? 'HEIC画像の変換に失敗した可能性があります。iPhone設定を「互換性優先」にして再撮影するか、JPEGで再試行してください。'
          : '画像データが不正です。JPEG/PNG/GIF/WebP/HEIC の有効な画像で再試行してください。';
        return NextResponse.json<InspectFailure>(
          {
            ok: false,
            message: baseMessage
          },
          { status: 400 }
        );
      }

      if (status === 429 || errorCode === 'insufficient_quota') {
        return NextResponse.json<InspectFailure>(
          {
            ok: false,
            message: 'OpenAI API の利用上限に達しました。プラン/請求情報を確認してから再試行してください。',
            requestId: requestId ?? undefined
          },
          { status: 429 }
        );
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_IMAGE_DATA') {
      return NextResponse.json<InspectFailure>(
        {
          ok: false,
          message: '画像の読み取りに失敗しました。ファイルが壊れている可能性があります。別の画像で再試行してください。'
        },
        { status: 400 }
      );
    }
    console.error('inspect api error', error);
    return NextResponse.json<InspectFailure>({ ok: false, message: '画像解析に失敗しました。' }, { status: 500 });
  }
}
