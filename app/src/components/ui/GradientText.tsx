import type { ReactNode } from 'react';
import Text from './Text';

/** Orange-to-yellow gradient text (bg-clip-text); solid brand orange on the phone app. */
export default function GradientText({ children }: { children: ReactNode }) {
  return <Text className="font-display font-extrabold text-brand-orange">{children}</Text>;
}
