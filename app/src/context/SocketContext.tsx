import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { type Socket, io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { APP_EVENTS, SOCKET_EVENTS } from '../config/events';
import { appEvents } from '../lib/emitter';
import type { AccountNoticeInfo } from '../types';
import { useAuth } from './AuthContext';

const SocketContext = createContext<{ socket: Socket | null; connected: boolean }>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user || !SOCKET_URL) return undefined;

    // Web: polling first — Metro/dev proxies often break the websocket upgrade.
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket', 'polling'],
      withCredentials: true,
    });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on(SOCKET_EVENTS.ACCOUNT_RESTRICTED, (notice: AccountNoticeInfo) => {
      appEvents.emit(APP_EVENTS.ACCOUNT_RESTRICTED, notice);
    });
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

/** Subscribes to a socket event; the latest handler is always used without resubscribing. */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
