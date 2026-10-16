import type { RazorpayCheckout, RazorpayResult } from '../types';
import { createEmitter } from './emitter';

export interface CheckoutRequest {
  checkout: RazorpayCheckout;
  onFailed?: (message: string) => void;
  resolve: (result: RazorpayResult | null) => void;
  reject: (error: Error) => void;
}

/** <CheckoutHost /> listens here and shows Razorpay Checkout in a WebView. */
export const checkoutEvents = createEmitter();

/**
 * Opens Razorpay Checkout with UPI apps first.
 * Resolves with the signed response, or null if the customer closes the window.
 */
export function openRazorpayCheckout(
  checkout: RazorpayCheckout,
  { onFailed }: { onFailed?: (message: string) => void } = {}
): Promise<RazorpayResult | null> {
  return new Promise((resolve, reject) => {
    checkoutEvents.emit<CheckoutRequest>('open', { checkout, onFailed, resolve, reject });
  });
}
