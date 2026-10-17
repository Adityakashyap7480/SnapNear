import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import Gradient from '../ui/Gradient';
import Overlay from '../ui/Overlay';
import Spinner from '../ui/Spinner';
import Text from '../ui/Text';
import { PopIn } from '../ui/motion';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

type Props = {
  title?: string;
  subtitle?: string;
  reasons: readonly string[];
  submitting?: boolean;
  onConfirm: (reason: string, remark: string) => void;
  onClose: () => void;
};

/** Pick one of 5 reasons + optional remark, then confirm cancel. */
export default function CancelBookingModal({
  title = 'Cancel this shoot?',
  subtitle = 'Please tell us why — this helps improve SnapNear.',
  reasons,
  submitting,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!reason) {
      setError('Select a reason to continue');
      return;
    }
    setError('');
    onConfirm(reason, remark.trim());
  };

  return (
    <Overlay onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal aria-label={title}>
        <PopIn className="w-full max-w-sm overflow-hidden rounded-3xl bg-white" style={shadows['2xl']}>
          <View className="relative border-b border-slate-100 px-5 pb-4 pt-5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
              disabled={submitting}
              className="absolute right-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <X size={16} color={colors.slate[600]} />
            </Pressable>
            <Text className="pr-8 font-display text-xl font-extrabold text-slate-900">{title}</Text>
            <Text className="mt-1 text-sm text-slate-500">{subtitle}</Text>
          </View>

          <View className="gap-2 px-5 py-4">
            {reasons.map((r, i) => {
              const selected = reason === r;
              return (
                <Pressable
                  key={r}
                  testID={`cancel-reason-${i + 1}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={submitting}
                  onPress={() => {
                    setReason(r);
                    setError('');
                  }}
                  className={`rounded-xl border px-3.5 py-3 ${selected ? 'border-brand-orange bg-orange-50' : 'border-slate-200 bg-white'}`}
                >
                  <Text className={`text-sm font-semibold ${selected ? 'text-brand-orange' : 'text-slate-700'}`}>
                    {i + 1}. {r}
                  </Text>
                </Pressable>
              );
            })}

            <View className="mt-2">
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">Remarks (optional)</Text>
              <TextInput
                testID="cancel-remark"
                value={remark}
                onChangeText={setRemark}
                placeholder="Anything else we should know?"
                placeholderTextColor={colors.slate[400]}
                multiline
                maxLength={300}
                editable={!submitting}
                className="min-h-[72px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                textAlignVertical="top"
              />
            </View>

            {error ? <Text className="text-center text-[11px] font-semibold text-red-600">{error}</Text> : null}

            <Pressable
              testID="cancel-confirm"
              accessibilityRole="button"
              disabled={submitting}
              onPress={submit}
              className={`mt-2 overflow-hidden rounded-xl ${submitting ? 'opacity-60' : ''}`}
              style={shadows.md}
            >
              <Gradient colors={[colors.rose[500], colors.rose[600]]} className="flex-row items-center justify-center gap-2 py-3.5">
                {submitting ? <Spinner size={16} color={colors.white} /> : null}
                <Text className="font-display text-sm font-bold text-white">
                  {submitting ? 'Cancelling…' : 'Confirm cancel'}
                </Text>
              </Gradient>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onClose} disabled={submitting} className="items-center py-1">
              <Text className="text-xs font-semibold text-slate-400">Keep this shoot</Text>
            </Pressable>
          </View>
        </PopIn>
      </View>
    </Overlay>
  );
}
