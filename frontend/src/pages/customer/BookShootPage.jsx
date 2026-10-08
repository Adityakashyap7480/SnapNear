import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Phone, Radio, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { Input, Select, Textarea } from '../../components/ui/FormField';
import { PageLoader } from '../../components/ui/Spinner';
import ServicePicker from '../../components/booking/ServicePicker';
import DurationTiles from '../../components/booking/DurationTiles';
import OccasionChips from '../../components/booking/OccasionChips';
import FareCard from '../../components/booking/FareCard';
import LiveStatusCard from '../../components/booking/LiveStatusCard';
import BookingHistory from '../../components/booking/BookingHistory';
import { bookingApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../context/SocketContext';
import useCatalog from '../../hooks/useCatalog';
import useAsync from '../../hooks/useAsync';
import { isActive } from '../../utils/bookingStatus';
import { todayISO } from '../../utils/format';
import { playChime } from '../../utils/sound';

const EVENT_TOASTS = {
  'booking:accepted': (b) => `🎉 ${b.creator?.name || 'A photographer'} accepted your shoot!`,
  'booking:arrived': (b) => `📍 ${b.creator?.name || 'Your photographer'} has arrived at your doorstep`,
  'booking:shooting': () => '📸 Your shoot has started',
  'booking:completed': () => '✅ Shoot completed! Hope you loved it.',
  'booking:cancelled': () => 'Booking was cancelled',
};

function SectionTitle({ step, title, accent = 'text-slate-500' }) {
  return (
    <div className="mb-3">
      <span className={`text-xs font-bold tracking-wider uppercase ${accent}`}>
        Step {step} &bull; {title}
      </span>
    </div>
  );
}

export default function BookShootPage() {
  const { user } = useAuth();
  const { catalog, loading: catalogLoading, error: catalogError } = useCatalog();
  const { data: bookings, setData: setBookings, loading, reload } = useAsync(
    () => bookingApi.mine().then((r) => r.bookings),
    []
  );

  const [form, setForm] = useState({
    serviceType: 'photo',
    durationId: '1hr',
    occasion: 'Birthday Celebration',
    shootDate: todayISO(),
    timeSlot: '',
    address: '',
    contactName: user.name,
    contactPhone: user.phone,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (catalog && !form.timeSlot) setForm((f) => ({ ...f, timeSlot: catalog.timeSlots[0] }));
  }, [catalog]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiers = catalog?.tiers[form.serviceType] || [];
  const tier = tiers.find((t) => t.id === form.durationId) || tiers[0];
  const serviceLabel = form.serviceType === 'photo' ? 'Photos Only' : 'Video & Cinema';

  const list = bookings || [];
  const activeBookings = useMemo(() => list.filter((b) => isActive(b.status)), [list]);
  const focused = list.find((b) => b.id === selectedId) || activeBookings[0] || null;

  useSocketEvent('booking:update', async (payload) => {
    const fresh = await reload();
    const b = fresh?.find((x) => x.id === payload.bookingId);
    const message = b && EVENT_TOASTS[payload.event]?.(b);
    if (message && payload.event !== 'booking:created') {
      playChime(payload.event === 'booking:accepted' ? 'broadcast' : 'ping');
      toast(message, { icon: null });
    }
  });

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.address.trim().length < 8) next.address = 'Enter your full doorstep address (tower, flat, society)';
    if (form.contactName.trim().length < 2) next.contactName = 'Enter contact name';
    if (!/^[6-9]\d{9}$/.test(form.contactPhone)) next.contactPhone = 'Enter a valid 10-digit mobile number';
    if (!form.shootDate || form.shootDate < todayISO()) next.shootDate = 'Pick today or a future date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const scrollToStatus = () =>
    document.getElementById('booking-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const broadcast = async () => {
    if (!validate()) {
      toast.error('Please complete the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      const { booking } = await bookingApi.create({ ...form, durationId: tier.id });
      setBookings((prev) => [booking, ...(prev || [])]);
      setSelectedId(booking.id);
      playChime('broadcast');
      toast.success('Request sent to nearby photographers!');
      scrollToStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.code}?`)) return;
    setCancellingId(booking.id);
    try {
      const { booking: updated } = await bookingApi.cancel(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (catalogLoading || loading) return <PageLoader label="Loading Book a Shoot..." />;
  if (catalogError) return <p className="py-20 text-center text-sm text-red-600">{catalogError}</p>;

  const live = activeBookings[0];

  return (
    <div className="space-y-6">
      {live && live.status !== 'searching' && (
        <div className="flex animate-fade-up flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Radio className="h-5 w-5 animate-pulse text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display text-sm font-bold">
                {live.creator?.name} is{' '}
                {live.status === 'assigned' ? 'on the way!' : live.status === 'arrived' ? 'at your doorstep!' : 'shooting now!'}
              </h4>
              <p className="truncate text-xs text-emerald-100">{live.address}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(live.id);
              scrollToStatus();
            }}
            className="shrink-0 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:py-2"
          >
            View Live Status
          </button>
        </div>
      )}

      <div>
        <h1 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
          Hi {user.name.split(' ')[0]}, book a photographer 👋
        </h1>
        <p className="text-sm text-slate-500">Verified photographers & videographers at your doorstep in minutes.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-12">
        <Card className="min-w-0 space-y-6 p-4 sm:space-y-7 sm:p-7 lg:col-span-7">
          <section>
            <SectionTitle step={1} title="Service Type" accent="text-brand-orange" />
            <ServicePicker value={form.serviceType} onChange={(v) => set('serviceType', v)} />
          </section>

          <section>
            <SectionTitle step={2} title="Session Duration" />
            <DurationTiles tiers={tiers} value={tier?.id} onChange={(v) => set('durationId', v)} />
          </section>

          <section>
            <SectionTitle step={3} title="Shoot Occasion" />
            <OccasionChips occasions={catalog.occasions} value={form.occasion} onChange={(v) => set('occasion', v)} />
          </section>

          <section className="space-y-3.5 border-t border-slate-100 pt-6">
            <SectionTitle step={4} title="Doorstep Address & Contact" />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Input label="Contact name" name="contactName" icon={User} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} error={errors.contactName} />
              <Input
                label="WhatsApp / Phone"
                name="contactPhone"
                icon={Phone}
                inputMode="numeric"
                maxLength={10}
                value={form.contactPhone}
                onChange={(e) => set('contactPhone', e.target.value.replace(/\D/g, ''))}
                error={errors.contactPhone}
              />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Input label="Shoot date" name="shootDate" type="date" icon={Calendar} min={todayISO()} value={form.shootDate} onChange={(e) => set('shootDate', e.target.value)} error={errors.shootDate} />
              <Select label="Preferred time slot" name="timeSlot" value={form.timeSlot} onChange={(e) => set('timeSlot', e.target.value)}>
                {catalog.timeSlots.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <Input
              label="Doorstep location / Society address"
              name="address"
              icon={MapPin}
              placeholder="Tower 4 - Flat 802, Gaur City 2, Greater Noida West"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              error={errors.address}
              right={
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <Clock className="h-3 w-3" /> Photographers within 5 km
                </span>
              }
            />
            <Textarea
              label="Notes for photographer (optional)"
              name="notes"
              placeholder="e.g. Cake cutting at 7 PM, need 20 edited photos"
              maxLength={300}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </section>
        </Card>

        <div className="min-w-0 space-y-4 lg:col-span-5">
          <FareCard tier={tier} serviceLabel={serviceLabel} onBroadcast={broadcast} submitting={submitting} />
          <LiveStatusCard booking={focused} onCancel={cancel} cancelling={cancellingId === focused?.id} />
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">My Bookings</h3>
            <p className="text-xs text-slate-500">Tap a booking to see its live status above.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{list.length} total</span>
        </div>
        <BookingHistory
          bookings={list}
          selectedId={focused?.id}
          onSelect={(b) => {
            setSelectedId(b.id);
            scrollToStatus();
          }}
        />
      </Card>
    </div>
  );
}
