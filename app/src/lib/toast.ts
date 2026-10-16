/** Same call style as react-hot-toast (used by the web app), rendered by <Toaster />. */
export type ToastType = 'blank' | 'success' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  icon?: string | null;
  duration: number;
  createdAt: number;
}

interface ToastOptions {
  id?: string;
  icon?: string | null;
  duration?: number;
}

const DEFAULT_DURATION_MS = 4500;

let toasts: ToastItem[] = [];
let counter = 0;
const listeners = new Set<(items: ToastItem[]) => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const publish = () => listeners.forEach((l) => l(toasts));

function dismiss(id?: string) {
  const ids = id ? [id] : toasts.map((t) => t.id);
  ids.forEach((tid) => {
    clearTimeout(timers.get(tid));
    timers.delete(tid);
  });
  toasts = id ? toasts.filter((t) => t.id !== id) : [];
  publish();
}

function show(type: ToastType, message: string, opts: ToastOptions = {}) {
  counter += 1;
  const id = opts.id || `t${counter}`;
  const item: ToastItem = {
    id,
    type,
    message,
    icon: opts.icon,
    duration: opts.duration ?? DEFAULT_DURATION_MS,
    createdAt: Date.now(),
  };
  const exists = toasts.some((t) => t.id === id);
  toasts = exists ? toasts.map((t) => (t.id === id ? item : t)) : [...toasts, item];
  clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => dismiss(id), item.duration)
  );
  publish();
  return id;
}

// Toasts render in the top-most open overlay so they are never hidden behind a modal
let hosts: string[] = ['root'];
const hostListeners = new Set<() => void>();
const publishHosts = () => hostListeners.forEach((l) => l());

export const toastHosts = {
  push(id: string) {
    hosts = [...hosts.filter((h) => h !== id), id];
    publishHosts();
  },
  remove(id: string) {
    hosts = hosts.filter((h) => h !== id);
    publishHosts();
  },
  top: () => hosts[hosts.length - 1],
  subscribe(listener: () => void) {
    hostListeners.add(listener);
    return () => {
      hostListeners.delete(listener);
    };
  },
};

const toast = Object.assign((message: string, opts?: ToastOptions) => show('blank', message, opts), {
  success: (message: string, opts?: ToastOptions) => show('success', message, opts),
  error: (message: string, opts?: ToastOptions) => show('error', message, opts),
  dismiss,
  subscribe(listener: (items: ToastItem[]) => void) {
    listeners.add(listener);
    listener(toasts);
    return () => {
      listeners.delete(listener);
    };
  },
});

export default toast;
