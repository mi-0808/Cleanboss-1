'use client';

import { useRef, useState } from 'react';

type ApiItemResult = {
  itemCode: string;
  result: 'OK' | 'NG';
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
  neck_gap: '首元の隙間',
  glove_gap: '手袋の隙間'
};

const actionMap: Record<string, string> = {
  hair: '頭巾の中に髪を完全に入れてください。',
  neck_gap: '首元の開きを閉じ、肌が見えないようにしてください。',
  glove_gap: '手袋を深く差し込み、袖との隙間を無くしてください。'
};

export function CheckPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  function playAlertBeep() {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = audioContextRef.current ?? new AudioCtx();
    audioContextRef.current = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.value = 0.001;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  async function onCheck() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/check/execute', { method: 'POST' });
      if (!res.ok) throw new Error('判定APIが失敗しました');

      const data = (await res.json()) as ExecuteResponse;
      setResult(data);

      if (data.overallResult === 'NG') {
        playAlertBeep();
      }
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
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            background: result.overallResult === 'NG' ? '#3f1d1d' : '#1f2937'
          }}
        >
          <h2>判定結果: {result.overallResult === 'OK' ? '入室OK' : 'NG'}</h2>
          <p>推論時間: {result.inferenceMs} ms</p>

          <ul>
            {result.itemResults.map((item) => (
              <li key={item.itemCode}>
                {labelMap[item.itemCode] ?? item.itemCode}: {item.result}
                {item.reasonCode ? `（${item.reasonCode}）` : ''}
              </li>
            ))}
          </ul>

          {result.overallResult === 'NG' ? (
            <>
              <h3 style={{ marginBottom: 6 }}>修正のための行動</h3>
              <ul style={{ marginTop: 0 }}>
                {result.itemResults
                  .filter((item) => item.result === 'NG')
                  .map((item) => (
                    <li key={`action-${item.itemCode}`}>{actionMap[item.itemCode] ?? '状態を修正してください。'}</li>
                  ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
