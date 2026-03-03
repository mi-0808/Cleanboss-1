'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ScreenState = 'idle' | 'selected' | 'analyzing' | 'done' | 'error';

type InspectResponse = {
  ok: boolean;
  resultText?: string;
  message?: string;
};

const MAX_SIZE = 10 * 1024 * 1024;

export default function CheckPage() {
  const [state, setState] = useState<ScreenState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;

      if (!file) {
        setSelectedFile(null);
        setResultText(null);
        setErrorMessage(null);
        setState('idle');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        return;
      }

      if (!file.type.startsWith('image/')) {
        setSelectedFile(null);
        setResultText(null);
        setErrorMessage('画像ファイルを選択してください。');
        setState('error');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        return;
      }

      if (file.size > MAX_SIZE) {
        setSelectedFile(null);
        setResultText(null);
        setErrorMessage('画像サイズが大きすぎます（最大10MB）。');
        setState('error');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const nextPreviewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(nextPreviewUrl);
      setResultText(null);
      setErrorMessage(null);
      setState('selected');
    },
    [previewUrl]
  );

  const onCheck = useCallback(async () => {
    if (!selectedFile) {
      setErrorMessage('先に画像を選択してください。');
      setState('error');
      return;
    }

    setState('analyzing');
    setResultText(null);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/inspect', {
        method: 'POST',
        body: formData
      });

      const body = (await response.json()) as InspectResponse;

      if (!response.ok || !body.ok) {
        setErrorMessage(body.message ?? '判定リクエストに失敗しました。');
        setState('error');
        return;
      }

      setResultText(body.resultText ?? '判定結果を取得できませんでした。');
      setState('done');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '通信エラーが発生しました。');
      setState('error');
    }
  }, [selectedFile]);

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 20, color: '#e5e7eb' }}>
      <h1 style={{ fontSize: 30, marginBottom: 10 }}>/check 画像判定</h1>
      <p style={{ color: '#9ca3af', marginTop: 0 }}>状態: {statusText}</p>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', marginTop: 12 }}>
        <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 12, background: '#111827' }}>
          <label htmlFor="check-image-upload" style={{ display: 'block', marginBottom: 8 }}>
            判定する画像ファイルを選択
          </label>
          <input id="check-image-upload" type="file" accept="image/*" onChange={onFileChange} />
          <p style={{ marginBottom: 0, color: '#9ca3af', fontSize: 12 }}>最大10MB（jpg/png/webp推奨）</p>
        </div>

        {previewUrl ? (
          <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 12, background: '#111827' }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>プレビュー</h2>
            <img src={previewUrl} alt="選択した画像のプレビュー" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        ) : null}

        {resultText ? (
          <div
            style={{
              border: '1px solid #86efac',
              borderRadius: 12,
              padding: 14,
              background: '#dcfce7',
              color: '#166534'
            }}
          >
            <strong>判定結果</strong>
            <p style={{ margin: '8px 0 0' }}>{resultText}</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            style={{
              background: '#7f1d1d',
              border: '1px solid #ef4444',
              borderRadius: 12,
              padding: 12,
              color: '#fecaca'
            }}
          >
            <strong>エラー</strong>
            <p style={{ margin: '6px 0 0' }}>{errorMessage}</p>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onCheck}
            disabled={!selectedFile || state === 'analyzing'}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            {state === 'analyzing' ? '判定中…' : 'この画像で判定'}
          </button>
        </div>
      </section>
    </main>
  );
}
