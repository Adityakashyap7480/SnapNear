import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

interface GridProps {
  cols: number;
  /** Tailwind gap class, applied between rows and columns */
  gap?: string;
  className?: string;
  children: ReactNode;
}

/** Equal-width columns (like CSS grid-cols-N) built from flex rows. */
export default function Grid({ cols, gap = 'gap-3', className = '', children }: GridProps) {
  const items = Children.toArray(children).filter(Boolean);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

  return (
    <View className={`${gap} ${className}`}>
      {rows.map((row, r) => (
        <View key={r} className={`flex-row ${gap}`}>
          {row.map((item, c) => (
            <View key={c} className="min-w-0 flex-1">
              {item}
            </View>
          ))}
          {Array.from({ length: cols - row.length }, (_, k) => (
            <View key={`pad-${k}`} className="flex-1" />
          ))}
        </View>
      ))}
    </View>
  );
}
