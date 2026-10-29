export const ACCOUNT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'deleted', label: 'Deleted' },
] as const;

export type AccountFilter = (typeof ACCOUNT_FILTERS)[number]['id'];

interface AccountFilterBarProps {
  value: AccountFilter;
  onChange: (value: AccountFilter) => void;
  deletedCount?: number;
}

/** Account lifecycle chips for Customers / Partners (includes self-deleted). */
export default function AccountFilterBar({ value, onChange, deletedCount = 0 }: AccountFilterBarProps) {
  return (
    <div className="no-scrollbar flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1">
      {ACCOUNT_FILTERS.map((f) => {
        const active = value === f.id;
        const showCount = f.id === 'deleted' && deletedCount > 0;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              active
                ? f.id === 'deleted'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {f.label}
            {showCount && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {deletedCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
