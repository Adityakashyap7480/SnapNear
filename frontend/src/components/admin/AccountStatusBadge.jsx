const STYLES = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  suspended: { label: 'Suspended', className: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  blocked: { label: 'Blocked', className: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

export default function AccountStatusBadge({ status = 'active', reason }) {
  const s = STYLES[status] || STYLES.active;
  return (
    <span
      title={reason ? `Reason: ${reason}` : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ring-1 ${s.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
