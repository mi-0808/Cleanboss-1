import { AppShell } from '@/components/layout/app-shell';
import { CheckPanel } from '@/components/worker/check-panel';

export default function WorkerPage() {
  return (
    <AppShell actionHref="/camera" actionLabel="カメラ画面へ">
      <CheckPanel />
    </AppShell>
  );
}
