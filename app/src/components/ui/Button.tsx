import type { ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Gradient from './Gradient';
import Spinner from './Spinner';
import Text from './Text';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface Variant {
  box: string;
  text: string;
  icon: string;
  gradient?: readonly [string, string];
  shadow?: ViewStyle;
}

const VARIANTS = {
  primary: { box: '', text: 'text-slate-950', icon: colors.slate[950], gradient: [colors.brand.orange, colors.brand.yellow], shadow: shadows.glow },
  dark: { box: 'bg-slate-900 active:bg-slate-800', text: 'text-white', icon: colors.white },
  success: { box: 'bg-emerald-600 active:bg-emerald-700', text: 'text-white', icon: colors.white, shadow: shadows.emerald },
  violet: { box: 'bg-brand-violet', text: 'text-white', icon: colors.white, shadow: shadows.glowViolet },
  outline: { box: 'border border-slate-200 bg-white active:bg-slate-50', text: 'text-slate-700', icon: colors.slate[700] },
  ghost: { box: 'active:bg-slate-100', text: 'text-slate-600', icon: colors.slate[600] },
  danger: { box: 'border border-red-200 bg-white active:bg-red-50', text: 'text-red-600', icon: colors.red[600] },
} satisfies Record<string, Variant>;

const SIZES = {
  sm: { box: 'px-3 py-2.5 rounded-lg gap-1.5 min-h-[44px]', text: 'text-xs', icon: 14 },
  md: { box: 'px-4 py-2.5 rounded-xl gap-2 min-h-[44px]', text: 'text-sm', icon: 16 },
  lg: { box: 'px-5 py-3.5 rounded-xl gap-2 min-h-[48px]', text: 'text-sm', icon: 16 },
};

export type ButtonVariant = keyof typeof VARIANTS;

interface ButtonProps {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Shown before the label; replaced by the spinner while loading */
  icon?: LucideIcon;
  iconAfter?: LucideIcon;
  iconSize?: number;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  children?: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  onPress,
  icon: Icon,
  iconAfter: IconAfter,
  iconSize,
  className = '',
  textClassName = '',
  style,
  testID,
  accessibilityLabel,
  children,
}: ButtonProps) {
  const v: Variant = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = Boolean(disabled || loading);
  const iSize = iconSize ?? s.icon;

  const content = (
    <>
      {loading ? <Spinner size={16} color={v.icon} /> : Icon && <Icon size={iSize} color={v.icon} />}
      {typeof children === 'string' || Array.isArray(children) ? (
        <Text className={`font-display font-bold ${v.text} ${s.text} ${textClassName}`}>{children}</Text>
      ) : (
        children
      )}
      {!loading && IconAfter && <IconAfter size={iSize} color={v.icon} />}
    </>
  );

  const rowClass = `flex-row items-center justify-center ${s.box}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      hitSlop={Platform.OS === 'android' ? { top: 10, bottom: 10, left: 6, right: 6 } : undefined}
      android_disableSound={false}
      className={`overflow-hidden ${v.gradient ? s.box.split(' ').filter((c) => c.startsWith('rounded')).join(' ') : `${rowClass} ${v.box}`} ${className}`}
      style={[v.shadow, style, isDisabled ? { opacity: 0.6 } : null]}
    >
      {v.gradient ? <Gradient colors={v.gradient} className={rowClass} pointerEvents="none">{content}</Gradient> : content}
    </Pressable>
  );
}
