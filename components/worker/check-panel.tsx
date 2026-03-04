'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type InspectResponse = {
  ok: boolean;
  judgement?: 'OK' | 'NG';
  issues?: string[];
  notes?: string;
  message?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK === '1';
}

export function CheckPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function onChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    setResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!nextFile.type.startsWith('image/')) {
      setFile(null);
      setErrorMessage('画像ファイルを選択してください。');
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setErrorMessage('画像サイズは10MB以下にしてください。');
      return;
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function onInspect() {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/inspect', {
        method: 'POST',
        body: formData
      });

      const body = (await res.json()) as InspectResponse;

      if (!res.ok || !body.ok) {
        setErrorMessage(body.message ?? '判定に失敗しました。');
        return;
      }

      setResult(body);
      setSuccessMessage('判定が完了しました。結果を確認してください。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">作業者チェック</h1>
        <p className="mt-2 text-sm text-slate-600">画像をアップロードして、衛生ルール違反を即時判定します。</p>
        <div className="mt-3">
          <Badge status={isMockMode() ? 'warn' : 'info'}>
            {isMockMode() ? 'モックモード ON' : 'モックモード OFF'}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">画像アップロード</h2>
            <p className="text-sm text-slate-600">対応形式: 画像ファイル / 上限10MB</p>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept="image/*"
              onChange={onChangeFile}
              disabled={loading}
              className="focus-ring block w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-400"
            />

            <Button type="button" onClick={onInspect} disabled={!file || loading} loading={loading} className="w-full">
              {loading ? '判定中...' : '判定する'}
            </Button>

            {loading ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-2/4 animate-pulse rounded bg-slate-200" />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">プレビュー</h2>
            <p className="text-sm text-slate-600">選択画像を確認してから判定できます。</p>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <img src={previewUrl} alt="選択した画像プレビュー" className="w-full rounded-xl border border-slate-200" />
            ) : (
              <div className="grid h-52 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                画像を選択するとここに表示されます
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

      {result ? (
        <Card className="border-slate-300">
          <CardHeader className="md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">判定結果</h2>
            <Badge status={result.judgement === 'OK' ? 'success' : 'warn'}>{result.judgement ?? '判定なし'}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{result.notes ?? '補足なし'}</p>
            {result.issues && result.issues.length > 0 ? (
              <ul className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {result.issues.map((issue, idx) => (
                  <li key={`${idx}-${issue}`}>・{issue}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
