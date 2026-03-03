'use client';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('global error boundary', { message: error.message, digest: error.digest });

  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#111827', color: '#f3f4f6' }}>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>重大なエラーが発生しました</h1>
          <p style={{ marginTop: 0 }}>アプリを再読み込みして、もう一度お試しください。</p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #6b7280' }}
          >
            再試行
          </button>
        </main>
      </body>
    </html>
  );
}
