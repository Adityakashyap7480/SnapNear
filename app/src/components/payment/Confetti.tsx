import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View, useWindowDimensions } from 'react-native';
import { CONFETTI_COLORS } from './confettiColors';

const FRAME_MS = 1000 / 60;
const TICKS = 200;
const SAMPLES = 20;
const GRAVITY = 3;
const DECAY = 0.9;

interface Burst {
  count: number;
  angle: number;
  spread: number;
  startVelocity: number;
  origin: { x: number; y: number };
  delay?: number;
  /** Stagger each piece over this many ms (side cannons) */
  stagger?: number;
  emoji?: string;
  scalar?: number;
}

// Same bursts as the web canvas-confetti version, with fewer pieces for the native renderer
const BURSTS: Burst[] = [
  { count: 110, angle: 90, spread: 110, startVelocity: 48, origin: { x: 0.5, y: 0.42 } },
  { count: 16, angle: 90, spread: 130, startVelocity: 38, origin: { x: 0.5, y: 0.42 }, delay: 220, emoji: '🎁', scalar: 2.4 },
  { count: 36, angle: 60, spread: 60, startVelocity: 45, origin: { x: 0, y: 0.75 }, stagger: 1500 },
  { count: 36, angle: 120, spread: 60, startVelocity: 45, origin: { x: 1, y: 0.75 }, stagger: 1500 },
];

interface Piece {
  key: string;
  left: number;
  top: number;
  delay: number;
  xs: number[];
  ys: number[];
  spin: number;
  color: string;
  size: number;
  round: boolean;
  emoji?: string;
}

function simulate(b: Burst, width: number, height: number, i: number): Piece {
  const rad = (b.angle * Math.PI) / 180;
  const spread = (b.spread * Math.PI) / 180;
  const angle = -rad + (0.5 * spread - Math.random() * spread);
  let velocity = b.startVelocity * 0.5 + Math.random() * b.startVelocity;
  let x = 0;
  let y = 0;
  const xs = [0];
  const ys = [0];
  for (let t = 1; t <= TICKS; t += 1) {
    x += Math.cos(angle) * velocity;
    y += Math.sin(angle) * velocity + GRAVITY;
    velocity *= DECAY;
    if (t % (TICKS / SAMPLES) === 0) {
      xs.push(x);
      ys.push(y);
    }
  }
  const scalar = b.scalar || 1;
  return {
    key: `${b.angle}-${b.origin.x}-${i}`,
    left: b.origin.x * width,
    top: b.origin.y * height,
    delay: (b.delay || 0) + (b.stagger ? Math.random() * b.stagger : 0),
    xs,
    ys,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: (6 + Math.random() * 5) * scalar,
    round: Math.random() < 0.5,
    emoji: b.emoji,
  };
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(progress, { toValue: 1, duration: TICKS * FRAME_MS, delay: piece.delay, easing: Easing.linear, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [progress, piece.delay]);

  const input = piece.xs.map((_, i) => i / SAMPLES);
  const style = {
    position: 'absolute' as const,
    left: piece.left,
    top: piece.top,
    opacity: progress.interpolate({ inputRange: [0, 0.001, 0.7, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateX: progress.interpolate({ inputRange: input, outputRange: piece.xs }) },
      { translateY: progress.interpolate({ inputRange: input, outputRange: piece.ys }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] }) },
    ],
  };

  if (piece.emoji) {
    return (
      <Animated.View style={style}>
        <Text style={{ fontSize: piece.size }}>{piece.emoji}</Text>
      </Animated.View>
    );
  }
  return (
    <Animated.View
      style={[style, { width: piece.size, height: piece.round ? piece.size : piece.size * 0.6, borderRadius: piece.round ? piece.size / 2 : 1, backgroundColor: piece.color }]}
    />
  );
}

/** Fires once when `fire` turns true. */
export default function Confetti({ fire }: { fire: boolean }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () => (fire ? BURSTS.flatMap((b) => Array.from({ length: b.count }, (_, i) => simulate(b, width, height, i))) : []),
    // Sized once per burst; a rotation mid-animation shouldn't restart it
    [fire] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!pieces.length) return null;
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <ConfettiPiece key={p.key} piece={p} />
      ))}
    </View>
  );
}
