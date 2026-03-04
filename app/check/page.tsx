import { AppShell } from '@/components/layout/app-shell';
import { CheckPanel } from '@/components/worker/check-panel';

export default function CheckPage() {
  return (
    <AppShell actionHref="/" actionLabel="トップへ戻る">
      <CheckPanel />
    </AppShell>
  );
}
