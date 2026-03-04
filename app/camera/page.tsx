import { AppShell } from '@/components/layout/app-shell';
import { CheckPanel } from '@/components/worker/check-panel';

export default function CameraPage() {
  return (
    <AppShell actionHref="/worker" actionLabel="作業者画面へ">
      <CheckPanel />
    </AppShell>
  );
}
