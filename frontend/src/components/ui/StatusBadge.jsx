import { STATUS_META } from '../../utils/bookingStatus';

export default function StatusBadge({ status, long = false, pulse = false }) {
  const meta = STATUS_META[status] || STATUS_META.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {long ? meta.label : meta.short}
    </span>
  );
}
