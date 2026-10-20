import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, View } from 'react-native';
import { ChevronsRight } from 'lucide-react-native';
import Text from './Text';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface SwipeButtonProps {
  label: string;
  /** Fired once the thumb is dragged (or tapped, for accessibility) to the end. */
  onSwipe: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

const THUMB = 52;
const TRIGGER_RATIO = 0.72;

/** Slide-to-confirm button: drag the thumb left → right (>>>) to fire `onSwipe`. */
export default function SwipeButton({ label, onSwipe, loading = false, disabled = false, testID }: SwipeButtonProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const firedRef = useRef(false);
  const max = Math.max(0, trackWidth - THUMB - 8);
  const isDisabled = disabled || loading;

  // The PanResponder is created once and keeps its first callbacks, so everything those
  // callbacks touch must live in refs. Capturing first-render values (trackWidth still 0,
  // so max = 0) would clamp the thumb to 0 forever and the swipe could never move.
  const maxRef = useRef(0);
  maxRef.current = max;
  const disabledRef = useRef(isDisabled);
  disabledRef.current = isDisabled;
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  const setDrag = useCallback((value: number) => {
    const next = Math.min(Math.max(0, value), maxRef.current);
    offsetRef.current = next;
    setOffset(next);
  }, []);

  const complete = useCallback(() => {
    if (disabledRef.current || firedRef.current) return;
    firedRef.current = true;
    setDrag(maxRef.current);
    onSwipeRef.current();
    // Let the parent drive the end state (busy/success); reset so it can be used again.
    setTimeout(() => {
      firedRef.current = false;
      setDrag(0);
    }, 600);
  }, [setDrag]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_e, gesture) => setDrag(gesture.dx),
      onPanResponderRelease: (_e, gesture) => {
        if (maxRef.current > 0 && gesture.dx >= maxRef.current * TRIGGER_RATIO) complete();
        else setDrag(0);
      },
      onPanResponderTerminate: () => setDrag(0),
    })
  ).current;

  const progress = max > 0 ? offset / max : 0;

  return (
    <View
      testID={testID}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className="relative h-[60px] w-full overflow-hidden rounded-full bg-emerald-700"
      style={shadows.emerald}
    >
      {/* Filled trail behind the thumb */}
      <View className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: offset + THUMB + 8 }} />
      <View className="absolute inset-0 flex-row items-center justify-center gap-1 pl-10">
        <Text className="font-display text-sm font-black tracking-wide text-white" style={{ opacity: 1 - progress * 0.7 }}>
          {label}
        </Text>
        <ChevronsRight size={18} color={colors.white} style={{ opacity: 1 - progress * 0.7 }} />
        <ChevronsRight size={18} color={colors.white} style={{ opacity: 0.75 - progress * 0.5, marginLeft: -12 }} />
        <ChevronsRight size={18} color={colors.white} style={{ opacity: 0.5 - progress * 0.35, marginLeft: -12 }} />
      </View>
      <View
        {...pan.panHandlers}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Swipe right or double tap to confirm"
        onAccessibilityTap={complete}
        className="absolute top-1 h-[52px] w-[52px] items-center justify-center rounded-full bg-white"
        style={{ left: offset + 4, ...({ touchAction: 'none', userSelect: 'none', cursor: 'grab' } as object), ...(shadows.lg as object) }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.emerald[700]} />
        ) : (
          <ChevronsRight size={26} color={colors.emerald[700]} />
        )}
      </View>
    </View>
  );
}
