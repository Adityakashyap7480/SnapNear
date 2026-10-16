import brand from '../theme/brand';
import type { RazorpayCheckout } from '../types';

/** Razorpay Checkout options shared by the website and the phone app (UPI apps first). */
export const checkoutOptions = (checkout: RazorpayCheckout) => ({
  key: checkout.keyId,
  order_id: checkout.orderId,
  amount: checkout.amount,
  currency: checkout.currency,
  name: checkout.name,
  description: checkout.description,
  prefill: checkout.prefill,
  notes: checkout.notes,
  theme: { color: brand.orange },
  config: {
    display: {
      blocks: {
        upi: { name: 'Pay with UPI (GPay, PhonePe, Paytm)', instruments: [{ method: 'upi' }] },
      },
      sequence: ['block.upi'],
      preferences: { show_default_blocks: true },
    },
  },
});
