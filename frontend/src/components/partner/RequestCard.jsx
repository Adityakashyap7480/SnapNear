import { Calendar, Check, MapPin, StickyNote, Timer, X } from 'lucide-react';
import Button from '../ui/Button';
import { OCCASION_EMOJI } from '../../utils/bookingStatus';
import { formatDate, formatINR, timeAgo } from '../../utils/format';

export default function RequestCard({ request, onAccept, onDecline, busy, disabledReason }) {
  const isVideo = request.serviceType === 'video';

  return (
    <div className="relative animate-fade-up overflow-hidden rounded-2xl border-2 border-brand-orange/40 bg-gradient-to-br from-white to-orange-50/40 p-4 shadow-lg sm:p-5">
      <div className="absolute top-0 right-0 flex items-center gap-1 rounded-bl-xl bg-brand-orange px-3 py-1 text-[11px] font-bold text-white">
        <Timer className="h-3 w-3" /> {timeAgo(request.createdAt)}
      </div>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:mt-2 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 pr-20 sm:pr-0">
            <span
              className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                isVideo ? 'bg-indigo-100 text-brand-violet' : 'bg-orange-100 text-brand-orange'
              }`}
            >
              {request.serviceLabel} &bull; {request.durationLabel}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">{request.code}</span>
          </div>

          <h4 className="font-display text-base font-bold text-slate-900 sm:text-lg">
            {OCCASION_EMOJI[request.occasion] || '✨'} {request.occasion}
          </h4>

          <p className="mt-1 flex items-start gap-1 text-xs text-slate-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {request.address}
          </p>
          <p className="mt-1 flex items-start gap-1 text-xs text-slate-600">
            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            {formatDate(request.shootDate)} &bull; {request.timeSlot}
          </p>
          {request.notes && (
            <p className="mt-1 flex items-start gap-1 text-xs text-slate-500 italic">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {request.notes}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Customer: <span className="font-semibold text-slate-800">{request.client.name}</span>
            <span className="text-slate-400"> &bull; contact shared after you accept</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4 md:flex-col md:items-stretch">
          <div className="text-left md:text-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Your take-home (80%)</span>
            <p className="font-display text-2xl font-black text-emerald-600">{formatINR(request.creatorPayout, { fixed: true })}</p>
            <span className="text-[10px] text-slate-400">(Customer pays: {formatINR(request.total)})</span>
          </div>
          <div className="flex gap-2 sm:min-w-[220px]">
            <Button variant="outline" size="sm" className="py-2.5 sm:py-1.5" onClick={() => onDecline(request)} disabled={busy} title="Skip this request">
              <X className="h-3.5 w-3.5" /> Skip
            </Button>
            <Button
              variant="success"
              size="sm"
              className="flex-1 py-2.5 sm:py-1.5"
              onClick={() => onAccept(request)}
              loading={busy}
              disabled={Boolean(disabledReason)}
              title={disabledReason || 'Accept this shoot'}
            >
              {!busy && <Check className="h-4 w-4" />} Accept Shoot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
