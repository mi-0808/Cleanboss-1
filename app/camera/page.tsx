'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ScreenState = 'idle' | 'previewing' | 'captured' | 'analyzing' | 'done' | 'error';

type VisionIssue = {
  code: 'HAIR_EXPOSED' | 'NECK_EXPOSED' | 'GLOVE_GAP_EXPOSED' | 'OTHER';
  message: string;
  suggestion: string;
};

type VisionResult = {
  overall: 'ok' | 'ng';
  summary: string;
  issues: VisionIssue[];
  confidence: number;
};

const bannerStyleMap: Record<VisionResult['overall'], CSSProperties> = {
  ok: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  ng: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }
};

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [state, setState] = useState<ScreenState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const playAlertBeep = useCallback(() => {
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
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setError('このブラウザはカメラに対応していません。');
      return;
    }

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'user' } }, audio: false },
      { video: true, audio: false }
    ];

    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setState('previewing');
        return;
      } catch (e) {
        const err = e as DOMException;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          setState('error');
          setError('カメラ利用が拒否されました。ブラウザ設定から許可してください。');
          return;
        }
      }
    }

    setState('error');
    setError('インカメの起動に失敗しました。端末のカメラ設定を確認してください。');
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const onCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setState('error');
      setError('画像の取得に失敗しました。');
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setCapturedImage(dataUrl);
    setResult(null);
    setState('captured');
  }, []);

  const onAnalyze = useCallback(async () => {
    if (!capturedImage) return;

    setState('analyzing');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/vision-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: capturedImage })
      });

      const body = await res.json();
      if (!res.ok) {
        setState('error');
        setError(body?.error ?? '判定に失敗しました');
        return;
      }

      const parsed = body as VisionResult;
      setResult(parsed);

      if (parsed.overall === 'ng') {
        playAlertBeep();
      }

      setState('done');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : '通信エラーが発生しました');
    }
  }, [capturedImage, playAlertBeep]);

  const onRetry = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    if (streamRef.current) {
      setState('previewing');
      return;
    }
    void startCamera();
  }, [startCamera]);

  const statusText = useMemo(() => {
    switch (state) {
      case 'idle':
        return '初期化中';
      case 'previewing':
        return 'プレビュー中';
      case 'captured':
        return '撮影済み';
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

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 20, color: '#e5e7eb' }}>
      <h1 style={{ fontSize: 30, marginBottom: 10 }}>インカメ判定</h1>
      <p style={{ color: '#9ca3af', marginTop: 0 }}>状態: {statusText}</p>
      <p style={{ fontSize: 12, color: '#9ca3af' }}>
        カメラ機能は HTTPS 環境で動作します（localhost は例外）。
      </p>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', marginTop: 12 }}>
        <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 12, background: '#111827' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', borderRadius: 8, background: '#000', aspectRatio: '4 / 3' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {capturedImage ? (
          <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 12, background: '#111827' }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>撮影サムネイル</h2>
            <img src={capturedImage} alt="撮影画像" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        ) : null}

        {result ? (
          <div style={{ ...bannerStyleMap[result.overall], borderRadius: 12, padding: 14 }}>
            <strong>{result.overall === 'ng' ? 'NG: 不備があります' : 'OK: 問題なし'}</strong>
            <p style={{ marginBottom: 8 }}>{result.summary}</p>
            <p style={{ margin: 0 }}>信頼度: {Math.round(result.confidence * 100)}%</p>
            {result.issues.length > 0 ? (
              <ul style={{ marginTop: 10, marginBottom: 0 }}>
                {result.issues.map((issue, idx) => (
                  <li key={`${issue.code}-${idx}`} style={{ marginBottom: 8 }}>
                    <div>{issue.message}</div>
                    <small>対処: {issue.suggestion}</small>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 12, padding: 12 }}>
            <strong>エラー</strong>
            <p style={{ margin: '6px 0 0' }}>{error}</p>
          </div>
        ) : null}

        {permissionDenied ? (
          <div style={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: 12, padding: 12 }}>
            <strong>カメラ許可の手順</strong>
            <ol style={{ marginBottom: 0 }}>
              <li>ブラウザのアドレスバー横の設定アイコンを開く</li>
              <li>「カメラ」を「許可」に変更する</li>
              <li>ページを再読み込みして再実行する</li>
            </ol>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onCapture}
            disabled={state !== 'previewing'}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            撮影
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={state !== 'captured' && state !== 'done'}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            {state === 'analyzing' ? '判定中...' : '判定'}
          </button>
          <button
            type="button"
            onClick={onRetry}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            やり直し
          </button>
        </div>
      </section>
    </main>
  );
}
