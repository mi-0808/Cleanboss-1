import { NextRequest, NextResponse } from 'next/server';

import { DEFAULT_CHECK_ITEMS } from '@/lib/vision/check-items';
import { visionCheckResultSchema, visionResponseJsonSchema } from '@/lib/vision/schema';

export const runtime = 'nodejs';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

class InputValidationError extends Error {}

function extractJsonText(response: any): string | null {
  if (typeof response?.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text;
  }

  const output = response?.output;
  if (!Array.isArray(output)) return null;

  for (const chunk of output) {
    const content = chunk?.content;
    if (!Array.isArray(content)) continue;

    for (const item of content) {
      if (item?.type === 'output_text' && typeof item?.text === 'string') {
        return item.text;
      }
    }
  }

  return null;
}

function parseDataUrl(dataUrl: string): void {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\n\r]+)$/);
  if (!match) {
    throw new InputValidationError('画像形式が不正です（jpeg/png/webp の dataURL を指定してください）');
  }

  const mimeType = match[1];
  const base64 = match[2].replace(/\s/g, '');

  if (!ALLOWED_MIME.has(mimeType)) {
    throw new InputValidationError('許可されていない画像形式です');
  }

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw new InputValidationError('画像データが空です');
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new InputValidationError('画像サイズが大きすぎます（最大4MB）');
  }
}

function buildPrompt(checkItems: readonly string[]): { system: string; user: string } {
  const system = [
    'あなたはクリーンウェア検査員です。',
    '画像を確認し、指定したチェック項目に違反があるか判定してください。',
    '判定は必ず overall を ok または ng の二値で返してください。',
    '必ずJSONのみで返答してください。JSON以外の文字は一切含めないでください。',
    '確信が低い場合は過剰判定せず、根拠のある内容だけを返してください。'
  ].join('\n');

  const user = [
    'チェック項目:',
    ...checkItems.map((item, i) => `${i + 1}. ${item}`),
    '',
    '返答JSONスキーマ（厳密準拠）:',
    '{',
    '  "overall": "ok" | "ng",',
    '  "summary": "日本語で1文の結論",',
    '  "issues": [',
    '    {',
    '      "code": "HAIR_EXPOSED" | "NECK_EXPOSED" | "GLOVE_GAP_EXPOSED" | "OTHER",',
    '      "message": "日本語で具体的に何が問題か",',
    '      "suggestion": "日本語でどう直すか"',
    '    }',
    '  ],',
    '  "confidence": 0.0-1.0',
    '}'
  ].join('\n');

  return { system, user };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY が設定されていません' }, { status: 500 });
    }

    const body = await req.json();
    const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl : '';

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'imageDataUrl は必須です' }, { status: 400 });
    }

    parseDataUrl(imageDataUrl);
    const prompt = buildPrompt(DEFAULT_CHECK_ITEMS);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
        temperature: 0.1,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: prompt.system }] },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt.user },
              { type: 'input_image', image_url: imageDataUrl }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'vision_check_result',
            schema: visionResponseJsonSchema,
            strict: true
          }
        }
      })
    });

    const responseJson = await response.json();

    if (!response.ok) {
      console.error('vision-check openai error', { status: response.status, body: responseJson });
      return NextResponse.json({ error: `判定APIエラー (${response.status})` }, { status: response.status });
    }

    const text = extractJsonText(responseJson);
    if (!text) {
      return NextResponse.json({ error: 'モデル応答からJSONを取得できませんでした' }, { status: 502 });
    }

    const parsed = visionCheckResultSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error('vision-check parse error', parsed.error.flatten());
      return NextResponse.json({ error: 'モデル応答のJSON形式が不正です' }, { status: 502 });
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    if (error instanceof InputValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : '判定中にエラーが発生しました';
    console.error('vision-check unexpected error', { message });
    return NextResponse.json({ error: '判定処理でエラーが発生しました' }, { status: 500 });
  }
}
