import type { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-orange to-brand-yellow text-slate-950 shadow-glow hover:brightness-110 focus-visible:ring-brand-orange/40',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900/30',
  success: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 focus-visible:ring-emerald-500/40',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  amber: 'bg-amber-600 text-white shadow-md shadow-amber-600/25 hover:bg-amber-700 focus-visible:ring-amber-500/40',
  destructive: 'bg-red-600 text-white shadow-md shadow-red-600/25 hover:bg-red-700 focus-visible:ring-red-500/40',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3.5 text-sm rounded-xl gap-2',
};

export type ButtonVariant = keyof typeof VARIANTS;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-display font-bold transition outline-none focus-visible:ring-4 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
