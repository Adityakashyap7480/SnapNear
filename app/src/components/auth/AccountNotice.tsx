import { Pressable, View } from 'react-native';
import { Ban, Clock, Mail } from 'lucide-react-native';
import Text from '../ui/Text';
import { FadeUp } from '../ui/motion';
import { ACCOUNT_STATUS } from '../../config/constants';
import { useCatalog } from '../../context/CatalogContext';
import { openLink } from '../../lib/links';
import { colors } from '../../theme/colors';
import type { AccountNoticeInfo } from '../../types';

const VARIANTS = {
  [ACCOUNT_STATUS.SUSPENDED]: {
    icon: Clock,
    title: 'Account suspended',
    box: 'border-amber-200 bg-amber-50',
    iconBox: 'bg-amber-100',
    iconColor: colors.amber[700],
    titleColor: 'text-amber-900',
    button: 'bg-amber-600 active:bg-amber-700',
  },
  [ACCOUNT_STATUS.BLOCKED]: {
    icon: Ban,
    title: 'Account blocked',
    box: 'border-red-200 bg-red-50',
    iconBox: 'bg-red-100',
    iconColor: colors.red[700],
    titleColor: 'text-red-900',
    button: 'bg-red-600 active:bg-red-700',
  },
};

function supportMailto(supportEmail: string, status: string, email?: string) {
  const subject = `Account review request${email ? ` - ${email}` : ''}`;
  const body = [
    'Hello SnapNear Support,',
    '',
    `My SnapNear account${email ? ` (${email})` : ''} has been ${status}. Could you please review it and let me know the next steps?`,
    '',
    'Thank you.',
  ].join('\n');
  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AccountNotice({ notice }: { notice: AccountNoticeInfo }) {
  const { supportEmail: catalogSupportEmail } = useCatalog();
  const status = notice.account?.status === ACCOUNT_STATUS.BLOCKED ? ACCOUNT_STATUS.BLOCKED : ACCOUNT_STATUS.SUSPENDED;
  const v = VARIANTS[status];
  const Icon = v.icon;
  const supportEmail = notice.account?.supportEmail || catalogSupportEmail;
  const reason = notice.account?.reason;

  return (
    <FadeUp className={`rounded-2xl border p-4 ${v.box}`}>
      <View role="alert" className="flex-row items-start gap-3">
        <View className={`h-10 w-10 shrink-0 items-center justify-center rounded-xl ${v.iconBox}`}>
          <Icon size={20} color={v.iconColor} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className={`font-display text-sm font-bold ${v.titleColor}`}>{v.title}</Text>
          <Text className="mt-1 text-xs leading-5 text-slate-700">{notice.message}</Text>
          {reason && (
            <Text className="mt-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-slate-700">
              <Text className="text-xs font-semibold text-slate-700">Reason:</Text> {reason}
            </Text>
          )}
        </View>
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => openLink(supportMailto(supportEmail, status, notice.email))}
        className={`mt-4 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 py-2.5 ${v.button}`}
      >
        <Mail size={16} color={colors.white} />
        <Text className="shrink text-center text-sm font-bold text-white">Email {supportEmail}</Text>
      </Pressable>
      <Text className="mt-2 text-center text-[11px] text-slate-500">
        Please write from your registered email address so we can find your account quickly.
      </Text>
    </FadeUp>
  );
}
