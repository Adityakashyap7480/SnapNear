import { Check, MessageCircle, Navigation, PhoneCall } from 'lucide-react';
import Button from '../ui/Button';
import { CREATOR_NEXT_ACTION, STATUS_META } from '../../utils/bookingStatus';
import { formatDate, formatINR, maskPhone } from '../../utils/format';

const STEPS = [
  { key: 'assigned', label: 'Heading to customer' },
  { key: 'arrived', label: 'Reached venue' },
  { key: 'shooting', label: 'Shoot started' },
  { key: 'completed', label: 'Completed' },
];

export default function ActiveJobCard({ job, onAdvance, busy }) {
  const action = CREATOR_NEXT_ACTION[job.status];
  const currentIdx = STEPS.findIndex((s) => s.key === job.status);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
  const waText = encodeURIComponent(`Hi ${job.client.name}, this is your SnapNear photographer for ${job.code}. I'm on my way!`);

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white shadow-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          <h4 className="font-display text-sm font-bold">Active Assignment &bull; {job.code}</h4>
        </div>
        <span className="rounded-lg border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-xs font-bold text-emerald-400">
          {STATUS_META[job.status]?.label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.key}>
            <div className={`h-1.5 rounded-full ${i <= currentIdx ? 'bg-gradient-to-r from-brand-orange to-emerald-400' : 'bg-slate-700'}`} />
            <p className={`mt-1.5 text-[9px] leading-tight font-semibold sm:text-[10px] ${i <= currentIdx ? 'text-slate-200' : 'text-slate-500'}`}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs text-slate-300 sm:grid-cols-2">
        <p>
          <strong className="text-white">Customer:</strong> {job.client.name} ({maskPhone(job.client.phone)})
        </p>
        <p>
          <strong className="text-white">Shoot:</strong> {job.serviceLabel} &bull; {job.durationLabel} &bull; {job.occasion}
        </p>
        <p className="sm:col-span-2">
          <strong className="text-white">Location:</strong> {job.address}
        </p>
        <p>
          <strong className="text-white">When:</strong> {formatDate(job.shootDate)} &bull; {job.timeSlot}
        </p>
        <p>
          <strong className="text-white">Earnings locked:</strong>{' '}
          <span className="font-bold text-emerald-400">{formatINR(job.creatorPayout, { fixed: true })}</span>
        </p>
        {job.notes && (
          <p className="sm:col-span-2">
            <strong className="text-white">Notes:</strong> {job.notes}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row">
        <div className="grid flex-1 grid-cols-3 gap-2">
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700">
            <Navigation className="h-3.5 w-3.5" /> Navigate
          </a>
          <a href={`tel:+91${job.client.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700">
            <PhoneCall className="h-3.5 w-3.5" /> Call
          </a>
          <a
            href={`https://wa.me/91${job.client.phone}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        </div>
        {action && (
          <Button variant="success" onClick={() => onAdvance(job)} loading={busy} className="sm:min-w-[180px]">
            {!busy && <Check className="h-4 w-4" />} {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
