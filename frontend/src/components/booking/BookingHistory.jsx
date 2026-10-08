import { CalendarClock, MapPin } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { EmptyState } from '../ui/Card';
import { OCCASION_EMOJI } from '../../utils/bookingStatus';
import { formatDate, formatINR, timeAgo } from '../../utils/format';

export default function BookingHistory({ bookings, selectedId, onSelect }) {
  if (!bookings.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No bookings yet"
        description="Your shoots will appear here once you book your first photographer."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {bookings.map((b) => (
        <li key={b.id}>
          <button
            type="button"
            onClick={() => onSelect?.(b)}
            className={`flex w-full items-start gap-3 px-1 py-3 text-left transition hover:bg-slate-50 ${
              selectedId === b.id ? 'bg-orange-50/50' : ''
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
              {OCCASION_EMOJI[b.occasion] || '✨'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-slate-900">{b.occasion}</p>
                <span className="shrink-0 text-sm font-black text-slate-900">{formatINR(b.total)}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {b.code} &bull; {b.serviceLabel} ({b.durationLabel}) &bull; {formatDate(b.shootDate)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="flex min-w-0 flex-1 items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{b.creator ? `with ${b.creator.name}` : b.address}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] text-slate-400">{timeAgo(b.createdAt)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
