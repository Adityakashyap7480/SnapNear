import { useState } from 'react';
import { Calendar } from 'lucide-react-native';
import { View } from 'react-native';
import { Field } from './FormField';
import { colors } from '../../theme/colors';
import type { DateInputProps } from './DateInput';

export default function DateInput({ label, error, name, value, min, onChange, className = '' }: DateInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} error={error} className={className}>
      <View
        className={`flex-row items-center rounded-xl border bg-white ${error ? 'border-red-300' : focused ? 'border-brand-orange' : 'border-slate-200'}`}
        style={focused ? { boxShadow: '0px 0px 0px 4px rgba(255, 128, 8, 0.1)' } : undefined}
      >
        <View pointerEvents="none" className="pl-3.5">
          <Calendar size={16} color={colors.slate[400]} />
        </View>
        <input
          id={name}
          data-testid={name}
          type="date"
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={Boolean(error)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 'none',
            background: 'transparent',
            padding: '10px 14px 10px 10px',
            fontSize: 14,
            fontFamily: 'inherit',
            color: colors.slate[900],
          }}
        />
      </View>
    </Field>
  );
}
