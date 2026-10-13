import { AlarmClock, Timer } from 'lucide-react';
import useNow from '../../hooks/useNow';
import { SHOOT_WARNING_MINUTES } from '../../config/constants';
import { formatClock, formatMinutes, formatTime } from '../../utils/format';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASES = {
  running: { stroke: 'stroke-emerald-500', text: 'text-emerald-600', label: 'remaining' },
  warning: { stroke: 'stroke-amber-500', text: 'text-amber-600', label: 'remaining' },
  overtime: { stroke: 'stroke-red-500', text: 'text-red-600', label: 'overtime' },
};

const TONES = {
  light: { track: 'stroke-slate-100', time: 'text-slate-900', muted: 'text-slate-500', panel: 'border-slate-200 bg-slate-50' },
  dark: { track: 'stroke-slate-700', time: 'text-white', muted: 'text-slate-400', panel: 'border-slate-800 bg-slate-950/60' },
};

export function getShootPhase(leftMs, totalMs) {
  const warnMs = SHOOT_WARNING_MINUTES * 60 * 1000;
  if (leftMs <= 0) return 'overtime';
  return totalMs > warnMs && leftMs <= warnMs ? 'warning' : 'running';
}

/** Countdown ring for a running shoot; switches to an overtime counter once time is up. */
export default function ShootTimer({ booking, tone = 'light' }) {
  const now = useNow();
  const start = new Date(booking.startedAt).getTime();
  const end = new Date(booking.endsAt).getTime();
  const left = end - now;
  const phase = getShootPhase(left, end - start);
  const meta = PHASES[phase];
  const colors = TONES[tone];
  const remainingFraction = phase === 'overtime' ? 1 : Math.min(1, Math.max(0, left / Math.max(1, end - start)));
  const minutes = booking.durationMinutes || Math.round((end - start) / 60000);

  return (
    <div className={`flex flex-col items-center gap-4 rounded-2xl border p-4 sm:flex-row sm:gap-5 ${colors.panel}`}>
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="9" className={colors.track} />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - remainingFraction)}
            className={`${meta.stroke} transition-[stroke-dashoffset] duration-1000 ease-linear ${phase === 'overtime' ? 'animate-pulse' : ''}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-2xl leading-none font-black tabular-nums ${phase === 'overtime' ? meta.text : colors.time}`} role="timer" aria-live="off">
            {phase === 'overtime' ? '+' : ''}
            {formatClock(Math.abs(left))}
          </span>
          <span className={`mt-1 text-[10px] font-bold tracking-wider uppercase ${meta.text}`}>{meta.label}</span>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-2 text-center sm:text-left">
        <p className={`flex items-center justify-center gap-1.5 font-display text-sm font-bold sm:justify-start ${meta.text}`}>
          {phase === 'overtime' ? <AlarmClock className="h-4 w-4 animate-ring" /> : <Timer className="h-4 w-4" />}
          {phase === 'overtime'
            ? 'Booked time is over'
            : phase === 'warning'
              ? `Less than ${SHOOT_WARNING_MINUTES} minutes left`
              : 'Shoot in progress'}
        </p>
        <div className={`grid grid-cols-3 gap-2 text-[11px] ${colors.muted}`}>
          <div>
            <p className="font-semibold">Booked</p>
            <p className={`font-bold ${colors.time}`}>{formatMinutes(minutes)}</p>
          </div>
          <div>
            <p className="font-semibold">Started</p>
            <p className={`font-bold ${colors.time}`}>{formatTime(booking.startedAt)}</p>
          </div>
          <div>
            <p className="font-semibold">Ends</p>
            <p className={`font-bold ${colors.time}`}>{formatTime(booking.endsAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
