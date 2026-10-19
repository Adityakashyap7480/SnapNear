import { View } from 'react-native';
import { BadgeCheck, IndianRupee, Landmark, Wallet } from 'lucide-react-native';
import { StatCard } from '../components/ui/Card';
import Grid from '../components/ui/Grid';
import { PageLoader } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import WalletCard from '../components/partner/WalletCard';
import { bookingApi, creatorApi } from '../api/services';
import { PAYMENT_STATUS, ROLES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import useAsync from '../hooks/useAsync';
import type { Booking, CreatorDashboard } from '../types';
import { isCompleted } from '../utils/bookingStatus';
import { formatINR } from '../utils/format';

type CustomerWalletData = { kind: 'customer'; bookings: Booking[] };
type PartnerWalletData = { kind: 'partner'; dash: CreatorDashboard };
type WalletData = CustomerWalletData | PartnerWalletData;

export default function ProfileWalletScreen() {
  const { user } = useAuth();
  const { partnerPct, platformPct } = useCatalog();
  const isPartner = user?.role === ROLES.CREATOR;

  const { data, loading, error, reload } = useAsync<WalletData>(
    () =>
      isPartner
        ? creatorApi.dashboard().then((dash) => ({ kind: 'partner' as const, dash }))
        : bookingApi.mine().then((r) => ({ kind: 'customer' as const, bookings: r.bookings })),
    [isPartner]
  );

  if (loading) return <PageLoader label="Loading earnings..." />;
  if (error || !data) return <Text className="px-4 py-10 text-center text-sm text-red-600">{error || 'Unable to load'}</Text>;

  if (data.kind === 'partner') {
    const { stats, wallet } = data.dash;
    return (
      <View className="gap-5 px-4 py-5">
        <Text className="text-sm text-slate-500">
          Your SnapNear earnings and payouts. Add or change your UPI ID below — required before you can accept shoots.
        </Text>
        <Grid cols={2}>
          <StatCard
            tone="emerald"
            icon={Wallet}
            label="Today's Net Earnings"
            value={formatINR(stats.todayEarnings, { fixed: true })}
            hint={`${stats.todayCompleted} shoot(s) today • your ${partnerPct}`}
          />
          <StatCard icon={BadgeCheck} label="Completed Shoots" value={stats.completed} hint="Lifetime on SnapNear" />
          <StatCard
            tone="violet"
            icon={IndianRupee}
            label="Lifetime Earnings"
            value={formatINR(stats.lifetimeEarnings, { fixed: true })}
            hint={`Your ${partnerPct} payouts`}
          />
          <StatCard
            icon={Landmark}
            label="Platform Commission"
            value={formatINR(stats.platformFeePaid, { fixed: true })}
            hint={`${platformPct} tech fee contribution`}
          />
        </Grid>
        <WalletCard wallet={wallet} onChanged={reload} />
      </View>
    );
  }

  const bookings = data.bookings;
  const paid = bookings.filter((b) => b.payment?.status === PAYMENT_STATUS.PAID);
  const due = bookings.filter((b) => b.payment?.status === PAYMENT_STATUS.DUE);
  const paidTotal = paid.reduce((sum, b) => sum + (b.total || 0), 0);
  const dueTotal = due.reduce((sum, b) => sum + (b.total || 0), 0);
  const completed = bookings.filter((b) => isCompleted(b.status)).length;

  return (
    <View className="gap-5 px-4 py-5">
      <Text className="text-sm text-slate-500">Payments for your SnapNear shoots.</Text>
      <Grid cols={2}>
        <StatCard tone="emerald" icon={Wallet} label="Paid so far" value={formatINR(paidTotal, { fixed: true })} hint={`${paid.length} paid shoot(s)`} />
        <StatCard icon={BadgeCheck} label="Completed shoots" value={completed} hint="Lifetime on SnapNear" />
        <StatCard tone="violet" icon={IndianRupee} label="Awaiting payment" value={formatINR(dueTotal, { fixed: true })} hint={`${due.length} unpaid`} />
        <StatCard icon={Landmark} label="Total booked" value={formatINR(paidTotal + dueTotal, { fixed: true })} hint={`${bookings.length} booking(s)`} />
      </Grid>
    </View>
  );
}
