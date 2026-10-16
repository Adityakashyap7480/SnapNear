import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Overlay from '../ui/Overlay';
import { type CheckoutRequest, checkoutEvents } from '../../lib/checkout';
import { checkoutOptions } from '../../lib/checkoutOptions';
import { colors } from '../../theme/colors';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const LOAD_ERROR = 'Could not load the payment window. Check your internet and try again.';

type CheckoutMessage =
  | { type: 'success'; orderId: string; paymentId: string; signature: string }
  | { type: 'dismiss' }
  | { type: 'failed'; message: string }
  | { type: 'error'; message: string };

// JSON in a <script> tag: "</script>" inside a string must not end the tag
const toScriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

function checkoutHtml(request: CheckoutRequest) {
  return `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>html,body{margin:0;background:transparent;}</style>
</head><body>
<script>
  function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function start() {
    var options = ${toScriptJson(checkoutOptions(request.checkout))};
    options.handler = function (res) {
      post({ type: 'success', orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature });
    };
    options.modal = { ondismiss: function () { post({ type: 'dismiss' }); } };
    var rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (res) {
      post({ type: 'failed', message: (res && res.error && res.error.description) || 'Payment failed. Please try again.' });
    });
    rzp.open();
  }
  var s = document.createElement('script');
  s.src = ${toScriptJson(CHECKOUT_SRC)};
  s.onload = start;
  s.onerror = function () { post({ type: 'error', message: ${toScriptJson(LOAD_ERROR)} }); };
  document.body.appendChild(s);
</script>
</body></html>`;
}

/** intent://pay?...#Intent;scheme=upi;package=...;end -> upi://pay?... (UPI apps on Android) */
function intentToUrl(url: string) {
  const match = /^intent:\/\/([^#]*)#Intent;(.*)end$/i.exec(url);
  if (!match) return null;
  const params = Object.fromEntries(
    match[2]
      .split(';')
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=');
        return [p.slice(0, i), p.slice(i + 1)];
      })
  );
  if (params.scheme) return `${params.scheme}://${match[1]}`;
  return params['S.browser_fallback_url'] ? decodeURIComponent(params['S.browser_fallback_url']) : null;
}

/**
 * Phone app: shows Razorpay Checkout (the same checkout.js as the website) in a WebView
 * when openRazorpayCheckout() is called, and hands UPI app links to the OS.
 */
export default function CheckoutHost() {
  const [request, setRequest] = useState<CheckoutRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const settled = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(
    () =>
      checkoutEvents.on<CheckoutRequest>('open', (next) => {
        settled.current = false;
        setLoading(true);
        setRequest(next);
      }),
    []
  );

  const finish = (fn: (r: CheckoutRequest) => void) => {
    if (!request || settled.current) return;
    settled.current = true;
    fn(request);
    setRequest(null);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    let parsed: CheckoutMessage;
    try {
      parsed = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    const msg = parsed;
    if (msg.type === 'success') finish((r) => r.resolve({ orderId: msg.orderId, paymentId: msg.paymentId, signature: msg.signature }));
    else if (msg.type === 'dismiss') finish((r) => r.resolve(null));
    else if (msg.type === 'failed') request?.onFailed?.(msg.message);
    else if (msg.type === 'error') finish((r) => r.reject(new Error(msg.message)));
  };

  if (!request) return null;

  return (
    <Overlay onRequestClose={() => finish((r) => r.resolve(null))}>
      <View className="flex-1 bg-slate-950/60" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <WebView
          originWhitelist={['*']}
          source={{ html: checkoutHtml(request), baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={onMessage}
          onLoadEnd={() => setLoading(false)}
          onError={() => finish((r) => r.reject(new Error(LOAD_ERROR)))}
          onShouldStartLoadWithRequest={({ url }) => {
            if (/^(https?|about|data|blob):/i.test(url)) return true;
            const target = url.startsWith('intent:') ? intentToUrl(url) : url;
            if (target) Linking.openURL(target).catch(() => request.onFailed?.('No app found to complete this payment. Try another method.'));
            return false;
          }}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          style={{ backgroundColor: 'transparent' }}
          containerStyle={{ backgroundColor: 'transparent' }}
        />
        {loading && (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <ActivityIndicator size="large" color={colors.brand.orange} />
          </View>
        )}
      </View>
    </Overlay>
  );
}
