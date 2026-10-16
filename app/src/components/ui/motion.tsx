import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

const native = Platform.OS !== 'web';

interface MotionProps {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

function useLoop(make: (v: Animated.Value) => Animated.CompositeAnimation, { delay = 0, enabled = true } = {}) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return undefined;
    value.setValue(0);
    const anim = Animated.loop(make(value));
    const timer = setTimeout(() => anim.start(), delay);
    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}

const timing = (v: Animated.Value, toValue: number, duration: number, easing = Easing.linear) =>
  Animated.timing(v, { toValue, duration, easing, useNativeDriver: native });

/** animate-pulse */
export function Pulse({ children, className, style, delay }: MotionProps) {
  const v = useLoop((a) => Animated.sequence([timing(a, 1, 1000, Easing.bezier(0.4, 0, 0.6, 1)), timing(a, 0, 1000, Easing.bezier(0.4, 0, 0.6, 1))]), { delay });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });
  return (
    <Animated.View className={className} style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

/** animate-spin (duration in ms) */
export function Spin({ children, className, style, duration = 1000 }: MotionProps & { duration?: number }) {
  const v = useLoop((a) => timing(a, 1, duration));
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View className={className} style={[style, { transform: [{ rotate }] }]}>
      {children}
    </Animated.View>
  );
}

/** animate-ping (Tailwind) and animate-radar (the app's slower ripple) */
export function Ripple({ className, style, delay, variant = 'radar' }: MotionProps & { variant?: 'ping' | 'radar' }) {
  const ping = variant === 'ping';
  const v = useLoop((a) => timing(a, 1, ping ? 1000 : 2000, Easing.bezier(0, 0.2, 0.8, 1)), { delay });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: ping ? [1, 2] : [0.9, 2.2] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: ping ? [0.75, 0] : [0.8, 0] });
  return <Animated.View pointerEvents="none" className={className} style={[style, { opacity, transform: [{ scale }] }]} />;
}

/** animate-fade-up: plays once on mount */
export function FadeUp({ children, className, style, delay = 0 }: MotionProps) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.ease), useNativeDriver: native }).start();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return (
    <Animated.View className={className} style={[style, { opacity: v, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/** animate-pop-in: plays once on mount */
export function PopIn({ children, className, style, delay = 0 }: MotionProps) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 550, delay, easing: Easing.bezier(0.34, 1.56, 0.64, 1), useNativeDriver: native }).start();
  }, [v, delay]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const opacity = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });
  return (
    <Animated.View className={className} style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** animate-float */
export function Float({ children, className, style, delay }: MotionProps) {
  const v = useLoop((a) => Animated.sequence([timing(a, 1, 3000, Easing.inOut(Easing.ease)), timing(a, 0, 3000, Easing.inOut(Easing.ease))]), { delay });
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  return (
    <Animated.View className={className} style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/** animate-sparkle */
export function Sparkle({ children, className, style, delay }: MotionProps) {
  const v = useLoop((a) => Animated.sequence([timing(a, 1, 1200, Easing.inOut(Easing.ease)), timing(a, 0, 1200, Easing.inOut(Easing.ease))]), { delay });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });
  return (
    <Animated.View pointerEvents="none" className={className} style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** animate-ring: an alarm clock wiggle that pauses half the cycle */
export function Ring({ children, className, style, enabled = true }: MotionProps & { enabled?: boolean }) {
  const v = useLoop((a) => timing(a, 1, 1200), { enabled });
  const rotate = v.interpolate({
    inputRange: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 1],
    outputRange: ['0deg', '-16deg', '16deg', '-16deg', '16deg', '-16deg', '16deg', '-16deg', '16deg', '0deg', '0deg'],
  });
  return (
    <Animated.View className={className} style={[style, enabled ? { transform: [{ rotate }] } : null]}>
      {children}
    </Animated.View>
  );
}

/** animate-gift-shake: plays once on mount */
export function GiftShake({ children, className, style }: MotionProps) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: native }).start();
  }, [v]);
  const rotate = v.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1],
    outputRange: ['0deg', '-12deg', '10deg', '-8deg', '6deg', '-3deg', '0deg'],
  });
  const scale = v.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1], outputRange: [1, 1.05, 1.08, 1.1, 1.14, 1.2, 1] });
  return (
    <Animated.View className={className} style={[style, { transform: [{ rotate }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
