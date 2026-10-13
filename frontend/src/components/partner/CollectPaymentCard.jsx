import { QrCode } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatINR, timeAgo } from '../../utils/format';

/** Completed shoots whose customer hasn't paid yet; the partner can show a SnapNear payment QR. */
export default function CollectPaymentCard({ jobs, onShowQr }) {
  return (
    <div className="space-y-3 rounded-2xl border-2 border-brand-orange/40 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-orange" />
        </span>
        <h4 className="font-display text-sm font-bold text-slate-900">Collect payment</h4>
        <Badge tone="brand">{jobs.length}</Badge>
      </div>

      <ul className="space-y-2.5">
        {jobs.map((j) => (
          <li
            key={j.id}
            className="flex flex-col gap-3 rounded-xl bg-white p-3 ring-1 ring-orange-100 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {j.client.name} &bull; {formatINR(j.total)}
              </p>
              <p className="text-[11px] text-slate-500">
                {j.code} &bull; {j.occasion} &bull; completed {timeAgo(j.completedAt)}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">
                Your 80%: {formatINR(j.creatorPayout, { fixed: true })} goes to your wallet once paid
              </p>
            </div>
            <Button onClick={() => onShowQr(j)} className="shrink-0">
              <QrCode className="h-4 w-4" /> Show Payment QR
            </Button>
          </li>
        ))}
      </ul>

      <p className="text-[11px] leading-relaxed text-slate-600">
        The customer also sees a &quot;Pay&quot; button in their app. Please don&apos;t accept cash; only SnapNear payments
        reach your wallet.
      </p>
    </div>
  );
}
