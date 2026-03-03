import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const client = getClient();
    if (!client) {
      return NextResponse.json({ ok: false, message: 'APIキー未設定' }, { status: 500 });
    }

    const form = await req.formData();
    const image = form.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json({ ok: false, message: '画像ファイルが見つかりません。' }, { status: 400 });
    }

    if (!image.type || !image.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, message: '画像ファイルのみアップロードできます。' }, { status: 400 });
    }

    if (image.size <= 0) {
      return NextResponse.json({ ok: false, message: '画像ファイルが空です。' }, { status: 400 });
    }

    if (image.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: '画像サイズが大きすぎます（最大10MB）。' },
        { status: 400 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${image.type};base64,${base64}`;

    let response: OpenAI.Responses.Response;
    try {
      response = await client.responses.create({
        model: 'gpt-4.1',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'この画像を確認し、クリーンウェア着用チェック観点で問題点があれば日本語で簡潔に指摘してください。問題なければ「問題なし」と返してください。'
              },
              {
                type: 'input_image',
                image_url: dataUrl,
                detail: 'auto'
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error('openai api error', error);
      return NextResponse.json({ ok: false, message: '画像解析に失敗しました' }, { status: 502 });
    }

    const resultText = response.output_text?.trim();
    if (!resultText) {
      console.error('openai api error', { reason: 'output_text is empty or undefined' });
      return NextResponse.json({ ok: false, message: '画像解析に失敗しました' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, resultText });
  } catch (error) {
    console.error('inspect api error', error);
    return NextResponse.json({ ok: false, message: '画像解析に失敗しました' }, { status: 500 });
  }
}
