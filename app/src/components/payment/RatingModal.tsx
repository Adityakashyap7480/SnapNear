import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Star, X } from 'lucide-react-native';
import Gradient from '../ui/Gradient';
import Overlay from '../ui/Overlay';
import Text from '../ui/Text';
import { PopIn } from '../ui/motion';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const LABELS = ['', 'Poor', 'Okay', 'Average', 'Good', 'Excellent'];

export type RatingPrompt = {
  bookingId: string;
  creatorName?: string | null;
  bookingCode?: string;
};

type Props = {
  prompt: RatingPrompt;
  submitting?: boolean;
  onSubmit: (stars: number, remark: string) => void;
  onSkip: () => void;
};

/**
 * Shown right after the client closes the payment-success celebration.
 * Stars 1–3 require a short remark; 4–5 can submit without one.
 */
export default function RatingModal({ prompt, submitting, onSubmit, onSkip }: Props) {
  const [stars, setStars] = useState(0);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const needsRemark = stars > 0 && stars <= 3;
  const first = prompt.creatorName?.split(' ')[0] || 'your photographer';

  const submit = () => {
    if (stars < 1) {
      setError('Tap a star to rate');
      return;
    }
    if (needsRemark && !remark.trim()) {
      setError('Please add a short remark for 3 stars or below');
      return;
    }
    setError('');
    onSubmit(stars, remark.trim());
  };

  return (
    <Overlay onRequestClose={onSkip}>
      <View className="flex-1 items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal aria-label="Rate your shoot">
        <PopIn className="w-full max-w-sm overflow-hidden rounded-3xl bg-white" style={shadows['2xl']}>
          <Gradient colors={[colors.amber[400], colors.brand.orange, colors.rose[500]]} to="br" className="relative px-6 pb-8 pt-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip rating"
              onPress={onSkip}
              hitSlop={12}
              className="absolute right-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/20"
            >
              <X size={16} color={colors.white} />
            </Pressable>
            <Text className="text-center text-4xl" aria-hidden>
              ⭐
            </Text>
            <Text className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-amber-50">Rate your shoot</Text>
            <Text role="heading" className="mt-1 text-center font-display text-2xl font-black text-white">
              How was {first}?
            </Text>
            {prompt.bookingCode ? (
              <Text className="mt-1 text-center text-[11px] font-medium text-white/80">{prompt.bookingCode}</Text>
            ) : null}
          </Gradient>

          <View className="-mt-5 px-5 pb-6">
            <View className="items-center rounded-2xl border border-slate-100 bg-white px-4 py-5" style={shadows.lg}>
              <View className="flex-row items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = n <= stars;
                  return (
                    <Pressable
                      key={n}
                      testID={`rate-star-${n}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                      disabled={submitting}
                      onPress={() => {
                        setStars(n);
                        setError('');
                      }}
                      hitSlop={6}
                      className="p-0.5"
                    >
                      <Star size={36} color={on ? colors.amber[500] : colors.slate[200]} fill={on ? colors.amber[400] : 'transparent'} strokeWidth={2} />
                    </Pressable>
                  );
                })}
              </View>
              <Text className="mt-2 text-sm font-semibold text-slate-600">
                {stars ? LABELS[stars] : 'Tap a star'}
              </Text>
            </View>

            {needsRemark ? (
              <View className="mt-4">
                <Text className="mb-1.5 text-xs font-semibold text-slate-600">What could be better?</Text>
                <TextInput
                  testID="rate-remark"
                  value={remark}
                  onChangeText={(v) => {
                    setRemark(v);
                    setError('');
                  }}
                  placeholder="Short remark (required for 3★ or below)"
                  placeholderTextColor={colors.slate[400]}
                  multiline
                  maxLength={300}
                  editable={!submitting}
                  className="min-h-[88px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            {error ? (
              <Text className="mt-2 text-center text-[11px] font-semibold text-red-600">{error}</Text>
            ) : null}

            <Pressable
              testID="rate-submit"
              accessibilityRole="button"
              disabled={submitting || stars < 1}
              onPress={submit}
              className={`mt-5 overflow-hidden rounded-xl ${stars < 1 || submitting ? 'opacity-50' : ''}`}
              style={shadows.glow}
            >
              <Gradient colors={[colors.brand.orange, colors.brand.yellow]} className="items-center py-3.5">
                <Text className="font-display text-sm font-bold text-slate-950">
                  {submitting ? 'Submitting…' : 'Submit rating'}
                </Text>
              </Gradient>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onSkip} disabled={submitting} className="mt-3 items-center py-1">
              <Text className="text-xs font-semibold text-slate-400">Maybe later</Text>
            </Pressable>
          </View>
        </PopIn>
      </View>
    </Overlay>
  );
}
