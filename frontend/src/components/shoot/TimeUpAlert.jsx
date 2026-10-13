import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlarmClock, CheckCircle2, Clock, VolumeX } from 'lucide-react';
import Button from '../ui/Button';
import useNow from '../../hooks/useNow';
import { formatClock, formatMinutes, formatTime } from '../../utils/format';
import { startAlarm, vibrate } from '../../utils/sound';

const VIBRATE_PATTERN = [400, 200, 400, 200, 800];
const VIBRATE_EVERY_MS = 2500;

function copyFor(role, booking) {
  const minutes = formatMinutes(booking.durationMinutes || 60);
  if (role === 'partner') {
    const first = booking.client?.name?.split(' ')[0] || 'the customer';
    return {
      title: "Time's up!",
      message: `The ${minutes} shoot for ${first} is complete. Wrap up and mark it completed to collect payment.`,
    };
  }
  const first = booking.creator?.name?.split(' ')[0] || 'Your photographer';
  return {
    title: "Time's up!",
    message: `Your ${minutes} shoot is complete. ${first} will wrap up and mark it completed, then you can pay securely in the app.`,
  };
}

/**
 * Full-screen alarm shown to both the customer and the partner when the booked
 * shoot time runs out. Keeps ringing and vibrating until dismissed.
 */
export default function TimeUpAlert({ booking, role, onDismiss, onComplete, completing }) {
  const now = useNow();
  const [muted, setMuted] = useState(false);
  const overtime = Math.max(0, now - new Date(booking.endsAt).getTime());
  const copy = copyFor(role, booking);

  useEffect(() => {
    if (muted) return undefined;
    const stopAlarm = startAlarm();
    vibrate(VIBRATE_PATTERN);
    const buzz = window.setInterval(() => vibrate(VIBRATE_PATTERN), VIBRATE_EVERY_MS);
    return () => {
      stopAlarm();
      window.clearInterval(buzz);
      vibrate(0);
    };
  }, [muted]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onDismiss();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onDismiss]);

  return createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="time-up-title"
      aria-describedby="time-up-message"
    >
      <div className="relative w-full max-w-sm animate-pop-in overflow-hidden rounded-3xl bg-white text-center shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 px-6 pt-9 pb-14 text-white">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 animate-radar rounded-full bg-white/40" />
            <span className="absolute inset-0 animate-radar rounded-full bg-white/30 [animation-delay:0.7s]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-red-500 shadow-xl">
              <AlarmClock className={`h-12 w-12 ${muted ? '' : 'animate-ring'}`} strokeWidth={2.4} />
            </div>
          </div>
          <p className="relative mt-4 text-xs font-bold tracking-widest text-red-100 uppercase">
            {booking.code} &bull; {booking.occasion}
          </p>
          <h2 id="time-up-title" className="relative mt-1 font-display text-3xl font-black">
            {copy.title} ⏰
          </h2>
        </div>

        <div className="-mt-8 px-5 pb-6">
          <div className="relative grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-white py-3 shadow-lg">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Started</p>
              <p className="text-sm font-bold text-slate-900">{formatTime(booking.startedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Ended</p>
              <p className="text-sm font-bold text-slate-900">{formatTime(booking.endsAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-red-500 uppercase">Overtime</p>
              <p className="text-sm font-bold text-red-600 tabular-nums">+{formatClock(overtime)}</p>
            </div>
          </div>

          <p id="time-up-message" className="mt-4 text-sm leading-relaxed text-slate-600">
            {copy.message}
          </p>

          <div className="mt-5 space-y-2">
            {role === 'partner' ? (
              <>
                <Button variant="success" size="lg" className="w-full" onClick={() => onComplete(booking)} loading={completing}>
                  {!completing && <CheckCircle2 className="h-4 w-4" />} Mark Shoot Completed
                </Button>
                <Button variant="outline" className="w-full" onClick={onDismiss} disabled={completing}>
                  <Clock className="h-4 w-4" /> Keep shooting (overtime)
                </Button>
              </>
            ) : (
              <Button size="lg" className="w-full" onClick={onDismiss}>
                OK, got it
              </Button>
            )}
            {!muted && (
              <button
                type="button"
                onClick={() => setMuted(true)}
                className="mx-auto flex items-center gap-1 pt-1 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                <VolumeX className="h-3.5 w-3.5" /> Silence alarm
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
