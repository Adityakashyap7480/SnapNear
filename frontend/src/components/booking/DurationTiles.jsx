import { formatINR } from '../../utils/format';

export default function DurationTiles({ tiers = [], value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      {tiers.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`min-w-0 rounded-xl border p-2.5 text-left transition sm:p-3 ${
              selected
                ? 'border-brand-orange bg-orange-50/70 text-slate-900 shadow-sm ring-1 ring-brand-orange'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-1">
              <span className="text-xs font-bold">{t.label}</span>
              <span className="text-sm font-black text-slate-900">{formatINR(t.total)}</span>
            </div>
            <p className="truncate text-[10px] text-slate-500">{t.subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-1 border-t border-slate-100 pt-1 text-[9px]">
              <span className="font-semibold text-emerald-700">Partner {formatINR(t.creatorPayout)}</span>
              <span className="text-slate-400">20% fee</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
