import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Clock, IndianRupee, LocateFixed, MapPin, Phone, Radio, User } from 'lucide-react-native';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DateInput from '../components/ui/DateInput';
import { Input, Select, Textarea } from '../components/ui/FormField';
import Gradient from '../components/ui/Gradient';
import { PageLoader } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import { FadeUp, Pulse } from '../components/ui/motion';
import DurationTiles from '../components/booking/DurationTiles';
import FareCard from '../components/booking/FareCard';
import LiveStatusCard from '../components/booking/LiveStatusCard';
import OccasionChips from '../components/booking/OccasionChips';
import ServicePicker from '../components/booking/ServicePicker';
import PaymentCelebration, { type Celebration } from '../components/payment/PaymentCelebration';
import TimeUpAlert from '../components/shoot/TimeUpAlert';
import { bookingApi } from '../api/services';
import { BOOKING_STATUS, MATCH_RADIUS_KM, type BookingStatus } from '../config/constants';
import { getCurrentPlace } from '../lib/location';
import { BOOKING_EVENTS, SOCKET_EVENTS } from '../config/events';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useScroll } from '../context/ScrollContext';
import { useSocketEvent } from '../context/SocketContext';
import useAsync from '../hooks/useAsync';
import useShootAlerts from '../hooks/useShootAlerts';
import { openRazorpayCheckout } from '../lib/checkout';
import { confirmAction } from '../lib/confirm';
import { playChime } from '../lib/sound';
import toast from '../lib/toast';
import type { ApiFailure, Booking, BookingForm, BookingUpdate } from '../types';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
import { isActive, isPaymentDue, isSearching } from '../utils/bookingStatus';
import { formatINR, formatMinutes, todayISO } from '../utils/format';
import { MESSAGES, isValidPhone } from '../utils/validators';

const EVENT_TOASTS: Record<string, (b: Booking) => string> = {
  [BOOKING_EVENTS.ACCEPTED]: (b) => `🎉 ${b.creator?.name || 'A photographer'} accepted your shoot!`,
  [BOOKING_EVENTS.ARRIVED]: (b) =>
    `📍 ${b.creator?.name || 'Your photographer'} has arrived!${b.startOtp ? ` Share OTP ${b.startOtp} to start your shoot.` : ''}`,
  [BOOKING_EVENTS.SHOOTING]: (b) => `📸 Your shoot has started! ${formatMinutes(b.durationMinutes || 60)} timer is running.`,
  [BOOKING_EVENTS.COMPLETED]: (b) => `✅ Shoot completed! Please pay ${formatINR(b.total)} to finish your booking.`,
  [BOOKING_EVENTS.CANCELLED]: () => 'Booking was cancelled',
};

const otpToastId = (bookingId: string) => `start-otp-${bookingId}`;

const LIVE_HEADLINE: Partial<Record<BookingStatus, string>> = {
  [BOOKING_STATUS.ASSIGNED]: 'on the way!',
  [BOOKING_STATUS.ARRIVED]: 'at your doorstep!',
  [BOOKING_STATUS.SHOOTING]: 'shooting now!',
};

function SectionTitle({ step, title, accent = 'text-slate-500' }: { step: number; title: string; accent?: string }) {
  return (
    <View className="mb-3">
      <Text className={`text-xs font-bold uppercase tracking-wider ${accent}`}>
        Step {step} • {title}
      </Text>
    </View>
  );
}

type FormErrors = Partial<Record<keyof BookingForm, string>>;

