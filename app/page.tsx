import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>クリーンウェアチェック</h1>
      <p>作業者画面へ遷移してください。</p>
      <Link href="/worker">/worker を開く</Link>
    </main>
  );
}
