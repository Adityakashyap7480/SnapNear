import { useEffect, useState } from 'react';
import { ArrowRight, Receipt, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { EmptyState } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Spinner from '../ui/Spinner';
import PaymentBadge from '../PaymentBadge';
import { SearchInput } from '../ui/FormField';
import TablePagination, { type PageSize } from '../ui/TablePagination';
import { adminApi } from '../../api/services';
import { useCatalog } from '../../context/CatalogContext';
import useAdminLive from '../../hooks/useAdminLive';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { BOOKING_FILTER, type BookingFilter } from '../../config/constants';
import type { ApiFailure, Booking, Pagination } from '../../types';
import { isActive, isCompleted, isSearching } from '../../utils/bookingStatus';
import { formatDate, formatDateTime, formatINR, formatTime } from '../../utils/format';

function OtpStartNote({ booking }: { booking: Booking }) {
  if (!booking.startedAt) return null;
  return (
    <p
      className="mt-0.5 flex items-center gap-1 text-[10px] leading-snug font-semibold text-emerald-700"
      title="Shoot started when the partner entered the customer's OTP"
    >
      <ShieldCheck className="h-3 w-3 shrink-0" />
      <span>
        OTP {formatTime(booking.startedAt)}
        {booking.endsAt && <span className="font-normal text-slate-400"> · ends {formatTime(booking.endsAt)}</span>}
      </span>
    </p>
  );
}

export interface LedgerTab {
  id: BookingFilter;
  label: string;
}

const DEFAULT_TABS: LedgerTab[] = [
  { id: BOOKING_FILTER.ALL, label: 'All' },
  { id: BOOKING_FILTER.ACTIVE, label: 'Live / Active' },
  { id: BOOKING_FILTER.COMPLETED, label: 'Completed' },
  { id: BOOKING_FILTER.UNPAID, label: 'Payment Due' },
  { id: BOOKING_FILTER.CANCELLED, label: 'Cancelled' },
];

interface BookingsLedgerProps {
  title?: string;
  subtitle?: string;
  initialStatus?: BookingFilter;
  tabs?: LedgerTab[];
  pageSize?: PageSize;
}

export default function BookingsLedger({
  title = 'Live Commission Ledger',
  subtitle = 'Every booking: who booked (customer) and who shot it (partner)',
  initialStatus = BOOKING_FILTER.ALL,
  tabs = DEFAULT_TABS,
  pageSize = 20,
}: BookingsLedgerProps) {
  const { partnerPct, platformPct } = useCatalog();
  const [status, setStatus] = useState<BookingFilter>(initialStatus);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(pageSize);
  const [result, setResult] = useState<{ bookings: Booking[]; pagination: Pagination }>({
    bookings: [],
    pagination: { page: 1, limit: pageSize, total: 0, pages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => setPage(1), [status, debounced, limit]);

  const load = async () => {
    try {
      const res = await adminApi.bookings({ status, q: debounced, page, limit });
      setResult(res);
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [status, debounced, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useAdminLive(() => load());

  const cancel = async (b: Booking) => {
    if (!window.confirm(`Cancel booking ${b.code} for ${b.client.name}?`)) return;
    setCancellingId(b.id);
    try {
      await adminApi.cancelBooking(b.id);
      toast.success(`${b.code} cancelled`);
      void load();
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setCancellingId(null);
    }
  };

  const { bookings, pagination } = result;

  const statusCell = (b: Booking) => (
    <div className="flex items-start gap-1.5">
      <div className="flex min-w-0 flex-col items-start gap-1">
        <StatusBadge status={b.status} pulse={isSearching(b.status)} />
        <PaymentBadge payment={b.payment} />
      </div>
      {isActive(b.status) && (
        <button
          type="button"
          onClick={() => cancel(b)}
          disabled={cancellingId === b.id}
          title="Cancel booking"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs leading-snug text-slate-500">{subtitle}</p>
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
              const counted = isCompleted(b.status);
              return (
                <li key={b.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm leading-snug font-bold text-slate-900">{b.code}</p>
                      <p className="text-[11px] leading-snug text-slate-500">
                        {b.serviceLabel} ({b.durationLabel}) · {b.occasion}
                      </p>
                      <p className="text-[10px] leading-snug text-slate-400">
                        Booked {formatDateTime(b.createdAt)} · Shoot {formatDate(b.shootDate)}
                      </p>
                      <OtpStartNote booking={b} />
                    </div>
                    <div className="shrink-0">{statusCell(b)}</div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer</p>
                      <p className="truncate leading-snug font-semibold text-slate-800">{b.client.name}</p>
                      <p className="text-[10px] leading-snug text-slate-400">{b.client.phone}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Partner</p>
                      {b.creator ? (
                        <>
                          <p className="truncate leading-snug font-semibold text-slate-800">{b.creator.name}</p>
                          <p className="text-[10px] leading-snug text-slate-400">{b.creator.phone}</p>
                        </>
                      ) : (
                        <p className="text-[11px] italic text-slate-400">
                          {isSearching(b.status) ? 'Awaiting...' : '—'}
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
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase">Partner {partnerPct}</p>
                      <p className={`text-xs font-semibold ${counted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formatINR(b.creatorPayout, { fixed: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-brand-orange uppercase">Platform {platformPct}</p>
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
        <table className="w-full table-fixed text-left text-xs">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
            <tr>
              <th className="px-3 py-3">Order ID</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Partner</th>
              <th className="px-3 py-3">Session</th>
              <th className="px-3 py-3">Shoot Date</th>
              <th className="px-3 py-3 text-right">Gross</th>
              <th className="px-3 py-3 text-right text-emerald-700">Partner {partnerPct}</th>
              <th className="px-3 py-3 text-right text-brand-orange">Platform {platformPct}</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {loading && bookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center">
                  <Spinner className="mx-auto h-6 w-6 text-brand-orange" />
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState icon={Receipt} title="No bookings found" description="Try a different filter or search term." />
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const counted = isCompleted(b.status);
                return (
                  <tr key={b.id} className="align-middle transition hover:bg-slate-50/80">
                    <td className="px-3 py-3.5 align-middle">
                      <p className="truncate leading-snug font-semibold text-slate-800">{b.code}</p>
                      <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-400">{formatDateTime(b.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <p className="truncate leading-snug font-semibold text-slate-800">{b.client.name}</p>
                      <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-400">{b.client.phone || '—'}</p>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      {b.creator ? (
                        <>
                          <p className="truncate leading-snug font-semibold text-slate-800">{b.creator.name}</p>
                          <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-400">{b.creator.phone || '—'}</p>
                        </>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">
                          {isSearching(b.status) ? 'Awaiting partner...' : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <p className="truncate leading-snug text-slate-800">
                        {b.serviceLabel} ({b.durationLabel})
                      </p>
                      <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-400" title={b.occasion}>
                        {b.occasion}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <p className="truncate leading-snug text-slate-800">{formatDate(b.shootDate)}</p>
                      <OtpStartNote booking={b} />
                    </td>
                    <td className="px-3 py-3.5 align-middle text-right leading-snug font-bold whitespace-nowrap text-slate-900">
                      {formatINR(b.total)}
                    </td>
                    <td
                      className={`px-3 py-3.5 align-middle text-right leading-snug font-semibold whitespace-nowrap ${
                        counted ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {formatINR(b.creatorPayout, { fixed: true })}
                    </td>
                    <td
                      className={`px-3 py-3.5 align-middle text-right leading-snug font-bold whitespace-nowrap ${
                        counted ? 'text-brand-orange' : 'text-slate-400'
                      }`}
                    >
                      {formatINR(b.platformFee, { fixed: true })}
                    </td>
                    <td className="px-3 py-3.5 align-middle">{statusCell(b)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(next) => {
          setLimit(next);
          setPage(1);
        }}
        label="bookings"
      />
      <p className="mt-1 text-[11px] text-slate-400">Revenue counted on completed shoots only.</p>
    </Card>
  );
}
