import { type ReactNode, forwardRef, useState } from 'react';
import { Platform, Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Check, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import Text from './Text';
import { colors } from '../../theme/colors';

const isWeb = Platform.OS === 'web';
// 16px text on small screens prevents iOS Safari from zooming into focused inputs
const inputText = 'text-base text-slate-900 sm:text-sm';
// react-native-web accepts outlineStyle 'none'; RN's type only lists border styles
const webNoOutline = isWeb ? ({ outlineStyle: 'none' } as object) : null;

const frame = (error?: string, focused?: boolean) =>
  `rounded-xl border bg-white ${error ? (focused ? 'border-red-400' : 'border-red-300') : focused ? 'border-brand-orange' : 'border-slate-200'}`;
const focusRing = (error?: string) => ({
  boxShadow: error ? '0px 0px 0px 4px rgba(239, 68, 68, 0.1)' : '0px 0px 0px 4px rgba(255, 128, 8, 0.1)',
});

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, right, children, className = '' }: FieldProps) {
  return (
    <View className={`min-w-0 ${className}`}>
      {(label || right) && (
        <View className="mb-1.5 flex-row flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          {label && <Text className="text-xs font-semibold text-slate-600">{label}</Text>}
          {right}
        </View>
      )}
      {children}
      {error ? (
        <Text className="mt-1 text-[11px] font-medium text-red-600">{error}</Text>
      ) : (
        hint && <Text className="mt-1 text-[11px] text-slate-400">{hint}</Text>
      )}
    </View>
  );
}

export interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  prefix?: string;
  right?: ReactNode;
  trailing?: ReactNode;
  /** Used as the element id (tests, labels) */
  name?: string;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, icon: Icon, prefix, right, trailing, name, className = '', multiline, onFocus, onBlur, style, ...props },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} right={right} className={className}>
      <View className={`flex-row items-center ${frame(error, focused)}`} style={focused ? focusRing(error) : undefined}>
        {Icon && (
          <View pointerEvents="none" className="pl-3.5">
            <Icon size={16} color={colors.slate[400]} />
          </View>
        )}
        {prefix && (
          <Text pointerEvents="none" className="pl-3.5 text-sm font-semibold text-slate-500">
            {prefix}
          </Text>
        )}
        <TextInput
          ref={ref}
          id={name}
          testID={name}
          aria-invalid={Boolean(error)}
          placeholderTextColor={colors.slate[400]}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`min-w-0 flex-1 py-2.5 ${Icon ? 'pl-2.5' : prefix ? 'pl-2' : 'pl-3.5'} ${trailing ? 'pr-2' : 'pr-3.5'} ${inputText} ${multiline ? 'min-h-[64px]' : ''}`}
          style={[webNoOutline, multiline ? { textAlignVertical: 'top' } : null, style]}
          {...props}
        />
        {trailing && <View className="pr-2.5">{trailing}</View>}
      </View>
    </Field>
  );
});

export const PasswordInput = forwardRef<TextInput, InputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          className="rounded-md p-1"
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} color={colors.slate[400]} /> : <Eye size={16} color={colors.slate[400]} />}
        </Pressable>
      }
      {...props}
    />
  );
});

export function Textarea(props: InputProps) {
  return <Input multiline numberOfLines={2} {...props} />;
}

interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ label, error, hint, name, value, onChange, options, className = '' }: SelectProps) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <View className={`overflow-hidden ${frame(error)} ${isWeb ? '' : 'h-12 justify-center'}`}>
        <Picker
          id={name}
          testID={name}
          selectedValue={value}
          onValueChange={(v) => onChange(String(v))}
          mode="dropdown"
          dropdownIconColor={colors.slate[500]}
          style={
            isWeb
              ? ({ borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.slate[900], cursor: 'pointer', outlineStyle: 'none' } as object)
              : { color: colors.slate[900] }
          }
        >
          {options.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>
    </Field>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  /** Tailwind bg/border colour for the checked state */
  tone?: 'orange' | 'violet';
  children: ReactNode;
}

export function Checkbox({ checked, onChange, name, tone = 'orange', children }: CheckboxProps) {
  const on = tone === 'violet' ? 'border-brand-violet bg-brand-violet' : 'border-brand-orange bg-brand-orange';
  return (
    <Pressable
      testID={name}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-2.5"
    >
      <View className={`mt-0.5 h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? on : 'border-slate-400 bg-white'}`}>
        {checked && <Check size={12} color={colors.white} strokeWidth={3} />}
      </View>
      <View className="min-w-0 flex-1">{children}</View>
    </Pressable>
  );
}
