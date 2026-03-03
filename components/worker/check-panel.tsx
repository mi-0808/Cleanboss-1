'use client';

import { useState } from 'react';

type ApiItemResult = {
  itemCode: string;
  result: 'OK' | 'NG' | 'UNKNOWN';
  reasonCode?: string;
  score: number;
  threshold: number;
};

type ExecuteResponse = {
  overallResult: 'OK' | 'NG' | 'ERROR';
  ngReasons: string[];
  itemResults: ApiItemResult[];
  inferenceMs: number;
};

const labelMap: Record<string, string> = {
  hair: '髪の毛',
  zipper: 'チャック',
  buttons: 'ボタン',
  glove_gap: '手袋の隙間'
};

export function CheckPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/check/execute', { method: 'POST' });
      if (!res.ok) throw new Error('判定APIが失敗しました');
      const data = (await res.json()) as ExecuteResponse;
      setResult(data);

      await fetch('/api/check/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceCode: 'iphone16-fixed-01',
          overallResult: data.overallResult,
          retryCount: 0,
          itemResults: data.itemResults
        })
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>クリーンウェアチェック</h1>
      <p>正面を向き、手を顔の高さまで上げて開始してください。</p>

      <div
        style={{
          border: '1px dashed #94a3b8',
          borderRadius: 12,
          padding: 24,
          minHeight: 180,
          background: '#111827'
        }}
      >
        カメラプレビュー（実装フェーズで接続）
      </div>

      <button
        onClick={onCheck}
        disabled={loading}
        style={{ marginTop: 16, padding: '12px 20px', borderRadius: 10, border: 0, fontWeight: 700 }}
      >
        {loading ? '判定中...' : 'チェック開始'}
      </button>

      {error ? <p style={{ color: '#fb7185' }}>{error}</p> : null}

      {result ? (
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#1f2937' }}>
          <h2>
            判定結果: {result.overallResult === 'OK' ? '入室OK' : result.overallResult === 'NG' ? 'NG' : 'ERROR'}
          </h2>
          <p>推論時間: {result.inferenceMs} ms</p>
          <ul>
            {result.itemResults.map((item) => (
              <li key={item.itemCode}>
                {labelMap[item.itemCode] ?? item.itemCode}: {item.result}
                {item.reasonCode ? ` (${item.reasonCode})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
