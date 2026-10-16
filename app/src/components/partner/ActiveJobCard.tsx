import type { ReactNode } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Check, MessageCircle, Navigation, PhoneCall, type LucideIcon } from 'lucide-react-native';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import Text from '../ui/Text';
import { Pulse } from '../ui/motion';
import ShootTimer from '../shoot/ShootTimer';
import StartShootForm from '../shoot/StartShootForm';
import { BOOKING_STATUS } from '../../config/constants';
import { openLink } from '../../lib/links';
import type { Booking } from '../../types';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { CREATOR_NEXT_ACTION, STATUS_META } from '../../utils/bookingStatus';
import { formatDate, formatINR, maskPhone } from '../../utils/format';

const STEPS = [
  { key: BOOKING_STATUS.ASSIGNED, label: 'Heading to customer' },
  { key: BOOKING_STATUS.ARRIVED, label: 'Reached venue' },
  { key: BOOKING_STATUS.SHOOTING, label: 'Shoot started' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
];

interface ActiveJobCardProps {
  job: Booking;
  onAdvance: (job: Booking) => void;
  onStartShoot: (job: Booking, otp: string) => Promise<unknown>;
  busy: boolean;
}

function Detail({ label, children, full = false, wide }: { label: string; children: ReactNode; full?: boolean; wide: boolean }) {
  return (
    <View style={{ width: wide && !full ? '48%' : '100%' }}>
      <Text className="text-xs text-slate-300">
        <Text className="text-xs font-bold text-white">{label}</Text> {children}
      </Text>
    </View>
  );
}

function LinkButton({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 active:bg-slate-700">
      <Icon size={14} color={colors.slate[200]} />
      <Text className="text-[11px] font-semibold text-slate-200">{label}</Text>
    </Pressable>
  );
}

export default function ActiveJobCard({ job, onAdvance, onStartShoot, busy }: ActiveJobCardProps) {
  const { width } = useWindowDimensions();
  const sm = width >= 640;
  const action = CREATOR_NEXT_ACTION[job.status];
  const currentIdx = STEPS.findIndex((s) => s.key === job.status);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
  const waText = encodeURIComponent(`Hi ${job.client.name}, this is your SnapNear photographer for ${job.code}. I'm on my way!`);

  return (
    <View testID="active-job" className="gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6" style={shadows.xl}>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Pulse>
            <View className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </Pulse>
          <Text className="font-display text-sm font-bold text-white">Active Assignment • {job.code}</Text>
        </View>
        <View className="rounded-lg border border-emerald-800 bg-emerald-950 px-2.5 py-1">
          <Text className="text-xs font-bold text-emerald-400">{STATUS_META[job.status]?.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-1.5">
        {STEPS.map((s, i) => (
          <View key={s.key} className="flex-1">
            {i <= currentIdx ? (
              <Gradient colors={[colors.brand.orange, colors.emerald[400]]} className="h-1.5 rounded-full" />
            ) : (
              <View className="h-1.5 rounded-full bg-slate-700" />
            )}
            <Text className={`mt-1.5 text-[9px] font-semibold leading-tight sm:text-[10px] ${i <= currentIdx ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</Text>
          </View>
        ))}
      </View>

      {job.status === BOOKING_STATUS.ARRIVED && <StartShootForm job={job} onStart={onStartShoot} />}
      {job.status === BOOKING_STATUS.SHOOTING && job.endsAt && <ShootTimer booking={job} tone="dark" />}

      <View className="flex-row flex-wrap justify-between gap-y-3">
        <Detail label="Customer:" wide={sm}>
          {job.client.name} ({maskPhone(job.client.phone)})
        </Detail>
        <Detail label="Shoot:" wide={sm}>
          {job.serviceLabel} • {job.durationLabel} • {job.occasion}
        </Detail>
        <Detail label="Location:" wide={sm} full>
          {job.address}
        </Detail>
        <Detail label="When:" wide={sm}>
          {formatDate(job.shootDate)} • {job.timeSlot}
        </Detail>
        <Detail label="Earnings locked:" wide={sm}>
          <Text className="text-xs font-bold text-emerald-400">{formatINR(job.creatorPayout, { fixed: true })}</Text>
        </Detail>
        {job.notes ? (
          <Detail label="Notes:" wide={sm} full>
            {job.notes}
          </Detail>
        ) : null}
      </View>

      <View className={`gap-2 border-t border-slate-800 pt-4 ${sm ? 'flex-row' : ''}`}>
        <View className="flex-1 flex-row gap-2">
          <LinkButton icon={Navigation} label="Navigate" onPress={() => openLink(mapsUrl)} />
          <LinkButton icon={PhoneCall} label="Call" onPress={() => openLink(`tel:+91${job.client.phone}`)} />
          <LinkButton icon={MessageCircle} label="WhatsApp" onPress={() => openLink(`https://wa.me/91${job.client.phone}?text=${waText}`)} />
        </View>
        {action && (
          <Button testID="advance-job" variant="success" onPress={() => onAdvance(job)} loading={busy} icon={Check} className={sm ? 'min-w-[180px]' : ''}>
            {action.label}
          </Button>
        )}
      </View>
    </View>
  );
}
