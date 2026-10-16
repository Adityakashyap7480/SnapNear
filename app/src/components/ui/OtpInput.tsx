import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import Text from './Text';
import { Pulse } from './motion';

const TONES = {
  light: {
    box: 'border-slate-200 bg-white',
    text: 'text-slate-900',
    active: 'border-brand-orange',
    ring: 'rgba(255, 128, 8, 0.2)',
    error: 'border-red-400 bg-red-50',
    errorText: 'text-red-700',
  },
  dark: {
    box: 'border-slate-700 bg-slate-800',
    text: 'text-white',
    active: 'border-emerald-400',
    ring: 'rgba(52, 211, 153, 0.2)',
    error: 'border-red-500 bg-red-950/60',
    errorText: 'text-red-200',
  },
};

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  tone?: keyof typeof TONES;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
  id?: string;
  label?: string;
}

/**
 * Digit boxes backed by one real input, so typing, paste, backspace and
 * SMS one-time-code autofill all behave natively.
 */
export default function OtpInput({ value, onChange, length = 4, tone = 'light', error = false, disabled, autoFocus, onComplete, id, label = 'OTP' }: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const styles = TONES[tone];
  const digits = value.split('');

  const handleChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <View className="relative self-center">
      <View className="flex-row gap-2.5 sm:gap-3" aria-hidden pointerEvents="none">
        {Array.from({ length }, (_, i) => {
          const isActive = focused && (i === digits.length || (i === length - 1 && digits.length === length));
          return (
            <View
              key={i}
              className={`h-14 w-12 items-center justify-center rounded-xl border-2 sm:h-16 sm:w-14 ${error ? styles.error : isActive ? `${styles.box} ${styles.active}` : styles.box}`}
              style={isActive && !error ? { boxShadow: `0px 0px 0px 4px ${styles.ring}` } : undefined}
            >
              {digits[i] ? (
                <Text className={`font-display text-2xl font-black sm:text-3xl ${error ? styles.errorText : styles.text}`}>{digits[i]}</Text>
              ) : isActive ? (
                <Pulse>
                  <View className={`h-7 w-0.5 rounded opacity-60 ${tone === 'dark' ? 'bg-white' : 'bg-slate-900'}`} />
                </Pulse>
              ) : null}
            </View>
          );
        })}
      </View>
      <TextInput
        id={id}
        testID={id}
        accessibilityLabel={label}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        editable={!disabled}
        autoFocus={autoFocus}
        caretHidden
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0, color: 'transparent', ...(Platform.OS === 'web' ? { outlineStyle: 'none', cursor: 'text' } : null) } as object}
      />
    </View>
  );
}
