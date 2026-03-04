import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-500 text-white shadow-sm hover:bg-cyan-400 active:bg-cyan-600 focus-ring disabled:bg-cyan-300',
  secondary:
    'bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 active:bg-emerald-600 focus-ring disabled:bg-emerald-300',
  ghost:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-ring disabled:text-slate-400',
  destructive:
    'bg-rose-500 text-white shadow-sm hover:bg-rose-400 active:bg-rose-600 focus-ring disabled:bg-rose-300'
};

export function Button({
  variant = 'primary',
  className,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '送信中...' : children}
    </button>
  );
}
