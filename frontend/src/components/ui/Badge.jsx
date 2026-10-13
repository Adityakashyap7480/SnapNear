const TONES = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  indigo: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  orange: 'bg-orange-50 text-brand-orange ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  brand: 'bg-brand-orange text-white ring-orange-300',
};

const SIZES = {
  sm: 'gap-1 px-2 py-0.5 text-[10px]',
  md: 'gap-1.5 px-2.5 py-0.5 text-[11px]',
};

/**
 * Small rounded pill used for statuses and counts.
 * `colorClass` overrides `tone` when the colours come from elsewhere (e.g. STATUS_META).
 */
export default function Badge({
  tone = 'slate',
  colorClass,
  icon: Icon,
  dot,
  pulse = false,
  ring = false,
  size = 'sm',
  className = '',
  title,
  children,
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center rounded-full font-bold whitespace-nowrap ${SIZES[size]} ${
        colorClass || TONES[tone]
      } ${ring ? 'ring-1 ring-inset' : ''} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} />}
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
