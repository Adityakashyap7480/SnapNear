import { useState } from 'react';

const TONES = {
  light: {
    box: 'border-slate-200 bg-white text-slate-900',
    active: 'border-brand-orange ring-4 ring-brand-orange/20',
    error: 'border-red-400 bg-red-50 text-red-700',
  },
  dark: {
    box: 'border-slate-700 bg-slate-800 text-white',
    active: 'border-emerald-400 ring-4 ring-emerald-400/20',
    error: 'border-red-500 bg-red-950/60 text-red-200',
  },
};

/**
 * Digit boxes backed by one real input, so typing, paste, backspace and
 * SMS one-time-code autofill all behave natively.
 */
export default function OtpInput({ value, onChange, length = 4, tone = 'light', error = false, disabled, autoFocus, onComplete, id, label = 'OTP' }) {
  const [focused, setFocused] = useState(false);
  const styles = TONES[tone];
  const digits = value.split('');

  const handleChange = (e) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <div className="relative mx-auto w-fit">
      <div className="flex gap-2.5 sm:gap-3" aria-hidden>
        {Array.from({ length }, (_, i) => {
          const isActive = focused && (i === digits.length || (i === length - 1 && digits.length === length));
          return (
            <div
              key={i}
              className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 font-display text-2xl font-black tabular-nums transition sm:h-16 sm:w-14 sm:text-3xl ${
                error ? styles.error : isActive ? `${styles.box} ${styles.active}` : styles.box
              }`}
            >
              {digits[i] || (isActive ? <span className="h-7 w-0.5 animate-pulse rounded bg-current opacity-60" /> : '')}
            </div>
          );
        })}
      </div>
      <input
        id={id}
        aria-label={label}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={length}
        disabled={disabled}
        autoFocus={autoFocus}
        className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}
