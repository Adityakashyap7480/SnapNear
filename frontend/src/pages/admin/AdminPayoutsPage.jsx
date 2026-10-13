import { useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, Copy, Hourglass, Landmark, Send, Smartphone, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { EmptyState, StatCard } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/FormField';
import { PageLoader } from '../../components/ui/Spinner';
import PageHeader from '../../components/admin/PageHeader';
import BookingsLedger from '../../components/admin/BookingsLedger';
import { adminApi } from '../../api/services';
import { BOOKING_FILTER } from '../../config/constants';
import useAsync from '../../hooks/useAsync';
import useAdminLive from '../../hooks/useAdminLive';
import { copyToClipboard } from '../../utils/clipboard';
import { formatDate, formatDateTime, formatINR } from '../../utils/format';

function HoldChip({ partner }) {
  if (partner.readyCount === partner.count) {
    return (
      <Badge tone="emerald" icon={CheckCircle2}>
        Ready to pay
      </Badge>
    );
  }
  if (partner.readyCount > 0) {
    return <Badge tone="amber">{formatINR(partner.readyAmount)} ready</Badge>;
  }
  return (
    <Badge icon={Hourglass}>Hold till {formatDate(partner.nextEligibleAt, { day: 'numeric', month: 'short' })}</Badge>
  );
}

function UpiLine({ partner }) {
  if (!partner.upiId) {
    return (
      <p className="flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>UPI ID not added. Ask {partner.name.split(' ')[0]} to add it in their wallet, or pay to {partner.phone}.</span>
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase">UPI ID</p>
        <p className="truncate text-xs font-bold text-slate-800">{partner.upiId}</p>
      </div>
      <button
        type="button"
        onClick={() => copyToClipboard(partner.upiId, 'UPI ID')}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
        aria-label="Copy UPI ID"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MarkPaidModal({ partner, holdDays, onClose, onDone }) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const early = partner.readyCount < partner.count;
  const upiLink = partner.upiId
    ? `upi://pay?pa=${encodeURIComponent(partner.upiId)}&pn=${encodeURIComponent(partner.name)}&am=${partner.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('SnapNear payout')}`
    : null;

  const confirm = async () => {
    setSaving(true);
    try {
      const { payout } = await adminApi.markPayout({ creatorId: partner.creatorId, reference, note });
      toast.success(`${formatINR(payout.amount, { fixed: true })} marked as paid to ${partner.name}`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Pay ${partner.name}`}
      description="Send this amount from your UPI app first, then record it here. The partner's wallet goes to ₹0 and they get notified."
      icon={Banknote}
      iconClass="bg-emerald-100 text-emerald-700"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirm} loading={saving}>
            {!saving && <CheckCircle2 className="h-4 w-4" />} Mark {formatINR(partner.amount, { fixed: true })} as Paid
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 text-center ring-1 ring-emerald-200">
          <p className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">Amount to send</p>
          <p className="font-display text-3xl font-black text-slate-900">{formatINR(partner.amount, { fixed: true })}</p>
          <p className="text-[11px] text-slate-500">
            {partner.count} paid shoot(s): {partner.codes.join(', ')}
          </p>
        </div>

        <UpiLine partner={partner} />

        {upiLink && (
          <a
            href={upiLink}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Smartphone className="h-3.5 w-3.5 text-brand-violet" /> Open UPI app with amount (on phone)
          </a>
        )}

        {early && (
          <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
            <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Some payments are still inside the {holdDays}-day hold (till{' '}
              {formatDate(partner.nextEligibleAt, { day: 'numeric', month: 'short' })}). You can still pay early.
            </span>
          </p>
        )}

        <Input
          label="UPI transaction ID / UTR (optional)"
          name="reference"
          placeholder="e.g. 428193650127"
          maxLength={80}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <Input
          label="Note (optional)"
          name="note"
          placeholder="e.g. Weekly payout"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default function AdminPayoutsPage() {
  const { data, loading, reload } = useAsync(() => adminApi.payouts(), []);
  const [target, setTarget] = useState(null);
  useAdminLive(() => reload());

  if (loading || !data) return <PageLoader label="Loading payouts..." />;

  const { summary: s, partners, history, holdDays } = data;

  return (
    <div className="space-y-6">
      {target && (
        <MarkPaidModal
          key={target.creatorId}
          partner={target}
          holdDays={holdDays}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            reload();
          }}
        />
      )}

      <PageHeader
        eyebrow="Payouts"
        title="Partner payouts"
        subtitle={`Customers pay SnapNear online. Partners get their 80% by UPI from you, ${holdDays} days after each payment.`}
        onRefresh={() => reload()}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          tone="amber"
          icon={Wallet}
          label="Owed to Partners"
          value={formatINR(s.owedToPartners, { fixed: true })}
          hint={`${s.owedCount} paid shoot(s) in wallets`}
        />
        <StatCard
          tone="emerald"
          icon={CheckCircle2}
          label="Ready to Pay Now"
          value={formatINR(s.readyToPay, { fixed: true })}
          hint={`${holdDays}-day hold is over`}
        />
        <StatCard
          tone="navy"
          icon={Landmark}
          label="Collected Online"
          value={formatINR(s.collected, { fixed: true })}
          hint={`${s.collectedCount} payments • your 20%: ${formatINR(s.platformCollected, { fixed: true })}`}
        />
        <StatCard
          icon={Send}
          label="Paid Out to Partners"
          value={formatINR(s.paidOut, { fixed: true })}
          hint={`${s.payoutCount} transfer(s) • ${formatINR(s.dueFromCustomers)} awaiting customers`}
        />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="font-display text-base font-bold text-slate-900">Pending payouts</h3>
          <p className="text-xs text-slate-500">Send the amount by UPI, then tap Mark as Paid. The partner&apos;s wallet resets to ₹0.</p>
        </div>

        {partners.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All partners are paid up"
            description="When a customer pays for a shoot, the partner's 80% shows up here."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {partners.map((p) => (
              <li key={p.creatorId} className="flex flex-col rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar name={p.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                      <HoldChip partner={p} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {p.phone} {p.city ? `• ${p.city}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Wallet balance</p>
                    <p className="font-display text-2xl font-black text-slate-900">{formatINR(p.amount, { fixed: true })}</p>
                  </div>
                  <p className="text-right text-[10px] text-slate-500">
                    {p.count} shoot(s)
                    <br />
                    first paid {formatDate(p.oldestPaidAt, { day: 'numeric', month: 'short' })}
                  </p>
                </div>

                <div className="mt-3">
                  <UpiLine partner={p} />
                </div>
                <div className="min-h-3 flex-1" />
                <Button variant="success" className="mt-3 w-full" onClick={() => setTarget(p)}>
                  <Banknote className="h-4 w-4" /> Mark as Paid
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="mb-3">
          <h3 className="font-display text-base font-bold text-slate-900">Payout history</h3>
          <p className="text-xs text-slate-500">Every transfer you&apos;ve recorded</p>
        </div>

        {history.length === 0 ? (
          <EmptyState icon={Send} title="No payouts yet" description="Payouts you mark as paid will be listed here." />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{h.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {formatDateTime(h.paidAt)} &bull; {h.bookingCount} shoot(s)
                      {h.reference ? ` • Ref ${h.reference}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-black text-emerald-600">{formatINR(h.amount, { fixed: true })}</span>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-[10px] font-semibold text-slate-700 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Paid on</th>
                    <th className="px-3 py-2.5">Partner</th>
                    <th className="px-3 py-2.5">UPI ID</th>
                    <th className="px-3 py-2.5 text-center">Shoots</th>
                    <th className="px-3 py-2.5">Reference / Note</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">{formatDateTime(h.paidAt)}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-800">{h.name}</p>
                        <p className="text-[10px] text-slate-400">{h.phone}</p>
                      </td>
                      <td className="px-3 py-3">{h.upiId || '—'}</td>
                      <td className="px-3 py-3 text-center">{h.bookingCount}</td>
                      <td className="max-w-[220px] truncate px-3 py-3" title={[h.reference, h.note].filter(Boolean).join(' • ')}>
                        {[h.reference, h.note].filter(Boolean).join(' • ') || '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-600">{formatINR(h.amount, { fixed: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <BookingsLedger
        title="Customer payments"
        subtitle="Completed shoots and whether the customer has paid"
        initialStatus={BOOKING_FILTER.UNPAID}
        tabs={[
          { id: BOOKING_FILTER.UNPAID, label: 'Payment Due' },
          { id: BOOKING_FILTER.COMPLETED, label: 'All Completed' },
        ]}
      />
    </div>
  );
}
