'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('app error boundary', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>エラーが発生しました</h1>
      <p style={{ marginTop: 0 }}>画面を再読み込みするか、再試行してください。</p>
      <button
        type="button"
        onClick={reset}
        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
      >
        再試行
      </button>
    </main>
  );
}
