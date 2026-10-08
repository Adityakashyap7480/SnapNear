import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Receipt, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { EmptyState } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Spinner from '../ui/Spinner';
import { SearchInput } from '../ui/FormField';
import { adminApi } from '../../api/services';
import useAdminLive from '../../hooks/useAdminLive';
import { isActive } from '../../utils/bookingStatus';
import { formatDate, formatDateTime, formatINR } from '../../utils/format';

const DEFAULT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Live / Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function BookingsLedger({
  title = 'Live Commission Ledger',
  subtitle = 'Every booking: who booked (customer) and who shot it (partner)',
  initialStatus = 'all',
  tabs = DEFAULT_TABS,
  pageSize = 15,
}) {
  const [status, setStatus] = useState(initialStatus);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ bookings: [], pagination: { total: 0, pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => setPage(1), [status, debounced]);

  const load = async () => {
    try {
      const res = await adminApi.bookings({ status, q: debounced, page, limit: pageSize });
      setResult(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status, debounced, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useAdminLive(() => load());

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking ${b.code} for ${b.client.name}?`)) return;
    setCancellingId(b.id);
    try {
      await adminApi.cancelBooking(b.id);
      toast.success(`${b.code} cancelled`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const { bookings, pagination } = result;

  const cancelButton = (b) =>
    isActive(b.status) && (
      <button
        type="button"
        onClick={() => cancel(b)}
        disabled={cancellingId === b.id}
        title="Cancel booking"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    );

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {tabs.length > 1 && (
            <div className="no-scrollbar flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatus(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    status === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, name or phone..."
            className="sm:w-64"
          />
        </div>
      </div>

      <div className="mt-4 xl:hidden">
        {loading && bookings.length === 0 ? (
          <div className="py-10">
            <Spinner className="mx-auto h-6 w-6 text-brand-orange" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={Receipt} title="No bookings found" description="Try a different filter or search term." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bookings.map((b) => {
              const counted = b.status === 'completed';
              return (
                <li key={b.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{b.code}</p>
                      <p className="text-[11px] text-slate-500">
                        {b.serviceLabel} ({b.durationLabel}) &bull; {b.occasion}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Booked {formatDateTime(b.createdAt)} &bull; Shoot {formatDate(b.shootDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge status={b.status} pulse={b.status === 'searching'} />
                      {cancelButton(b)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer</p>
                      <p className="truncate font-semibold text-slate-800">{b.client.name}</p>
                      <p className="text-[10px] text-slate-400">{b.client.phone}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Partner</p>
                      {b.creator ? (
                        <>
                          <p className="truncate font-semibold text-slate-800">{b.creator.name}</p>
                          <p className="text-[10px] text-slate-400">{b.creator.phone}</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          {b.status === 'searching' ? 'Awaiting...' : '—'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Gross</p>
                      <p className="text-xs font-bold text-slate-900">{formatINR(b.total)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase">Partner 80%</p>
                      <p className={`text-xs font-semibold ${counted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formatINR(b.creatorPayout, { fixed: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-brand-orange uppercase">Platform 20%</p>
                      <p className={`text-xs font-bold ${counted ? 'text-brand-orange' : 'text-slate-400'}`}>
                        {formatINR(b.platformFee, { fixed: true })}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-slate-100 text-[10px] font-semibold whitespace-nowrap text-slate-700 uppercase">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Partner (Photographer)</th>
              <th className="p-3">Session</th>
              <th className="p-3">Shoot Date</th>
              <th className="p-3 text-right">Gross</th>
              <th className="p-3 text-right text-emerald-700">Partner 80%</th>
              <th className="p-3 text-right text-brand-orange">Platform 20%</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {loading && bookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10 text-center">
                  <Spinner className="mx-auto h-6 w-6 text-brand-orange" />
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState icon={Receipt} title="No bookings found" description="Try a different filter or search term." />
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const counted = b.status === 'completed';
                return (
                  <tr key={b.id} className="transition hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{b.code}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(b.createdAt)}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{b.client.name}</p>
                      <p className="text-[10px] text-slate-400">{b.client.phone}</p>
                    </td>
                    <td className="p-3">
                      {b.creator ? (
                        <>
                          <p className="font-semibold text-slate-800">{b.creator.name}</p>
                          <p className="text-[10px] text-slate-400">{b.creator.phone}</p>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {b.status === 'searching' ? 'Awaiting partner...' : '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="text-slate-800">
                        {b.serviceLabel} ({b.durationLabel})
                      </p>
                      <p className="max-w-[180px] truncate text-[10px] text-slate-400" title={b.address}>
                        {b.occasion}
                      </p>
                    </td>
                    <td className="p-3 whitespace-nowrap">{formatDate(b.shootDate)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatINR(b.total)}</td>
                    <td className={`p-3 text-right font-semibold ${counted ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {formatINR(b.creatorPayout, { fixed: true })}
                    </td>
                    <td className={`p-3 text-right font-bold ${counted ? 'text-brand-orange' : 'text-slate-400'}`}>
                      {formatINR(b.platformFee, { fixed: true })}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={b.status} pulse={b.status === 'searching'} />
                    </td>
                    <td className="p-3 text-right">{cancelButton(b)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {pagination.total} booking{pagination.total === 1 ? '' : 's'} &bull; Revenue counted on completed shoots only
        </span>
        {pagination.pages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-semibold text-slate-700">
              {page} / {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
