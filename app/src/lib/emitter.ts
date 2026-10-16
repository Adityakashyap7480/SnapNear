type Listener<T> = (payload: T) => void;

/** Tiny in-app event bus (the web app used window events; this works on every platform). */
export function createEmitter() {
  const listeners = new Map<string, Set<Listener<unknown>>>();

  return {
    on<T>(event: string, listener: Listener<T>) {
      const set = listeners.get(event) || new Set();
      set.add(listener as Listener<unknown>);
      listeners.set(event, set);
      return () => {
        set.delete(listener as Listener<unknown>);
      };
    },
    emit<T>(event: string, payload?: T) {
      listeners.get(event)?.forEach((listener) => listener(payload));
    },
  };
}

export const appEvents = createEmitter();
