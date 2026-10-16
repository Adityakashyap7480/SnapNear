import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { BadgeCheck, Camera, CheckCheck, History, IndianRupee, Landmark, Locate, Power, Radar, Star, Wallet } from 'lucide-react-native';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Card, { EmptyState, StatCard } from '../components/ui/Card';
import Grid from '../components/ui/Grid';
import { PageLoader } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import { Ripple } from '../components/ui/motion';
import ActiveJobCard from '../components/partner/ActiveJobCard';
import CollectPaymentCard from '../components/partner/CollectPaymentCard';
import JobHistory from '../components/partner/JobHistory';
import PartnerTermsModal from '../components/partner/PartnerTermsModal';
import PaymentQrModal from '../components/partner/PaymentQrModal';
import RequestCard from '../components/partner/RequestCard';
import WalletCard from '../components/partner/WalletCard';
import PaymentCelebration, { type Celebration } from '../components/payment/PaymentCelebration';
import TimeUpAlert from '../components/shoot/TimeUpAlert';
import { creatorApi } from '../api/services';
import { BOOKING_STATUS } from '../config/constants';
import { BOOKING_EVENTS, SOCKET_EVENTS } from '../config/events';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useScroll } from '../context/ScrollContext';
import { useSocketEvent } from '../context/SocketContext';
import useAsync from '../hooks/useAsync';
import useShootAlerts from '../hooks/useShootAlerts';
import { confirmAction } from '../lib/confirm';
import { playChime, vibrate } from '../lib/sound';
import toast from '../lib/toast';
import type { ApiFailure, Booking, BookingUpdate, FeedUpdate, WalletPayoutEvent } from '../types';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
import { CREATOR_NEXT_ACTION, isCompleted } from '../utils/bookingStatus';
import { formatClock, formatINR, formatMinutes } from '../utils/format';
import { serverNow } from '../utils/serverClock';

