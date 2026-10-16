import { useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import Text from './Text';
import { FadeUp } from './motion';
import toast, { type ToastItem, toastHosts } from '../../lib/toast';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

function ToastIcon({ item }: { item: ToastItem }) {
  if (item.icon !== undefined && item.type === 'blank') {
    return item.icon ? <Text className="text-base">{item.icon}</Text> : null;
  }
  if (item.type === 'success' || item.type === 'error') {
    const ok = item.type === 'success';
    return (
      <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: ok ? '#61d345' : '#ff4b4b' }}>
        {ok ? <Check size={12} color={colors.white} strokeWidth={3.5} /> : <X size={12} color={colors.white} strokeWidth={3.5} />}
      </View>
    );
  }
  return item.icon ? <Text className="text-base">{item.icon}</Text> : null;
}

/** Top-centre on phones, bottom-right on wide screens (as on the web app). */
export default function Toaster({ host = 'root' }: { host?: string }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [isTop, setIsTop] = useState(() => toastHosts.top() === host);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mobile = width < 640;

  useEffect(() => toast.subscribe(setItems), []);
  useEffect(() => {
    if (host !== 'root') toastHosts.push(host);
    const sync = () => setIsTop(toastHosts.top() === host);
    sync();
    const unsubscribe = toastHosts.subscribe(sync);
    return () => {
      unsubscribe();
      if (host !== 'root') toastHosts.remove(host);
    };
  }, [host]);

  if (items.length === 0 || !isTop) return null;

  return (
    <View
      pointerEvents="box-none"
      className={`absolute left-0 right-0 z-50 px-4 ${mobile ? 'items-center' : 'items-end'}`}
      style={mobile ? { top: insets.top + 16 } : { bottom: insets.bottom + 16 }}
    >
      {(mobile ? items : [...items].reverse()).map((item) => (
        <FadeUp key={item.id + item.createdAt} className="mb-2 max-w-[350px]">
          <Pressable
            onPress={() => toast.dismiss(item.id)}
            role="status"
            aria-live="polite"
            className="flex-row items-center gap-2.5 rounded-2xl border border-slate-700 px-3.5 py-2.5"
            style={[{ backgroundColor: '#0F172A' }, shadows.lg]}
          >
            <ToastIcon item={item} />
            <Text className="shrink text-[13px] font-medium leading-5 text-white">{item.message}</Text>
          </Pressable>
        </FadeUp>
      ))}
    </View>
  );
}
