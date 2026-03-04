import { HTMLAttributes } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type AlertTone = 'info' | 'warn' | 'error' | 'success';

const toneClass: Record<AlertTone, string> = {
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800'
};

const toneIcon: Record<AlertTone, typeof Info> = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2
};

export function Alert({
  className,
  tone = 'info',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const Icon = toneIcon[tone];

  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4 text-sm', toneClass[tone], className)} role="alert" {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-6">{children}</div>
    </div>
  );
}
