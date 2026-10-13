import { BadgeCheck, ShieldAlert, Smartphone } from 'lucide-react';
import Button from '../ui/Button';
import { formatDateTime, formatINR } from '../../utils/format';
import { isPaid, isPaymentDue, paymentMethodLabel } from '../../utils/payment';

const PAY_OPTIONS = ['GPay', 'PhonePe', 'Paytm', 'Any UPI', 'Cards'];

/** Customer-side payment state for a completed shoot: "Pay now" while due, a receipt once paid. */
export default function PayNowPanel({ booking, onPay, paying }) {
  if (isPaid(booking)) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-800">Paid {formatINR(booking.total)}</p>
          <p className="text-[11px] text-emerald-700">
            via {paymentMethodLabel(booking.payment.method)} &bull; {formatDateTime(booking.payment.paidAt)}
          </p>
        </div>
      </div>
    );
  }

  if (!isPaymentDue(booking)) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-brand-orange uppercase">Payment pending</p>
          <p className="font-display text-sm font-bold text-slate-900">Your shoot is complete! 🎉</p>
          <p className="text-[11px] text-slate-500">Pay securely to wrap up your booking.</p>
        </div>
        <p className="shrink-0 font-display text-2xl font-black text-slate-900">{formatINR(booking.total)}</p>
      </div>

      <Button size="lg" className="w-full" onClick={() => onPay(booking)} loading={paying}>
        {!paying && <Smartphone className="h-4 w-4" />} Pay {formatINR(booking.total)}
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {PAY_OPTIONS.map((m) => (
          <span key={m} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
            {m}
          </span>
        ))}
      </div>

      <p className="flex items-start gap-1.5 rounded-lg bg-white/80 p-2 text-[11px] leading-relaxed text-slate-600">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span>
          Pay only through SnapNear: here, or by scanning the SnapNear QR on your photographer&apos;s phone. Please
          don&apos;t pay cash; cash payments aren&apos;t protected.
        </span>
      </p>
    </div>
  );
}
