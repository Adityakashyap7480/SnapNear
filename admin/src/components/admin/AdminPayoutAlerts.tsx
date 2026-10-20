import toast from 'react-hot-toast';
import { useSocketEvent } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../config/events';
import type { AdminUpdate } from '../../types';
import { formatINR } from '../../utils/format';
import { playBroadcastChime } from '../../utils/sound';

const PAYOUT_REQUESTED = 'payout:requested';

/** Owner-wide alert (any admin page) when a partner taps "Request Payout" in their Wallet. */
export default function AdminPayoutAlerts() {
  useSocketEvent<AdminUpdate>(SOCKET_EVENTS.ADMIN_UPDATE, (payload) => {
    if (payload.event !== PAYOUT_REQUESTED) return;
    playBroadcastChime();
    toast(
      <div className="text-xs leading-relaxed">
        <p className="font-display text-sm font-bold">💸 Payout requested{payload.amount ? `: ${formatINR(payload.amount, { fixed: true })}` : ''}</p>
        <p className="opacity-80">
          {payload.creatorName || 'A partner'} asked for a payout. Open <strong>Payouts</strong> to send it and mark it paid.
        </p>
      </div>,
      { id: `admin-payout-${payload.requestId || payload.creatorId || 'new'}`, duration: 9000 }
    );
  });
  return null;
}
