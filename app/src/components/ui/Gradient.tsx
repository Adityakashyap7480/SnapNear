import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const DIRECTIONS = {
  r: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  b: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  br: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  tr: { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
};

interface GradientProps {
  colors: readonly [string, string, ...string[]];
  /** Like bg-gradient-to-{dir} */
  to?: keyof typeof DIRECTIONS;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  pointerEvents?: 'none' | 'auto' | 'box-none' | 'box-only';
}

export default function Gradient({ colors, to = 'r', className, style, children, pointerEvents }: GradientProps) {
  return (
    <LinearGradient colors={colors} {...DIRECTIONS[to]} className={className} style={style} pointerEvents={pointerEvents}>
      {children}
    </LinearGradient>
  );
}
