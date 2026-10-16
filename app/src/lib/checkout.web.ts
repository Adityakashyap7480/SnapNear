import type { RazorpayCheckout, RazorpayResult } from '../types';
import { checkoutOptions } from './checkoutOptions';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayInstance {
  on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
  open: () => void;
}
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let scriptPromise: Promise<RazorpayCtor> | null = null;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  scriptPromise =
    scriptPromise ||
    new Promise<RazorpayCtor>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_SRC;
      script.async = true;
      script.onload = () => resolve(window.Razorpay as RazorpayCtor);
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error('Could not load the payment window. Check your internet and try again.'));
      };
      document.body.appendChild(script);
    });
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout with UPI apps first.
 * Resolves with the signed response, or null if the customer closes the window.
 */
export async function openRazorpayCheckout(
  checkout: RazorpayCheckout,
  { onFailed }: { onFailed?: (message: string) => void } = {}
): Promise<RazorpayResult | null> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve) => {
    const rzp = new Razorpay({
      ...checkoutOptions(checkout),
      handler: (res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        resolve({ orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature }),
      modal: { ondismiss: () => resolve(null) },
    });
    // Razorpay keeps its window open so the customer can retry with another app or method
    rzp.on('payment.failed', (res) => onFailed?.(res?.error?.description || 'Payment failed. Please try again.'));
    rzp.open();
  });
}
