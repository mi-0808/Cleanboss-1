import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0f172a', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  );
}
