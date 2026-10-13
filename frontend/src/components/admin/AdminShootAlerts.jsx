import toast from 'react-hot-toast';
import { useSocketEvent } from '../../context/SocketContext';
import { BOOKING_EVENTS, SOCKET_EVENTS } from '../../config/events';
import { formatMinutes, formatTime } from '../../utils/format';
import { playChime } from '../../utils/sound';

/** Owner-wide alert (any admin page) when a partner starts a shoot with the customer's OTP. */
export default function AdminShootAlerts() {
  useSocketEvent(SOCKET_EVENTS.ADMIN_UPDATE, (payload) => {
    if (payload.event !== BOOKING_EVENTS.SHOOTING) return;
    playChime('broadcast');
    toast(
      <div className="text-xs leading-relaxed">
        <p className="font-display text-sm font-bold">🔐 OTP verified: {payload.code} shoot started</p>
        <p className="opacity-80">
          {payload.creatorName || 'Partner'} with {payload.clientName || 'customer'} at <strong>{formatTime(payload.startedAt)}</strong>
          {payload.endsAt ? ` • ends ${formatTime(payload.endsAt)}` : ''}
          {payload.durationMinutes ? ` (${formatMinutes(payload.durationMinutes)})` : ''}
        </p>
      </div>,
      { id: `admin-shoot-${payload.bookingId}`, duration: 8000 }
    );
  });
  return null;
}