export default function PartnerScreen() {
  const { user } = useAuth();
  const { partnerPct, platformPct } = useCatalog();
  const { scrollToTop } = useScroll();
  const { width } = useWindowDimensions();
  const md = width >= 768;
  const { data, setData, loading, error, reload } = useAsync(() => creatorApi.dashboard(), []);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const busyLock = useRef<string | null>(null);
  const [qrJob, setQrJob] = useState<Booking | null>(null);
  const [celebration, setCelebration] = useState<(Celebration & { key: string }) | null>(null);
  const celebrated = useRef(new Set<string>());

  // The QR poll and the socket event can both report the same payment; celebrate it once.
  const celebratePayment = useCallback(
    (booking: Booking) => {
      setQrJob((current) => (current?.id === booking.id ? null : current));
      if (celebrated.current.has(booking.id)) return;
      celebrated.current.add(booking.id);
      setCelebration({
        key: booking.id,
        role: 'partner',
        amount: booking.total,
        credited: booking.creatorPayout,
        code: booking.code,
        counterpart: booking.client?.name,
        method: booking.payment?.method,
        holdDays: data?.wallet?.holdDays,
      });
      reload();
    },
    [data?.wallet?.holdDays, reload]
  );
  const closeQr = useCallback(() => setQrJob(null), []);
  const closeCelebration = useCallback(() => setCelebration(null), []);

  const activeJobs = useMemo(() => (data?.activeJob ? [data.activeJob] : []), [data?.activeJob]);
  const { alertBooking: timeUpJob, dismiss: dismissTimeUp } = useShootAlerts(activeJobs, 'partner');

  useSocketEvent<FeedUpdate>(SOCKET_EVENTS.FEED_UPDATE, async (payload) => {
    const fresh = await reload();
    if (payload.event !== BOOKING_EVENTS.CREATED || !fresh?.profile.creatorProfile.isOnline) return;
    const isForMe = fresh.requests.some((r) => r.id === payload.bookingId);
    if (isForMe) {
      playChime('broadcast');
      toast(`🔔 New shoot request: ${payload.occasion} for ${formatINR(payload.creatorPayout)}`, { duration: 6000 });
    }
  });

  useSocketEvent<BookingUpdate>(SOCKET_EVENTS.BOOKING_UPDATE, async (payload) => {
    const fresh = await reload();
    if (payload.event === BOOKING_EVENTS.CANCELLED) {
      playChime('ping');
      toast.error(`Booking ${payload.code} was cancelled`);
    }
    if (payload.event === BOOKING_EVENTS.PAID) {
      const job = fresh?.history.find((h) => h.id === payload.bookingId);
      if (job) celebratePayment(job);
    }
  });

  useSocketEvent<WalletPayoutEvent>(SOCKET_EVENTS.WALLET_PAYOUT, async (payload) => {
    await reload();
    playChime('success');
    toast.success(`💸 SnapNear sent ${formatINR(payload.amount, { fixed: true })} to your UPI for ${payload.bookingCount} shoot(s)!`, {
      duration: 8000,
    });
  });

  if (loading) return <PageLoader label="Loading SnapNear Partner..." />;
  if (error || !data) return <Text className="py-20 text-center text-sm text-red-600">{error}</Text>;

  const { profile, requests, activeJob, awaitingPayment, history, stats, wallet } = data;
  const cp = profile.creatorProfile;
  const online = cp.isOnline;

  const toggleDuty = async () => {
    setTogglingDuty(true);
    try {
      await creatorApi.setDuty(!online);
      await reload();
      toast.success(online ? 'You are offline. No new pings.' : "You're online! Nearby requests will ping you.");
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setTogglingDuty(false);
    }
  };

  const accept = async (req: Booking) => {
    // Ref lock so the first tap always wins (React busy state updates one frame later).
    if (busyLock.current) return;
    busyLock.current = req.id;
    setBusyId(req.id);
    try {
      await creatorApi.accept(req.id);
      playChime('ping');
      toast.success(`Shoot accepted! Head to ${req.client.name}'s location.`);
      await reload();
      scrollToTop();
    } catch (err) {
      toast.error((err as ApiFailure).message);
      reload();
    } finally {
      busyLock.current = null;
      setBusyId(null);
    }
  };

  const decline = async (req: Booking) => {
    if (busyLock.current) return;
    setData((d) => (d ? { ...d, requests: d.requests.filter((r) => r.id !== req.id) } : d));
    try {
      await creatorApi.decline(req.id);
    } catch {
      reload();
    }
  };

  const advance = async (job: Booking, { confirmEarly = true } = {}) => {
    const left = job.status === BOOKING_STATUS.SHOOTING && job.endsAt ? new Date(job.endsAt).getTime() - serverNow() : 0;
    if (confirmEarly && left > 60 * 1000 && !(await confirmAction(`${formatClock(left)} of booked time is still left. Mark the shoot completed now?`))) {
      return;
    }
    setBusyId(job.id);
    try {
      const { booking } = await creatorApi.advance(job.id);
      playChime('ping');
      if (isCompleted(booking.status)) {
        toast.success(`Shoot completed! Collect ${formatINR(booking.total)} from the customer via SnapNear.`, { duration: 6000 });
      } else if (booking.status === BOOKING_STATUS.ARRIVED) {
        toast.success(`You've arrived! Ask ${booking.client?.name?.split(' ')[0] || 'the customer'} for the start OTP.`, { duration: 6000 });
      } else {
        toast.success(`Status updated: ${CREATOR_NEXT_ACTION[job.status]?.label}`);
      }
      await reload();
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setBusyId(null);
    }
  };

  // Errors are shown inside the OTP form, so they propagate to it.
  const startShoot = async (job: Booking, otp: string) => {
    const { booking } = await creatorApi.startShoot(job.id, otp);
    playChime('success');
    vibrate([80, 40, 80]);
    toast.success(`OTP verified! ${formatMinutes(booking.durationMinutes || 60)} shoot timer started.`, { duration: 6000 });
    await reload();
  };

  const completeAfterTimeUp = async (job: Booking) => {
    dismissTimeUp();
    await advance(job, { confirmEarly: false });
  };

  return (
    <View className="gap-6">
      {user?.needsPartnerTerms && <PartnerTermsModal />}
      {celebration && <PaymentCelebration key={celebration.key} celebration={celebration} onClose={closeCelebration} />}
      {qrJob && <PaymentQrModal key={qrJob.id} job={qrJob} onClose={closeQr} onPaid={celebratePayment} />}
      {timeUpJob && (
        <TimeUpAlert
          key={timeUpJob.id}
          booking={timeUpJob}
          role="partner"
          onDismiss={dismissTimeUp}
          onComplete={completeAfterTimeUp}
          completing={busyId === timeUpJob.id}
        />
      )}

      <Card className={`justify-between gap-4 p-4 sm:p-5 ${md ? 'flex-row items-center' : ''}`}>
        <View className="min-w-0 shrink flex-row items-center gap-3.5">
          <Avatar name={profile.name} size="lg" ring={colors.brand.violet} />
          <View className="min-w-0 shrink">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-display text-lg font-bold text-slate-900">{profile.name}</Text>
              {cp.isVerified && (
                <Badge tone="emerald" icon={CheckCheck}>
                  Verified Partner
                </Badge>
              )}
            </View>
            <View className="mt-1 flex-row flex-wrap items-center gap-2.5">
              <View className="rounded bg-indigo-50 px-2 py-0.5">
                <Text className="text-xs font-bold text-brand-violet">
                  {cp.experienceYears}+ Years • {cp.services.map((s) => (s === 'photo' ? 'Photography' : 'Videography')).join(' & ')}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={14} color={colors.amber[500]} fill={colors.amber[500]} />
                <Text className="text-xs font-semibold text-amber-600">
                  {cp.rating.toFixed(1)} ({stats.completed} shoots)
                </Text>
              </View>
            </View>
            {cp.gear ? (
              <View className="mt-1 flex-row items-center gap-1">
                <Camera size={12} color={colors.slate[400]} />
                <Text className="shrink text-[11px] text-slate-400">{cp.gear}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className={`flex-row items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-2.5 ${md ? 'justify-start' : 'justify-between'}`}>
          <View>
            <Text className="text-[11px] font-semibold text-slate-500">Duty Status</Text>
            {online ? (
              <View className="flex-row items-center gap-1.5">
                <View className="h-2 w-2">
                  <Ripple variant="ping" className="absolute inset-0 rounded-full bg-emerald-400" />
                  <View className="h-2 w-2 rounded-full bg-emerald-500" />
                </View>
                <Text className="text-xs font-bold text-emerald-600">Online & Ready</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full bg-slate-400" />
                <Text className="text-xs font-bold text-slate-400">Offline</Text>
              </View>
            )}
          </View>
          <Pressable
            testID="duty-toggle"
            accessibilityRole="button"
            onPress={toggleDuty}
            disabled={togglingDuty}
            className={`shrink-0 flex-row items-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 ${online ? 'bg-slate-800 active:bg-slate-700' : 'bg-emerald-600 active:bg-emerald-700'}`}
            style={[online ? null : shadows.emerald, togglingDuty ? { opacity: 0.6 } : null]}
          >
            <Power size={14} color={colors.white} />
            <Text className="text-xs font-bold text-white">{online ? 'Go Offline' : 'Go Online'}</Text>
          </Pressable>
        </View>
      </Card>

      <Grid cols={width >= 1024 ? 4 : 2}>
        <StatCard
          tone="emerald"
          icon={Wallet}
          label="Today's Net Earnings"
          value={formatINR(stats.todayEarnings, { fixed: true })}
          hint={`${stats.todayCompleted} shoot(s) today • your ${partnerPct}`}
        />
        <StatCard icon={BadgeCheck} label="Completed Shoots" value={stats.completed} hint="Lifetime on SnapNear" />
        <StatCard tone="violet" icon={IndianRupee} label="Lifetime Earnings" value={formatINR(stats.lifetimeEarnings, { fixed: true })} hint={`Your ${partnerPct} payouts`} />
        <StatCard icon={Landmark} label="Platform Commission" value={formatINR(stats.platformFeePaid, { fixed: true })} hint={`${platformPct} tech fee contribution`} />
      </Grid>

      {awaitingPayment.length > 0 && <CollectPaymentCard jobs={awaitingPayment} onShowQr={setQrJob} />}

      {activeJob && <ActiveJobCard job={activeJob} onAdvance={advance} onStartShoot={startShoot} busy={busyId === activeJob.id} />}

      <View className="gap-4">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="font-display text-base font-bold text-slate-900">Nearby Shoot Requests</Text>
            {online && requests.length > 0 && (
              <Badge tone="brand" size="md">
                {requests.length} New
              </Badge>
            )}
          </View>
          <View className="flex-row items-center gap-1">
            <Locate size={14} color={colors.brand.orange} />
            <Text className="text-xs text-slate-500">Live matching</Text>
          </View>
        </View>

        {!online ? (
          <Card>
            <EmptyState
              icon={Power}
              title="You're offline"
              description="Go online to start receiving shoot requests from customers near you."
              action={
                <Pressable accessibilityRole="button" onPress={toggleDuty} className="rounded-xl bg-emerald-600 px-4 py-2 active:bg-emerald-700">
                  <Text className="text-xs font-bold text-white">Go Online</Text>
                </Pressable>
              }
            />
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <EmptyState
              icon={Radar}
              title="No pending requests right now"
              description="Stay online! New booking requests from nearby customers will pop up here with an audio ping."
            />
          </Card>
        ) : (
          <View className="gap-4">
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onAccept={accept}
                onDecline={decline}
                busy={busyId === r.id}
                disabledReason={activeJob ? 'Finish your current shoot first' : undefined}
              />
            ))}
          </View>
        )}
      </View>

      <WalletCard wallet={wallet} onChanged={reload} />

      <Card className="p-4 sm:p-6">
        <View className="mb-3 flex-row items-center gap-2">
          <History size={16} color={colors.slate[400]} />
          <Text className="font-display text-base font-bold text-slate-900">Recent Jobs</Text>
        </View>
        <JobHistory history={history} />
      </Card>
    </View>
  );
}
