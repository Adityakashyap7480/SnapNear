import { useState } from 'react';
import { CalendarClock, Hourglass, Landmark, Pencil, Send, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/FormField';
import { creatorApi } from '../../api/services';
import { formatDate, formatINR } from '../../utils/format';
import { MESSAGES, isValidUpiId } from '../../utils/validators';

function UpiIdEditor({ upiId, onSaved }) {
  const [editing, setEditing] = useState(!upiId);
  const [value, setValue] = useState(upiId);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const next = value.trim().toLowerCase();
    if (!isValidUpiId(next)) {
      setError(MESSAGES.UPI_ID);
      return;
    }
    setSaving(true);
    try {
      await creatorApi.updateProfile({ upiId: next });
      toast.success('Payout UPI ID saved');
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Payouts go to</p>
          <p className="truncate text-sm font-bold text-slate-900">{upiId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" /> Change
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <Input
        label="Your UPI ID for payouts"
        name="upiId"
        placeholder="yourname@okaxis"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError('');
        }}
        error={error}
        hint="SnapNear sends your 80% earnings here."
      />
      <div className="flex justify-end gap-2">
        {upiId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setValue(upiId);
              setError('');
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="success" size="sm" loading={saving}>
          Save UPI ID
        </Button>
      </div>
    </form>
  );
}

export default function WalletCard({ wallet, onChanged }) {
  return (
    <Card className="grid grid-cols-1 overflow-hidden lg:grid-cols-2">
      <div className="bg-gradient-to-br from-slate-900 to-brand-navy p-4 text-white sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-300 uppercase">
            <Wallet className="h-3.5 w-3.5" /> SnapNear Wallet
          </p>
          {wallet.nextPayoutAt && (
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-200">
              <CalendarClock className="h-3 w-3" /> Payout by {formatDate(wallet.nextPayoutAt, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <p className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
          {formatINR(wallet.balance, { fixed: true })}
        </p>
        <p className="mt-1 text-xs text-slate-300">
          {wallet.balanceCount > 0
            ? `${wallet.balanceCount} paid shoot(s) • sent to your UPI within ${wallet.holdDays} days of payment`
            : 'Your 80% from paid shoots lands here'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase">
              <Hourglass className="h-3 w-3" /> Awaiting customer
            </p>
            <p className="mt-0.5 text-sm font-bold text-amber-300">{formatINR(wallet.awaitingCustomer, { fixed: true })}</p>
            <p className="text-[10px] text-slate-400">{wallet.awaitingCount} unpaid shoot(s)</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase">
              <Landmark className="h-3 w-3" /> Paid out to you
            </p>
            <p className="mt-0.5 text-sm font-bold text-emerald-400">{formatINR(wallet.withdrawn, { fixed: true })}</p>
            <p className="text-[10px] text-slate-400">Lifetime transfers</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <UpiIdEditor key={wallet.upiId} upiId={wallet.upiId} onSaved={onChanged} />

        <div>
          <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Recent payouts</p>
          {wallet.payouts.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              No payouts yet. Once a customer pays, your 80% is sent to your UPI within {wallet.holdDays} days.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {wallet.payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Send className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">Sent to your UPI</p>
                      <p className="truncate text-[10px] text-slate-500">
                        {formatDate(p.paidAt)} &bull; {p.bookingCount} shoot(s)
                        {p.reference ? ` • Ref ${p.reference}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-black text-emerald-600">{formatINR(p.amount, { fixed: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
