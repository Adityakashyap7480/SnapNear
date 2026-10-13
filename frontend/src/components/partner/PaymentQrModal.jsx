import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { creatorApi } from '../../api/services';
import { copyToClipboard } from '../../utils/clipboard';
import { formatINR } from '../../utils/format';
import { isPaid } from '../../utils/payment';

const POLL_MS = 4000;

/**
 * Shows the SnapNear (Razorpay) payment page for a completed job as a QR code and
 * keeps checking until the customer pays.
 */
export default function PaymentQrModal({ job, onClose, onPaid }) {
  const [link, setLink] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const firstName = job.client.name?.split(' ')[0] || 'the customer';

  useEffect(() => {
    let cancelled = false;
    creatorApi
      .collectLink(job.id)
      .then((res) => !cancelled && setLink(res.link))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [job.id, attempt]);

  const check = useCallback(
    async ({ silent = true } = {}) => {
      try {
        const { booking } = await creatorApi.paymentStatus(job.id);
        if (isPaid(booking)) onPaid(booking);
        else if (!silent) toast('Not paid yet. Ask the customer to complete the payment.', { icon: '⏳' });
      } catch (err) {
        if (!silent) toast.error(err.message);
      }
    },
    [job.id, onPaid]
  );

  useEffect(() => {
    if (!link) return undefined;
    const timer = setInterval(() => check(), POLL_MS);
    return () => clearInterval(timer);
  }, [link, check]);

  const checkNow = async () => {
    setChecking(true);
    await check({ silent: false });
    setChecking(false);
  };

  const copyLink = () => copyToClipboard(link.url, 'Payment link', 'Could not copy. Long-press the link to copy it.');

  const waText = link
    ? encodeURIComponent(
        `Hi ${firstName}, thanks for shooting with SnapNear! Please pay ${formatINR(job.total)} for ${job.code} here: ${link.url}`
      )
    : '';

  return (
    <Modal
      open
      onClose={onClose}
      title={`Collect ${formatINR(job.total)}`}
      description={`${job.code} • ${job.client.name} • ${job.occasion}`}
      icon={QrCode}
      iconClass="bg-orange-100 text-brand-orange"
      footer={
        link && (
          <Button variant="outline" onClick={checkNow} loading={checking}>
            {!checking && <RefreshCw className="h-4 w-4" />} Check payment status
          </Button>
        )
      }
    >
      {error ? (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setError('');
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : !link ? (
        <div className="flex flex-col items-center gap-3 py-10 text-xs text-slate-500">
          <Spinner className="h-7 w-7 text-brand-orange" />
          Generating secure payment QR...
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl border-4 border-slate-900 bg-white p-3 shadow-lg">
            <QRCodeSVG value={link.url} size={220} level="M" marginSize={1} className="h-auto w-[200px] min-[400px]:w-[220px]" />
          </div>
          <p className="mt-3 font-display text-3xl font-black text-slate-900">{formatINR(job.total)}</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
            Ask {firstName} to scan this with their phone camera or Google Lens, then pay with GPay, PhonePe, Paytm or any
            UPI app.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Waiting for payment...
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <a
              href={`https://wa.me/91${job.client.phone}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Send on WhatsApp
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
            Payment goes securely to SnapNear. Your 80% ({formatINR(job.creatorPayout, { fixed: true })}) is added to your
            wallet instantly.
          </p>
        </div>
      )}
    </Modal>
  );
}
