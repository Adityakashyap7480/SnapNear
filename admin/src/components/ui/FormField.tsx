import { type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff, type LucideIcon, Search } from 'lucide-react';

// 16px text on mobile prevents iOS Safari from zooming into focused inputs
const base =
  'w-full rounded-xl border bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition outline-none focus:ring-4';
const ok = 'border-slate-200 focus:border-brand-orange focus:ring-brand-orange/10';
const bad = 'border-red-300 focus:border-red-400 focus:ring-red-500/10';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, error, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="min-w-0">
      {label && (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600">
            {label}
          </label>
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon: Icon, trailing, className = '', id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={`${base} ${error ? bad : ok} py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} ${trailing ? 'pr-11' : 'pr-3.5'} ${className}`}
          {...props}
        />
        {trailing && <div className="absolute top-1/2 right-2.5 -translate-y-1/2">{trailing}</div>}
      </div>
    </Field>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex rounded-md p-1 text-slate-400 hover:text-slate-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...props },
  ref
) {
  const areaId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={areaId}>
      <textarea
        ref={ref}
        id={areaId}
        rows={2}
        className={`${base} ${error ? bad : ok} resize-none px-3.5 py-2.5 ${className}`}
        {...props}
      />
    </Field>
  );
});

export function SearchInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-base outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 sm:text-xs"
        {...props}
      />
    </div>
  );
}
