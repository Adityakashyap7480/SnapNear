import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import Overlay from '../ui/Overlay';
import Spinner from '../ui/Spinner';
import Text from '../ui/Text';
import { PopIn } from '../ui/motion';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

type Props = {
  deleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Type "Delete" to arm the red Confirm button — same copy and delete flow as before, new layout. */
export default function DeleteAccountModal({ deleting, onConfirm, onClose }: Props) {
  const [typed, setTyped] = useState('');
  const armed = typed.trim() === 'Delete';

  return (
    <Overlay onRequestClose={deleting ? () => {} : onClose}>
      <View
        className="flex-1 items-center justify-center bg-slate-950/50 p-5"
        role="dialog"
        aria-modal
        aria-label="Are you sure you want to delete your account?"
      >
        <PopIn className="w-full max-w-sm rounded-3xl bg-white p-6" style={shadows['2xl']}>
          <View className="items-center">
            <Trash2 size={60} color={colors.red[500]} strokeWidth={1.5} />
            <Text className="mt-4 text-center text-xl font-bold leading-7 text-slate-900">
              Are you sure you want to delete your account?
            </Text>
            <Text className="mt-3 text-center text-sm leading-5 text-slate-500">
              This permanently deletes your SnapNear account and personal data. Past booking and payment
              records are kept without your name or contact details, as the law requires.
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
              You will be logged out immediately and this cannot be undone. If you are a partner, withdraw
              any Wallet balance first — pending payouts cannot be processed after deletion.
            </Text>
          </View>

          <TextInput
            testID="delete-account-confirm-input"
            value={typed}
            onChangeText={setTyped}
            placeholder={'Enter "Delete"'}
            placeholderTextColor={colors.slate[400]}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!deleting}
            className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 sm:text-sm"
          />

          <View className="mt-5 flex-row gap-3">
            <Pressable
              testID="delete-account-confirm"
              accessibilityRole="button"
              accessibilityState={{ disabled: !armed || Boolean(deleting) }}
              disabled={!armed || deleting}
              onPress={onConfirm}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${
                armed ? 'bg-red-600 active:bg-red-700' : 'bg-slate-100'
              }`}
            >
              {deleting ? <Spinner size={16} color={colors.white} /> : null}
              <Text className={`font-display text-sm font-bold ${armed ? 'text-white' : 'text-slate-400'}`}>
                {deleting ? 'Deleting…' : 'Confirm'}
              </Text>
            </Pressable>

            <Pressable
              testID="delete-account-cancel"
              accessibilityRole="button"
              disabled={deleting}
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl bg-brand-orange py-3.5 active:opacity-80"
            >
              <Text className="font-display text-sm font-bold text-white">No</Text>
            </Pressable>
          </View>
        </PopIn>
      </View>
    </Overlay>
  );
}
