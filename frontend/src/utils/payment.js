import { PAYMENT_STATUS } from '../config/constants';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const METHOD_LABELS = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
  paylater: 'Pay Later',
};

export const paymentMethodLabel = (method) =>
  METHOD_LABELS[method] || (method ? method[0].toUpperCase() + method.slice(1) : 'Online');

export const isPaymentDue = (booking) => booking?.payment?.status === PAYMENT_STATUS.DUE;
export const isPaid = (booking) => booking?.payment?.status === PAYMENT_STATUS.PAID;

let scriptPromise = null;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  scriptPromise =
    scriptPromise ||
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_SRC;
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
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
export async function openRazorpayCheckout(checkout, { onFailed } = {}) {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve) => {
    const rzp = new Razorpay({
      key: checkout.keyId,
      order_id: checkout.orderId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      prefill: checkout.prefill,
      notes: checkout.notes,
      theme: { color: '#ff8008' },
      config: {
        display: {
          blocks: {
            upi: { name: 'Pay with UPI (GPay, PhonePe, Paytm)', instruments: [{ method: 'upi' }] },
          },
          sequence: ['block.upi'],
          preferences: { show_default_blocks: true },
        },
      },
      handler: (res) =>
        resolve({ orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature }),
      modal: { ondismiss: () => resolve(null) },
    });
    // Razorpay keeps its window open so the customer can retry with another app or method
    rzp.on('payment.failed', (res) => onFailed?.(res?.error?.description || 'Payment failed. Please try again.'));
    rzp.open();
  });
}
