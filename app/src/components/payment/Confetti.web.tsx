import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CONFETTI_COLORS } from './confettiColors';

// Above react-native-web's Modal layer
const Z_INDEX = 10000;

function fireConfetti() {
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, zIndex: Z_INDEX };
  confetti({ ...base, particleCount: 150, spread: 110, startVelocity: 48, origin: { y: 0.42 } });

  let gift: confetti.Shape | null = null;
  try {
    gift = confetti.shapeFromText({ text: '🎁', scalar: 2.4 });
  } catch {
    /* emoji shapes unsupported */
  }
  if (gift) {
    const shape = gift;
    setTimeout(() => confetti({ ...base, shapes: [shape], scalar: 2.4, particleCount: 16, spread: 130, startVelocity: 38, origin: { y: 0.42 } }), 220);
  }

  const end = Date.now() + 1500;
  (function sideCannons() {
    confetti({ ...base, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(sideCannons);
  })();
}

/** Fires once when `fire` turns true. */
export default function Confetti({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (fire) fireConfetti();
  }, [fire]);
  useEffect(
    () => () => {
      confetti.reset();
    },
    []
  );
  return null;
}
