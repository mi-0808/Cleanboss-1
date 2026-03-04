import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'focus-ring h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900',
        className
      )}
      {...props}
    />
  );
}
