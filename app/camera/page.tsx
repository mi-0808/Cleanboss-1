'use client';

import { useCallback, useMemo, useState } from 'react';

type ScreenState = 'idle' | 'selected' | 'analyzing' | 'done' | 'error';

type InspectResponse = {
  ok: boolean;
  resultText?: string;
  message?: string;
};

export default function CameraPage() {
  const [state, setState] = useState<ScreenState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusText = useMemo(() => {
    switch (state) {
      case 'idle':
        return '画像未選択';
      case 'selected':
        return '画像選択済み';
      case 'analyzing':
        return '判定中';
      case 'done':
        return '判定完了';
      case 'error':
        return 'エラー';
      default:
        return '';
    }
  }, [state]);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setError(null);
      setState('idle');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setState('error');
      setError('画像ファイルを選択してください。');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextPreview);
    setResult(null);
    setError(null);
    setState('selected');
  }, [previewUrl]);

  const onInspect = useCallback(async () => {
    if (!selectedFile) {
      setState('error');
      setError('先に画像を選択してください。');
      return;
    }

    setState('analyzing');
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/inspect', {
        method: 'POST',
        body: formData
      });

      const body = (await res.json()) as InspectResponse;

      if (!res.ok || !body.ok) {
        setState('error');
        setError(body?.message ?? '判定リクエストに失敗しました。');
        return;
      }

      setResult(body.resultText ?? '判定結果を取得しました。');
      setState('done');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : '通信エラーが発生しました。');
    }
  }, [selectedFile]);

  const onReset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setState('idle');
  }, [previewUrl]);

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 20, color: '#e5e7eb' }}>
      <h1 style={{ fontSize: 30, marginBottom: 10 }}>画像アップロード判定</h1>
      <p style={{ color: '#9ca3af', marginTop: 0 }}>状態: {statusText}</p>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', marginTop: 12 }}>
        <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 12, background: '#111827' }}>
          <label htmlFor="image-upload" style={{ display: 'block', marginBottom: 8 }}>
            判定する画像ファイルを選択
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ color: '#e5e7eb' }}
          />
        </div>

        {previewUrl ? (
          <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 12, background: '#111827' }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>プレビュー</h2>
            <img src={previewUrl} alt="選択画像" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        ) : null}

        {result ? (
          <div style={{ border: '1px solid #86efac', borderRadius: 12, padding: 14, background: '#dcfce7', color: '#166534' }}>
            <strong>判定結果</strong>
            <p style={{ margin: '8px 0 0' }}>{result}</p>
          </div>
        ) : null}

        {error ? (
          <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 12, padding: 12 }}>
            <strong>エラー</strong>
            <p style={{ margin: '6px 0 0' }}>{error}</p>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onInspect}
            disabled={!selectedFile || state === 'analyzing'}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            {state === 'analyzing' ? '判定中...' : 'この画像で判定'}
          </button>
          <button
            type="button"
            onClick={onReset}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            やり直し
          </button>
        </div>
      </section>
    </main>
  );
}