export default function BookScreen() {
  const { user } = useAuth();
  const { catalog } = useCatalog();
  const { scrollIntoView } = useScroll();
  const { width } = useWindowDimensions();
  const sm = width >= 640;
  const lg = width >= 1024;
  const statusRef = useRef<View>(null);
  const { data: bookings, setData: setBookings, loading, reload } = useAsync(() => bookingApi.mine().then((r) => r.bookings), []);

  const [form, setForm] = useState<BookingForm>({
    serviceType: 'photo',
    durationId: '1hr',
    occasion: 'Birthday Celebration',
    shootDate: todayISO(),
    timeSlot: catalog.timeSlots[0] || '',
    address: '',
    latitude: null,
    longitude: null,
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<(Celebration & { key: string }) | null>(null);
  const celebrated = useRef(new Set<string>());

  useEffect(() => {
    if (!form.timeSlot && catalog.timeSlots[0]) setForm((f) => ({ ...f, timeSlot: catalog.timeSlots[0] }));
  }, [catalog]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiers = catalog.tiers[form.serviceType] || [];
  const tier = tiers.find((t) => t.id === form.durationId) || tiers[0];
  const serviceLabel = form.serviceType === 'photo' ? 'Photos Only' : 'Video & Cinema';

  const list = useMemo(() => bookings || [], [bookings]);
  const activeBookings = useMemo(() => list.filter((b) => isActive(b.status)), [list]);
  const dueBooking = list.find(isPaymentDue) || null;
  const focused = list.find((b) => b.id === selectedId) || activeBookings[0] || dueBooking || null;

  // Wait a frame so a just-added or just-changed status card has its final layout
  const scrollToStatus = () => setTimeout(() => scrollIntoView(statusRef), 50);

  // The verify response and the socket event both report a payment; celebrate it once.
  const celebrate = (b: Booking) => {
    if (celebrated.current.has(b.id)) return;
    celebrated.current.add(b.id);
    setCelebration({
      key: b.id,
      role: 'customer',
      amount: b.total,
      code: b.code,
      counterpart: b.creator?.name,
      method: b.payment?.method,
      viewerName: user?.name,
    });
  };
  const closeCelebration = useCallback(() => setCelebration(null), []);
  const { alertBooking: timeUpBooking, dismiss: dismissTimeUp } = useShootAlerts(bookings, 'customer');
  const [refreshingOtpId, setRefreshingOtpId] = useState<string | null>(null);

  useSocketEvent<BookingUpdate>(SOCKET_EVENTS.BOOKING_UPDATE, async (payload) => {
    const fresh = await reload();
    const b = fresh?.find((x) => x.id === payload.bookingId);
    if (!b) return;

    if (payload.event === BOOKING_EVENTS.PAID) {
      celebrate(b);
      return;
    }
    if (payload.event === BOOKING_EVENTS.SHOOTING) toast.dismiss(otpToastId(b.id));
    const spotlight = ([BOOKING_EVENTS.ARRIVED, BOOKING_EVENTS.SHOOTING, BOOKING_EVENTS.COMPLETED] as string[]).includes(payload.event);
    if (spotlight) {
      setSelectedId(b.id);
      setTimeout(() => scrollIntoView(statusRef), 150);
    }
    const message = EVENT_TOASTS[payload.event]?.(b);
    if (message) {
      playChime(payload.event === BOOKING_EVENTS.ACCEPTED ? 'broadcast' : 'ping');
      const id = payload.event === BOOKING_EVENTS.ARRIVED ? otpToastId(b.id) : undefined;
      toast(message, { id, icon: null, duration: spotlight ? 7000 : 4000 });
    }
  });

  const replace = (updated: Booking) => setBookings((prev) => (prev || []).map((b) => (b.id === updated.id ? updated : b)));

  const refreshOtp = async (booking: Booking) => {
    setRefreshingOtpId(booking.id);
    try {
      const { booking: updated } = await bookingApi.newStartOtp(booking.id);
      replace(updated);
      toast.success(`New OTP: ${updated.startOtp}. Share it with your photographer.`, { id: otpToastId(updated.id) });
    } catch (err) {
      toast.error((err as ApiFailure).message);
      reload();
    } finally {
      setRefreshingOtpId(null);
    }
  };

  const pay = async (booking: Booking) => {
    setPayingId(booking.id);
    try {
      const { checkout } = await bookingApi.startPayment(booking.id);
      const result = await openRazorpayCheckout(checkout, { onFailed: (msg) => toast.error(msg) });
      if (!result) {
        toast('Payment not completed. You can pay anytime from here.', { icon: 'ℹ️' });
        return;
      }
      const { booking: paid } = await bookingApi.verifyPayment(booking.id, result);
      replace(paid);
      celebrate(paid);
    } catch (err) {
      toast.error((err as ApiFailure).message);
      // The payment may still have gone through (e.g. network drop); the list re-checks with Razorpay
      reload();
    } finally {
      setPayingId(null);
    }
  };

  const set = <K extends keyof BookingForm>(name: K, value: BookingForm[K]) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const detectLocation = async () => {
    setLocating(true);
    try {
      const place = await getCurrentPlace();
      setForm((f) => ({
        ...f,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      }));
      setErrors((e) => ({ ...e, address: undefined }));
      toast.success('Current location filled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    void detectLocation();
    // Auto-fill once when the book screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const next: FormErrors = {};
    if (form.latitude == null || form.longitude == null || form.address.trim().length < 8) {
      next.address = 'Allow current location — address fills automatically and stays locked';
    }
    if (form.contactName.trim().length < 2) next.contactName = 'Enter contact name';
    if (!isValidPhone(form.contactPhone)) next.contactPhone = MESSAGES.PHONE;
    if (!form.shootDate || form.shootDate < todayISO()) next.shootDate = 'Pick today or a future date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const broadcast = async () => {
    if (dueBooking) {
      toast.error(`Please pay ${formatINR(dueBooking.total)} for ${dueBooking.code} before booking a new shoot`);
      setSelectedId(dueBooking.id);
      scrollToStatus();
      return;
    }
    if (!validate()) {
      toast.error('Please complete the highlighted fields');
      return;
    }
    if (!tier) return;
    setSubmitting(true);
    try {
      const { booking } = await bookingApi.create({
        ...form,
        durationId: tier.id,
        latitude: form.latitude as number,
        longitude: form.longitude as number,
      });
      setBookings((prev) => [booking, ...(prev || [])]);
      setSelectedId(booking.id);
      playChime('broadcast');
      toast.success('Request sent to nearby photographers!');
      scrollToStatus();
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (booking: Booking) => {
    if (!(await confirmAction(`Cancel booking ${booking.code}?`))) return;
    setCancellingId(booking.id);
    try {
      const { booking: updated } = await bookingApi.cancel(booking.id);
      replace(updated);
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading || !user) return <PageLoader label="Loading Book a Shoot..." />;

  const live = activeBookings[0];
  const banner = `gap-3 overflow-hidden rounded-2xl p-4 ${sm ? 'flex-row items-center justify-between' : ''}`;

  return (
    <View className="w-full gap-6" style={{ width: '100%' }}>
      {celebration && <PaymentCelebration key={celebration.key} celebration={celebration} onClose={closeCelebration} />}
      {timeUpBooking && <TimeUpAlert key={timeUpBooking.id} booking={timeUpBooking} role="customer" onDismiss={dismissTimeUp} />}

      {dueBooking && (
        <FadeUp style={shadows.lg} className="rounded-2xl">
          <Gradient colors={[colors.brand.orange, colors.amber[500]]} className={banner}>
            <View className="min-w-0 shrink flex-row items-center gap-3">
              <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <IndianRupee size={20} color={colors.white} />
              </View>
              <View className="min-w-0 shrink">
                <Text className="font-display text-sm font-bold text-white">Payment pending: {formatINR(dueBooking.total)}</Text>
                <Text className="truncate text-xs text-orange-50">
                  {dueBooking.code} • {dueBooking.occasion}
                  {dueBooking.creator ? ` with ${dueBooking.creator.name}` : ''}
                </Text>
              </View>
            </View>
            <Pressable
              testID="banner-pay"
              accessibilityRole="button"
              onPress={() => pay(dueBooking)}
              disabled={payingId === dueBooking.id}
              className="shrink-0 items-center rounded-xl bg-white px-4 py-2.5 active:bg-orange-50 sm:py-2"
              style={payingId === dueBooking.id ? { opacity: 0.6 } : undefined}
            >
              <Text className="text-xs font-bold text-brand-orange">{payingId === dueBooking.id ? 'Opening...' : `Pay ${formatINR(dueBooking.total)}`}</Text>
            </Pressable>
          </Gradient>
        </FadeUp>
      )}

      {live && !isSearching(live.status) && (
        <FadeUp style={shadows.lg} className="rounded-2xl">
          <Gradient colors={[colors.emerald[600], colors.teal[700]]} className={banner}>
            <View className="min-w-0 shrink flex-row items-center gap-3">
              <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Pulse>
                  <Radio size={20} color={colors.emerald[200]} />
                </Pulse>
              </View>
              <View className="min-w-0 shrink">
                <Text className="font-display text-sm font-bold text-white">
                  {live.creator?.name} is {LIVE_HEADLINE[live.status]}
                </Text>
                {live.status === BOOKING_STATUS.ARRIVED && live.startOtp ? (
                  <Text className="truncate text-xs text-emerald-100">
                    Start OTP: <Text className="font-display text-sm font-bold tracking-[0.3em] text-white">{live.startOtp}</Text>
                  </Text>
                ) : (
                  <Text className="truncate text-xs text-emerald-100">{live.address}</Text>
                )}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelectedId(live.id);
                scrollToStatus();
              }}
              className="shrink-0 items-center rounded-xl bg-white px-3.5 py-2.5 active:bg-emerald-50 sm:py-2"
            >
              <Text className="text-xs font-bold text-emerald-800">View Live Status</Text>
            </Pressable>
          </Gradient>
        </FadeUp>
      )}

      <View>
        <Text role="heading" className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
          Hi {user.name.split(' ')[0]}, book a photographer 👋
        </Text>
        <Text className="text-sm text-slate-500">Verified photographers & videographers at your doorstep in minutes.</Text>
      </View>

      <View className={`gap-5 sm:gap-6 ${lg ? 'flex-row items-start' : ''}`}>
        <Card className="min-w-0 gap-6 p-4 sm:gap-7 sm:p-7" style={lg ? { flex: 7 } : undefined}>
          <View>
            <SectionTitle step={1} title="Service Type" accent="text-brand-orange" />
            <ServicePicker value={form.serviceType} onChange={(v) => set('serviceType', v)} />
          </View>

          <View>
            <SectionTitle step={2} title="Session Duration" />
            <DurationTiles tiers={tiers} value={tier?.id} onChange={(v) => set('durationId', v)} />
          </View>

          <View>
            <SectionTitle step={3} title="Shoot Occasion" />
            <OccasionChips occasions={catalog.occasions} value={form.occasion} onChange={(v) => set('occasion', v)} />
          </View>

          <View className="gap-3.5 border-t border-slate-100 pt-6">
            <SectionTitle step={4} title="Doorstep Address & Contact" />
            <View className={`gap-3.5 ${sm ? 'flex-row' : ''}`}>
              <Input
                className={sm ? 'flex-1' : ''}
                label="Contact name"
                name="contactName"
                icon={User}
                value={form.contactName}
                onChangeText={(v) => set('contactName', v)}
                error={errors.contactName}
              />
              <Input
                className={sm ? 'flex-1' : ''}
                label="WhatsApp / Phone"
                name="contactPhone"
                icon={Phone}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={10}
                value={form.contactPhone}
                onChangeText={(v) => set('contactPhone', v.replace(/\D/g, ''))}
                error={errors.contactPhone}
              />
            </View>
            <View className={`gap-3.5 ${sm ? 'flex-row' : ''}`}>
              <DateInput
                className={sm ? 'flex-1' : ''}
                label="Shoot date"
                name="shootDate"
                min={todayISO()}
                value={form.shootDate}
                onChange={(v) => set('shootDate', v)}
                error={errors.shootDate}
              />
              <Select
                className={sm ? 'flex-1' : ''}
                label="Preferred time slot"
                name="timeSlot"
                value={form.timeSlot}
                onChange={(v) => set('timeSlot', v)}
                options={catalog.timeSlots.map((s) => ({ value: s, label: s }))}
              />
            </View>
            <Input
              label="Current location (auto-filled)"
              name="address"
              icon={MapPin}
              placeholder="Detecting your current location…"
              value={form.address}
              editable={false}
              error={errors.address}
              hint="Locked from GPS — photographers within this area get your request"
              right={
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color={colors.emerald[600]} />
                  <Text className="text-[10px] font-semibold text-emerald-600">Within {MATCH_RADIUS_KM} km</Text>
                </View>
              }
            />
            {(!form.latitude || !form.address) && (
              <Button variant="dark" icon={LocateFixed} loading={locating} onPress={detectLocation} className="w-full">
                Use current location
              </Button>
            )}
            <Textarea
              label="Notes for photographer (optional)"
              name="notes"
              placeholder="e.g. Cake cutting at 7 PM, need 20 edited photos"
              maxLength={300}
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
            />
          </View>
        </Card>

        <View className="min-w-0 gap-4" style={lg ? { flex: 5 } : undefined}>
          <FareCard tier={tier} serviceLabel={serviceLabel} onBroadcast={broadcast} submitting={submitting} />
          <LiveStatusCard
            ref={statusRef}
            booking={focused}
            onCancel={cancel}
            cancelling={cancellingId === focused?.id}
            onPay={pay}
            paying={payingId === focused?.id}
            onRefreshOtp={refreshOtp}
            refreshingOtp={refreshingOtpId === focused?.id}
          />
        </View>
      </View>
    </View>
  );
}
