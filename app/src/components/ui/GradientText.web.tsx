import type { ReactNode } from 'react';
import brand from '../../theme/brand';

/** Orange-to-yellow gradient text (bg-clip-text). */
export default function GradientText({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(to right, ${brand.orange}, ${brand.yellow})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
}
