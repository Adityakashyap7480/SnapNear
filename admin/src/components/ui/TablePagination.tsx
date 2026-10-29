import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination } from '../../types';

export const PAGE_SIZE_OPTIONS = [10, 20, 40, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface TablePaginationProps {
  pagination: Pick<Pagination, 'page' | 'limit' | 'total' | 'pages'>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: PageSize) => void;
  label?: string;
}

export default function TablePagination({
  pagination,
  onPageChange,
  onLimitChange,
  label = 'rows',
}: TablePaginationProps) {
  const { page, limit, total, pages } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
      <p>
        {total === 0 ? (
          <>No {label}</>
        ) : (
          <>
            Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> {label}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span className="font-medium text-slate-500">Per page</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value) as PageSize)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3.5rem] text-center font-semibold text-slate-700">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
