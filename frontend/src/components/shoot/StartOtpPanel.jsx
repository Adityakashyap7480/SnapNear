import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import { formatMinutes } from '../../utils/format';

/** Customer side: the start OTP they read out to the photographer. */
export default function StartOtpPanel({ booking, onRefresh, refreshing }) {
  const otp = booking.startOtp || '';
  const first = booking.creator?.name?.split(' ')[0] || 'your photographer';

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="space-y-3 p-4 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider text-sky-700 uppercase">
          <KeyRound className="h-3.5 w-3.5" /> Shoot start OTP
        </p>

        {otp ? (
          <div className="flex justify-center gap-2.5" aria-label={`OTP ${otp.split('').join(' ')}`}>
            {otp.split('').map((d, i) => (
              <span
                key={i}
                className="flex h-14 w-12 items-center justify-center rounded-xl border-2 border-sky-200 bg-white font-display text-3xl font-black text-slate-900 shadow-sm tabular-nums sm:h-16 sm:w-14"
              >
                {d}
              </span>
            ))}
          </div>
        ) : (
          <p className="py-3 text-xs text-slate-500">Tap “New OTP” to get your code.</p>
        )}

        <p className="text-xs leading-relaxed text-slate-600">
          Share this OTP with <strong className="text-slate-900">{first}</strong> once they&apos;re with you. Your{' '}
          <strong className="text-slate-900">{formatMinutes(booking.durationMinutes || 60)}</strong> timer starts the moment they enter it.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 bg-white/70 px-4 py-2.5">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Only share it in person
        </span>
        <Button variant="outline" size="sm" onClick={() => onRefresh(booking)} loading={refreshing}>
          {!refreshing && <RefreshCw className="h-3 w-3" />} New OTP
        </Button>
      </div>
    </div>
  );
}
