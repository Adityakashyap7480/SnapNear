import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Gradient from './Gradient';
import Text from './Text';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface CardProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
}

export default function Card({ className = '', style, children, testID }: CardProps) {
  return (
    <View testID={testID} className={`rounded-2xl border border-slate-200 bg-white ${className}`} style={[shadows.card, style]}>
      {children}
    </View>
  );
}

const TONES = {
  default: { gradient: null, border: 'border-slate-200 bg-white', value: 'text-slate-900' },
  emerald: { gradient: [colors.emerald[50], colors.teal[50]], border: 'border-emerald-200', value: 'text-emerald-700' },
  navy: { gradient: [colors.slate[900], colors.brand.navy], border: 'border-slate-800', value: 'text-brand-yellow' },
  violet: { gradient: [colors.indigo[50], '#f5f3ff'], border: 'border-indigo-200', value: 'text-brand-violet' },
} as const;

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default', className = '' }: StatCardProps) {
  const t = TONES[tone];
  const isDark = tone === 'navy';
  const body = (
    <>
      <View className="flex-row items-start justify-between gap-2">
        <Text className={`flex-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${isDark ? 'text-amber-300' : 'text-slate-500'}`}>
          {label}
        </Text>
        {Icon && <Icon size={16} color={isDark ? colors.amber[300] : colors.slate[400]} />}
      </View>
      <Text className={`mt-1.5 font-display text-lg font-black tracking-tight sm:text-2xl ${t.value}`}>{value}</Text>
      {hint && <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{hint}</Text>}
    </>
  );
  const box = `min-w-0 overflow-hidden rounded-2xl border p-3.5 sm:p-4 ${t.border} ${className}`;

  return t.gradient ? (
    <Gradient colors={t.gradient} to="br" className={box} style={isDark ? shadows.md : undefined}>
      {body}
    </Gradient>
  ) : (
    <View className={box}>{body}</View>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-10">
      {Icon && (
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Icon size={24} color={colors.slate[400]} />
        </View>
      )}
      <Text className="text-center text-sm font-bold text-slate-800">{title}</Text>
      {description && <Text className="mt-1 max-w-sm text-center text-xs text-slate-500">{description}</Text>}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
