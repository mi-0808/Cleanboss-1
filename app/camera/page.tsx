'use client';

import { ChangeEvent, useEffect, useState } from 'react';

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

export default function CameraPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 30, marginBottom: 10 }}>画像アップロード判定</h1>
      <p style={{ marginTop: 0 }}>画像ファイルを選択して 着こなしミス検知を実行します。</p>
      {isMockMode() ? (
        <p style={{ marginTop: 0, marginBottom: 16, color: '#b45309' }}>）</p>
      ) : (
        <p style={{ marginTop: 0, marginBottom: 16 }}></p>
      )}

      <section style={{ display: 'grid', gap: 16, marginTop: 12 }}>
        <input type="file" accept="image/*" onChange={onChangeFile} disabled={loading} />

        {previewUrl ? (
          <div style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: 12 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>プレビュー</h2>
            <img src={previewUrl} alt="選択画像" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        ) : null}

        <div>
          <button
            type="button"
            onClick={onInspect}
            disabled={!file || loading}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #9ca3af' }}
          >
            {loading ? '判定中...' : '判定する'}
          </button>
        </div>

        {result ? (
          <div style={{ border: '1px solid #86efac', borderRadius: 12, padding: 12, color: '#166534' }}>
            <strong>判定: {result.judgement}</strong>
            <p style={{ margin: '8px 0 0' }}>{result.notes}</p>
            {result.issues && result.issues.length > 0 ? (
              <ul style={{ marginBottom: 0 }}>
                {result.issues.map((issue, idx) => (
                  <li key={`${idx}-${issue}`}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div style={{ border: '1px solid #f87171', borderRadius: 12, padding: 12, color: '#dc2626' }}>
            <strong>エラー</strong>
            <p style={{ margin: '8px 0 0' }}>{errorMessage}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
