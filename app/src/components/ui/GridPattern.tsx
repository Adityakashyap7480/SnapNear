import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

/** Faint 40px grid lines over a dark/colour panel (the web `bg-grid` utility). */
export default function GridPattern({ opacity = 1, className = '' }: { opacity?: number; className?: string }) {
  const id = `grid-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <View pointerEvents="none" className={`absolute inset-0 ${className}`} style={{ opacity }}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
            <Path d="M0 0.5H40M0.5 0V40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
