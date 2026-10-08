import { CheckCircle, Radio, Shield } from 'lucide-react';
import { formatINR } from '../../utils/format';
import Spinner from '../ui/Spinner';

export default function FareCard({ tier, serviceLabel, onBroadcast, submitting }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-brand-navy p-4 text-white shadow-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs font-semibold text-slate-400">On-Demand Fare Breakdown</span>
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          Hyper-local Dispatch
        </span>
      </div>

      <div className="space-y-3 py-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="min-w-0 text-slate-300">
            {serviceLabel} &bull; {tier?.label}
          </span>
          <span className="font-bold text-white">{formatINR(tier?.total)}</span>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-700/60 bg-slate-800/70 p-3 text-xs">
          <div className="flex items-center justify-between font-medium text-emerald-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Photographer Payout (80%)
            </span>
            <span className="font-bold">{formatINR(tier?.creatorPayout, { fixed: true })}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Platform & Tech Fee (20%)
            </span>
            <span className="font-semibold text-slate-300">{formatINR(tier?.platformFee, { fixed: true })}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            <span className="block text-xs text-slate-400">Total Amount Payable</span>
            <span className="text-[11px] text-amber-400">No surge &bull; Doorstep travel included</span>
          </div>
          <span className="shrink-0 font-display text-2xl font-black text-brand-yellow sm:text-3xl">
            {formatINR(tier?.total)}
          </span>
        </div>
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={onBroadcast}
          disabled={submitting || !tier}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-yellow px-3 py-3.5 font-display sm:py-4 text-sm font-bold text-slate-950 shadow-glow transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? <Spinner className="h-4 w-4" /> : <Radio className="h-4 w-4 animate-pulse" />}
          <span>{submitting ? 'Finding photographers...' : 'Find Nearby Photographer'}</span>
        </button>
        <p className="mt-2.5 text-center text-[11px] text-slate-400">
          Verified photographers within 5 km get an instant ping. The first to accept comes to you.
        </p>
      </div>
    </div>
  );
}
