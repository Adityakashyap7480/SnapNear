import { BellRing, Camera, MapPinned, MessageCircle, PhoneCall, Radar, Star, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { STATUS_META } from '../../utils/bookingStatus';
import { formatDate, formatINR } from '../../utils/format';

const STEP_TEXT = {
  assigned: { label: 'Photographer is heading to your location', eta: 'ETA ~15 mins' },
  arrived: { label: 'Photographer arrived at your doorstep', eta: 'Setting up gear' },
  shooting: { label: 'Session in progress 📸', eta: 'Live shoot active' },
  completed: { label: 'Shoot completed & raw preview shared 🎉', eta: 'Done' },
};

export default function LiveStatusCard({ booking, onCancel, cancelling }) {
  if (!booking) {
    return (
      <div id="booking-status" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900">Current Shoot Status</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">Ready to Book</span>
        </div>
        <div className="py-6 text-center text-xs text-slate-400">
          <MapPinned className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          Fill in your shoot details and we&apos;ll find a nearby photographer instantly.
        </div>
      </div>
    );
  }

  const { status, creator } = booking;
  const step = STEP_TEXT[status];
  const canCancel = status === 'searching' || status === 'assigned';
  const waPhone = creator?.phone ? `91${creator.phone}` : '';
  const waText = encodeURIComponent(
    `Hi ${creator?.name?.split(' ')[0] || ''}, I booked you on SnapNear (${booking.code}). Can you confirm your arrival time?`
  );

  return (
    <div id="booking-status" className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold text-slate-900">Current Shoot Status</h3>
          <p className="text-[11px] text-slate-500">
            {booking.code} &bull; {booking.serviceLabel} ({booking.durationLabel}) &bull; {formatINR(booking.total)}
          </p>
        </div>
        <StatusBadge status={status} long pulse={status === 'searching'} />
      </div>

      {status === 'searching' && (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-radar rounded-full bg-brand-orange/20" />
            <div className="absolute inset-0 animate-radar rounded-full bg-brand-orange/20 [animation-delay:1s]" />
            <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white shadow-md">
              <Radar className="h-6 w-6 animate-spin [animation-duration:3s]" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-800">Finding nearby photographers...</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{booking.address}</p>
          <div className="mt-3 flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] text-brand-violet">
            <BellRing className="h-3.5 w-3.5" />
            <span>You&apos;ll be notified the moment a photographer accepts.</span>
          </div>
        </div>
      )}

      {creator && status !== 'cancelled' && (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <Avatar name={creator.name} size="lg" ring="ring-2 ring-emerald-500 ring-offset-2" />
            <div className="min-w-0 flex-grow">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-bold text-slate-900">{creator.name}</h4>
                <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {(creator.rating ?? 5).toFixed(1)}
                </span>
              </div>
              {creator.experienceYears !== undefined && (
                <span className="mt-1 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                  {creator.experienceYears}+ Years Experience
                </span>
              )}
              {creator.gear && (
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-600">
                  <Camera className="h-3 w-3 shrink-0 text-slate-400" /> {creator.gear}
                </p>
              )}
            </div>
          </div>

          {step && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap justify-between gap-x-2 text-[11px] font-semibold text-slate-700">
                <span>{step.label}</span>
                <span className="text-emerald-600">{step.eta}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-brand-orange to-emerald-500 transition-all duration-700"
                  style={{ width: `${STATUS_META[status].progress}%` }}
                />
              </div>
            </div>
          )}

          {status !== 'completed' && creator.phone && (
            <div className="flex gap-2">
              <a
                href={`tel:+91${creator.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" /> Call Photographer
              </a>
              <a
                href={`https://wa.me/${waPhone}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span>
          {formatDate(booking.shootDate)} &bull; {booking.timeSlot}
        </span>
        {canCancel && (
          <Button variant="danger" size="sm" onClick={() => onCancel(booking)} loading={cancelling}>
            {!cancelling && <X className="h-3 w-3" />} Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
