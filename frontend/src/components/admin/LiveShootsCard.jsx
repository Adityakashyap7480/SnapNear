import { ArrowRight, Camera, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getShootPhase } from '../shoot/ShootTimer';
import useNow from '../../hooks/useNow';
import { formatClock, formatTime } from '../../utils/format';

const PHASE_STYLE = {
  running: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500' },
  warning: { pill: 'bg-amber-50 text-amber-700 ring-amber-200', bar: 'bg-amber-500' },
  overtime: { pill: 'animate-pulse bg-red-50 text-red-700 ring-red-200', bar: 'bg-red-500' },
};

function LiveShootRow({ shoot, now }) {
  const start = new Date(shoot.startedAt).getTime();
  const end = new Date(shoot.endsAt).getTime();
  const left = end - now;
  const phase = getShootPhase(left, end - start);
  const style = PHASE_STYLE[phase];
  const elapsedPct = Math.min(100, Math.max(0, ((now - start) / Math.max(1, end - start)) * 100));

  return (
    <li className="rounded-xl border border-slate-200 p-3 sm:p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {shoot.code} <span className="font-normal text-slate-400">&bull;</span>{' '}
            <span className="text-xs font-semibold text-slate-600">
              {shoot.occasion} ({shoot.durationLabel})
            </span>
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
            <span className="truncate font-semibold text-slate-800">{shoot.creator?.name || 'Partner'}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />
            <span className="truncate">{shoot.client?.name || 'Customer'}</span>
          </p>
        </div>
        <span className={`rounded-lg px-2.5 py-1 font-display text-sm font-black tabular-nums ring-1 ${style.pill}`}>
          {phase === 'overtime' ? `+${formatClock(-left)} over` : `${formatClock(left)} left`}
        </span>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${style.bar}`} style={{ width: `${elapsedPct}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" /> OTP verified &amp; started at {formatTime(shoot.startedAt)}
        </span>
        <span>Ends {formatTime(shoot.endsAt)}</span>
      </div>
    </li>
  );
}

/** Shoots running right now, each started when the partner entered the customer's OTP. */
export default function LiveShootsCard({ shoots = [] }) {
  const now = useNow(shoots.length > 0);

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {shoots.length > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${shoots.length > 0 ? 'bg-red-500' : 'bg-slate-300'}`} />
          </span>
          <h3 className="font-display text-base font-bold text-slate-900">Live Shoots</h3>
          {shoots.length > 0 && (
            <Badge tone="red" size="md">
              {shoots.length} running
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-slate-500">Starts the moment a partner enters the customer&apos;s OTP</p>
      </div>

      {shoots.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
          <Camera className="h-5 w-5 shrink-0 text-slate-300" />
          No shoots running right now. You&apos;ll get an alert here as soon as one starts.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shoots.map((s) => (
            <LiveShootRow key={s.id} shoot={s} now={now} />
          ))}
        </ul>
      )}
    </Card>
  );
}
