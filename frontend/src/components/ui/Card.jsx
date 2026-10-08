export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'bg-white border-slate-200 text-slate-900',
    amber: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-slate-900',
    emerald: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
    navy: 'bg-gradient-to-br from-slate-900 to-brand-navy border-slate-800 text-brand-yellow shadow-md',
    violet: 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 text-brand-violet',
  };
  const isDark = tone === 'navy';

  return (
    <div className={`min-w-0 rounded-2xl border p-3.5 sm:p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[10px] font-bold tracking-wider uppercase sm:text-[11px] ${isDark ? 'text-amber-300' : 'text-slate-500'}`}
        >
          {label}
        </span>
        {Icon && <Icon className={`h-4 w-4 shrink-0 ${isDark ? 'text-amber-300' : 'text-slate-400'}`} />}
      </div>
      <p className="mt-1.5 font-display text-lg font-black tracking-tight break-words min-[400px]:text-xl sm:text-2xl">
        {value}
      </p>
      {hint && <p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
