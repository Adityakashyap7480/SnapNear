import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Text from './Text';
import { Pulse } from './motion';

const TONES = {
  slate: { box: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
  emerald: { box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  amber: { box: 'bg-amber-100 border-amber-200', text: 'text-amber-800' },
  indigo: { box: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-800' },
  orange: { box: 'bg-orange-50 border-orange-200', text: 'text-brand-orange' },
  red: { box: 'bg-red-50 border-red-200', text: 'text-red-700' },
  brand: { box: 'bg-brand-orange border-orange-300', text: 'text-white' },
};

const TEXT_COLORS: Record<string, string> = {
  'text-slate-600': '#475569',
  'text-emerald-700': '#047857',
  'text-amber-800': '#92400e',
  'text-indigo-800': '#3730a3',
  'text-brand-orange': '#ff8008',
  'text-red-700': '#b91c1c',
  'text-white': '#ffffff',
};

const SIZES = {
  sm: { box: 'gap-1 px-2 py-0.5', text: 'text-[10px]' },
  md: { box: 'gap-1.5 px-2.5 py-0.5', text: 'text-[11px]' },
};

export type BadgeTone = keyof typeof TONES;

interface BadgeProps {
  tone?: BadgeTone;
  /** Overrides `tone` when the colours come from elsewhere (e.g. STATUS_META) */
  colors?: { box: string; text: string };
  icon?: LucideIcon;
  dot?: string;
  pulse?: boolean;
  ring?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
  children?: ReactNode;
}

/** Small rounded pill used for statuses and counts. */
export default function Badge({ tone = 'slate', colors, icon: Icon, dot, pulse = false, ring = false, size = 'sm', className = '', children }: BadgeProps) {
  const c = colors || TONES[tone];
  const s = SIZES[size];
  const dotView = dot ? <View className={`h-1.5 w-1.5 rounded-full ${dot}`} /> : null;
  const box = ring ? `border ${c.box}` : c.box.replace(/(^|\s)border-\S+/g, ' ');
  return (
    <View className={`shrink-0 flex-row items-center self-start rounded-full ${s.box} ${box} ${className}`}>
      {dot && (pulse ? <Pulse>{dotView}</Pulse> : dotView)}
      {Icon && <Icon size={12} color={TEXT_COLORS[c.text] || '#475569'} />}
      <Text className={`font-bold ${s.text} ${c.text}`} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
