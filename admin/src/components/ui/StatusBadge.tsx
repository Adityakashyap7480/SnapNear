import Badge from './Badge';
import type { BookingStatus } from '../../config/constants';
import { STATUS_META } from '../../utils/bookingStatus';

export default function StatusBadge({ status, long = false, pulse = false }: { status: BookingStatus; long?: boolean; pulse?: boolean }) {
  const meta = STATUS_META[status] || STATUS_META.cancelled;
  return (
    <Badge colorClass={meta.badge} dot={meta.dot} pulse={pulse} ring size="md">
      {long ? meta.label : meta.short}
    </Badge>
  );
}
