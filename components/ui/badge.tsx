import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeStatus = 'success' | 'warn' | 'error' | 'info';

const statusClass: Record<BadgeStatus, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-700'
};

export function Badge({
  className,
  status = 'info',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { status?: BadgeStatus }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', statusClass[status], className)}
      {...props}
    />
  );
}
