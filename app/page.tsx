import Link from 'next/link';
import { Camera, ClipboardCheck, Shield } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function HomePage() {
  return (
    <AppShell actionHref="/worker" actionLabel="作業者チェックへ">
      <section className="mb-6">
        <Badge status="info" className="mb-3">現場チェックSaaS</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">白基調で見やすい、クリーン番長UI</h1>
        <p className="mt-3 max-w-2xl text-slate-600">画像アップロードから判定結果まで、清潔感のある導線で素早く確認できます。</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><Shield className="h-4 w-4 text-cyan-500" /> 安全管理</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">判定結果と注意点を整理し、現場で迷わない表示に統一。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><Camera className="h-4 w-4 text-emerald-500" /> カメラ判定</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">画像を1枚選ぶだけで、ルール違反を自動チェック。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><ClipboardCheck className="h-4 w-4 text-amber-500" /> 即時レポート</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">エラー・成功・注意の状態を色で明確に表現。</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 flex flex-wrap gap-3">
        <Link href="/worker"><Button>作業者画面を開く</Button></Link>
        <Link href="/camera"><Button variant="ghost">カメラ画面を開く</Button></Link>
      </section>
    </AppShell>
  );
}
