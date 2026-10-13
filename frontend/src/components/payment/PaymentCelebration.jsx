import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { Check, ShieldCheck, Wallet } from 'lucide-react';
import { formatINR } from '../../utils/format';
import { playChime } from '../../utils/sound';
import { paymentMethodLabel } from '../../utils/payment';

const COLORS = ['#ff8008', '#ffc837', '#10b981', '#6366f1', '#f43f5e', '#ffffff'];
const OPEN_DELAY_MS = 750;
const SPARKLES = [
  { icon: '✨', className: 'top-4 left-6' },
  { icon: '💸', className: 'top-10 right-7 [animation-delay:0.6s]' },
  { icon: '🎉', className: 'bottom-16 left-10 [animation-delay:1.1s]' },
  { icon: '⭐', className: 'bottom-20 right-12 [animation-delay:1.6s]' },
];

function fireConfetti() {
  const base = { colors: COLORS, disableForReducedMotion: true, zIndex: 80 };
  confetti({ ...base, particleCount: 150, spread: 110, startVelocity: 48, origin: { y: 0.42 } });

  let gift = null;
  try {
    gift = confetti.shapeFromText({ text: '🎁', scalar: 2.4 });
  } catch {
    /* emoji shapes unsupported */
  }
  if (gift) {
    setTimeout(
      () => confetti({ ...base, shapes: [gift], scalar: 2.4, particleCount: 16, spread: 130, startVelocity: 38, origin: { y: 0.42 } }),
      220
    );
  }

  const end = Date.now() + 1500;
  (function sideCannons() {
    confetti({ ...base, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(sideCannons);
  })();
}

function useCountUp(target, running, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    let frame;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(progress === 1 ? target : target * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, running, duration]);
  return value;
}

function copyFor(c) {
  const first = (name) => name?.split(' ')[0] || '';
  if (c.role === 'partner') {
    return {
      eyebrow: 'Ka-ching! 💸',
      title: 'Payment Received!',
      amountLabel: `${first(c.counterpart) || 'Customer'} paid`,
      message: `${formatINR(c.credited, { fixed: true })} (your 80%) has been added to your SnapNear wallet. It will be sent to your UPI within ${c.holdDays || 7} days.`,
      chip: { icon: Wallet, text: `+${formatINR(c.credited, { fixed: true })} added to your wallet`, tone: 'bg-emerald-50 text-emerald-700' },
    };
  }
  return {
    eyebrow: `Thank you${c.viewerName ? `, ${first(c.viewerName)}` : ''}! 💛`,
    title: 'Payment Successful!',
    amountLabel: 'Amount paid',
    message: `Your payment for ${c.code} is confirmed${c.counterpart ? ` and ${first(c.counterpart)} has been notified` : ''}. Enjoy your photos!`,
    chip: { icon: ShieldCheck, text: 'Paid securely to SnapNear via Razorpay', tone: 'bg-indigo-50 text-brand-violet' },
  };
}

/**
 * Full-screen "gift opens -> confetti -> amount counts up" moment shown to both
 * the customer (after paying) and the partner (when the payment lands).
 * Render with a unique `key` per payment so the animation replays.
 */
export default function PaymentCelebration({ celebration, onClose }) {
  const [opened, setOpened] = useState(false);
  const amount = useCountUp(celebration.amount, opened);
  const copy = copyFor(celebration);
  const ChipIcon = copy.chip.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpened(true);
      playChime('success');
      fireConfetti();
      navigator.vibrate?.([60, 40, 120]);
    }, OPEN_DELAY_MS);
    return () => {
      clearTimeout(timer);
      confetti.reset();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="relative w-full max-w-sm animate-pop-in overflow-hidden rounded-3xl bg-white text-center shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 px-6 pt-8 pb-14 text-white">
          <div className="absolute inset-0 bg-grid opacity-60" />
          {SPARKLES.map((s) => (
            <span key={s.icon} aria-hidden className={`absolute animate-sparkle text-lg ${s.className}`}>
              {s.icon}
            </span>
          ))}

          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            {opened ? (
              <>
                <span className="absolute inset-0 animate-radar rounded-full bg-white/40" />
                <span className="absolute inset-0 animate-radar rounded-full bg-white/30 [animation-delay:0.8s]" />
                <div className="relative flex h-24 w-24 animate-pop-in items-center justify-center rounded-full bg-white text-emerald-600 shadow-xl">
                  <Check className="h-12 w-12" strokeWidth={3} />
                </div>
              </>
            ) : (
              <span aria-hidden className="animate-gift-shake text-7xl leading-none select-none">
                🎁
              </span>
            )}
          </div>

          <p className="relative mt-4 text-xs font-bold tracking-widest text-emerald-100 uppercase">
            {opened ? copy.eyebrow : 'Opening your surprise...'}
          </p>
          <h2 id="celebration-title" className="relative mt-1 font-display text-2xl font-black">
            {copy.title}
          </h2>
        </div>

        <div className="-mt-8 px-5 pb-6">
          <div className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-lg">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{copy.amountLabel}</p>
            <p className="font-display text-4xl font-black text-slate-900 tabular-nums">
              {formatINR(opened ? Math.round(amount) : 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {celebration.code}
              {celebration.method ? ` • via ${paymentMethodLabel(celebration.method)}` : ''}
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{copy.message}</p>

          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${copy.chip.tone}`}>
            <ChipIcon className="h-3.5 w-3.5" /> {copy.chip.text}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-orange to-brand-yellow py-3.5 font-display text-sm font-bold text-slate-950 shadow-glow transition hover:brightness-110 active:scale-[0.99]"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
