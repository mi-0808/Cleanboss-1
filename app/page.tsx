import Link from 'next/link';
import { ArrowRight, Camera, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function HomePage() {
  return (
    <AppShell actionHref="/check" actionLabel="作業チェックを開始">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <Badge status="info" className="mb-3">現場品質チェック</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">クリーン番長で、清潔・安全・信頼を即チェック</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          白基調の見やすい画面で、現場画像をアップロードして着用ルールを素早く判定。
          判定結果は注意点まで整理し、次のアクションにつなげます。
        </p>
        <div className="mt-6">
          <Link href="/check">
            <Button className="h-12 rounded-xl px-6 text-base shadow-md shadow-cyan-500/20">
              <Zap className="mr-2 h-5 w-5" />
              作業チェックを開始
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-cyan-500" />
              清潔と安全の可視化
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">判定ステータスを色分けし、現場での判断をブレさせません。</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Camera className="h-4 w-4 text-emerald-500" />
              画像アップロード判定
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">画像を選ぶだけで、ルール違反候補を即時に抽出します。</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-amber-500" />
              キビキビした操作感
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">ローディング・成功・エラーを明確に表示し、現場の待ち時間を減らします。</p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
