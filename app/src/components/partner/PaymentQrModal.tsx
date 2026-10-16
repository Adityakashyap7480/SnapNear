import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Copy, MessageCircle, QrCode, RefreshCw } from 'lucide-react-native';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Text from '../ui/Text';
import { Pulse } from '../ui/motion';
import { creatorApi } from '../../api/services';
import { useCatalog } from '../../context/CatalogContext';
import { copyToClipboard } from '../../lib/clipboard';
import { openLink } from '../../lib/links';
import toast from '../../lib/toast';
import type { ApiFailure, Booking } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { isPaid } from '../../utils/bookingStatus';
import { formatINR } from '../../utils/format';

const POLL_MS = 4000;

interface PaymentQrModalProps {
  job: Booking;
  onClose: () => void;
  onPaid: (booking: Booking) => void;
}

/**
 * Shows the SnapNear (Razorpay) payment page for a completed job as a QR code and
 * keeps checking until the customer pays.
 */
export default function PaymentQrModal({ job, onClose, onPaid }: PaymentQrModalProps) {
  const { partnerPct } = useCatalog();
  const { width } = useWindowDimensions();
  const [link, setLink] = useState<{ linkId: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const firstName = job.client.name?.split(' ')[0] || 'the customer';

  useEffect(() => {
    let cancelled = false;
    creatorApi
      .collectLink(job.id)
      .then((res) => !cancelled && setLink(res.link))
      .catch((err: ApiFailure) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [job.id, attempt]);

  const check = useCallback(
    async ({ silent = true } = {}) => {
      try {
        const { booking } = await creatorApi.paymentStatus(job.id);
        if (isPaid(booking)) onPaid(booking);
        else if (!silent) toast('Not paid yet. Ask the customer to complete the payment.', { icon: '⏳' });
      } catch (err) {
        if (!silent) toast.error((err as ApiFailure).message);
      }
    },
    [job.id, onPaid]
  );

  useEffect(() => {
    if (!link) return undefined;
    const timer = setInterval(() => check(), POLL_MS);
    return () => clearInterval(timer);
  }, [link, check]);

  const checkNow = async () => {
    setChecking(true);
    await check({ silent: false });
    setChecking(false);
  };

  const copyLink = () => link && copyToClipboard(link.url, 'Payment link', 'Could not copy. Long-press the link to copy it.');

  const waText = link ? encodeURIComponent(`Hi ${firstName}, thanks for shooting with SnapNear! Please pay ${formatINR(job.total)} for ${job.code} here: ${link.url}`) : '';

  return (
    <Modal
      open
      onClose={onClose}
      title={`Collect ${formatINR(job.total)}`}
      description={`${job.code} • ${job.client.name} • ${job.occasion}`}
      icon={QrCode}
      iconBox="bg-orange-100"
      iconColor={colors.brand.orange}
      footer={
        link && (
          <Button variant="outline" onPress={checkNow} loading={checking} icon={RefreshCw}>
            Check payment status
          </Button>
        )
      }
    >
      {error ? (
        <View className="items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <Text className="text-center text-sm font-semibold text-red-700">{error}</Text>
          <Button
            variant="danger"
            size="sm"
            onPress={() => {
              setError('');
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </View>
      ) : !link ? (
        <View className="items-center gap-3 py-10">
          <ActivityIndicator size="large" color={colors.brand.orange} />
          <Text className="text-xs text-slate-500">Generating secure payment QR...</Text>
        </View>
      ) : (
        <View className="items-center">
          <View testID="payment-qr" className="rounded-2xl border-4 border-slate-900 bg-white p-3" style={shadows.lg}>
            <QRCode value={link.url} size={width >= 400 ? 220 : 200} ecl="M" quietZone={4} />
          </View>
          <Text className="mt-3 font-display text-3xl font-black text-slate-900">{formatINR(job.total)}</Text>
          <Text className="mt-1 max-w-xs text-center text-xs leading-5 text-slate-500">
            Ask {firstName} to scan this with their phone camera or Google Lens, then pay with GPay, PhonePe, Paytm or any UPI app.
          </Text>

          <View className="mt-3 flex-row items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
            <Pulse>
              <View className="h-2 w-2 rounded-full bg-amber-500" />
            </Pulse>
            <Text className="text-[11px] font-bold text-amber-700">Waiting for payment...</Text>
          </View>

          <View className="mt-4 w-full flex-row gap-2">
            <Pressable
              accessibilityRole="link"
              onPress={() => openLink(`https://wa.me/91${job.client.phone}?text=${waText}`)}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 active:bg-emerald-700"
            >
              <MessageCircle size={14} color={colors.white} />
              <Text className="text-xs font-semibold text-white">Send on WhatsApp</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={copyLink}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 active:bg-slate-50"
            >
              <Copy size={14} color={colors.slate[700]} />
              <Text className="text-xs font-semibold text-slate-700">Copy link</Text>
            </Pressable>
          </View>

          <Text className="mt-3 text-center text-[10px] leading-4 text-slate-400">
            Payment goes securely to SnapNear. Your {partnerPct} ({formatINR(job.creatorPayout, { fixed: true })}) is added to your wallet instantly.
          </Text>
        </View>
      )}
    </Modal>
  );
}
