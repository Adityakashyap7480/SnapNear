import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Ban, BadgeIndianRupee, Camera, FileCheck2, Handshake, KeyRound, ShieldAlert, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { creatorApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_EMAIL } from '../../config/constants';

const TERMS = [
  {
    icon: BadgeIndianRupee,
    title: '20% platform fee on every shoot',
    body: 'For every shoot you get through SnapNear, 20% of the booking amount is the SnapNear platform & service fee and the rest is yours. Example: on a ₹500 shoot you earn ₹400 and ₹100 goes to SnapNear.',
  },
  {
    icon: Wallet,
    title: 'Payments only through SnapNear',
    body: 'Customers always pay inside the SnapNear app (UPI, card or the payment QR). Never ask for or accept cash or direct UPI from a SnapNear customer. Your earnings reach your wallet and are paid to your UPI ID after the payout hold period.',
  },
  {
    icon: Handshake,
    title: 'No taking customers outside SnapNear',
    body: 'Do not offer private deals or discounts, ask customers to book you directly, or take repeat shoots offline with customers you met through SnapNear.',
  },
  {
    icon: KeyRound,
    title: 'Honest shoots',
    body: "Start a shoot only with the customer's OTP, and mark it completed only when the shoot is actually done. Fake bookings, fake OTPs or misusing the timer are not allowed.",
  },
  {
    icon: Camera,
    title: 'Professional conduct & privacy',
    body: "Be on time, polite and safe at every venue. Photos and videos belong to the customer: never share, post or sell them without the customer's permission.",
  },
];

/**
 * Must be accepted before a partner can use the app (shown after signup, and again whenever
 * the terms version changes). Cannot be dismissed, only accepted or logged out of.
 */
export default function PartnerTermsModal() {
  const { setUser, logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const accept = async () => {
    setSaving(true);
    try {
      const { user } = await creatorApi.acceptTerms();
      setUser(user);
      toast.success('Welcome to SnapNear Partner! Go online to start getting shoots.');
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/75 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-terms-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg animate-fade-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="shrink-0 bg-gradient-to-br from-brand-violet to-indigo-700 px-5 pt-6 pb-5 text-white sm:px-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <FileCheck2 className="h-6 w-6" />
          </span>
          <h2 id="partner-terms-title" className="mt-3 font-display text-xl font-extrabold">
            SnapNear Partner Terms
          </h2>
          <p className="mt-1 text-xs text-indigo-100">Please read these carefully. You need to accept them before you start taking shoots.</p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          {TERMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-brand-violet">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{body}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-red-700">
                <Ban className="h-3.5 w-3.5" /> Breaking these rules will get your account blocked
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-red-700/90">
                Fraud, taking SnapNear customers directly, collecting payment outside the app, fake activity or misbehaviour
                with a customer can lead to your account being suspended or permanently blocked. Payouts linked to a disputed
                shoot may be held while we investigate.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Questions? Write to <span className="font-semibold text-slate-500">{SUPPORT_EMAIL}</span>
          </p>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-700">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-violet"
            />
            <span>
              I have read and agree to the <strong>SnapNear Partner Terms</strong>, including the 20% platform fee on every
              shoot.
            </span>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="ghost" onClick={logout} disabled={saving} className="sm:w-28">
              Log out
            </Button>
            <Button variant="violet" size="lg" onClick={accept} disabled={!agreed} loading={saving} className="flex-1">
              Next {!saving && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
