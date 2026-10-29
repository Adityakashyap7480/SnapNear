import { useEffect, useState } from 'react';
import { Activity, IndianRupee, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { EmptyState, StatCard } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { SearchInput } from '../components/ui/FormField';
import { PageLoader } from '../components/ui/Spinner';
import TablePagination, { type PageSize } from '../components/ui/TablePagination';
import PageHeader from '../components/admin/PageHeader';
import BookingsLedger from '../components/admin/BookingsLedger';
import AccountCell from '../components/admin/AccountCell';
import AccountFilterBar, { type AccountFilter } from '../components/admin/AccountFilterBar';
import EmailCell from '../components/admin/EmailCell';
import LocationCell from '../components/admin/LocationCell';
import { adminApi } from '../api/services';
import useAdminLive from '../hooks/useAdminLive';
import useDebouncedValue from '../hooks/useDebouncedValue';
import type { AdminCustomer, ApiFailure, Pagination } from '../types';
import { formatDate, formatINR, timeAgo } from '../utils/format';

export default function CustomersPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim());
  const [account, setAccount] = useState<AccountFilter>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(20);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [summary, setSummary] = useState({ total: 0, bookings: 0, active: 0, spent: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [debounced, limit, account]);

  const load = async () => {
    try {
      const res = await adminApi.clients({ q: debounced, page, limit, account });
      setCustomers(res.clients);
      setPagination(res.pagination);
      setSummary(res.summary);
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [debounced, page, limit, account]); // eslint-disable-line react-hooks/exhaustive-deps

  useAdminLive(() => load());

  if (loading && customers.length === 0) return <PageLoader label="Loading customers..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="Customers & their bookings"
        subtitle="Everyone who books a photographer or videographer to their doorstep. Use Deleted to see who closed their account."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered Customers" value={summary.total} hint="Book a Shoot accounts" />
        <StatCard tone="amber" icon={User} label="Total Bookings" value={summary.bookings} hint="Across all customers" />
        <StatCard tone="violet" icon={Activity} label="Live Bookings" value={summary.active} hint="Searching or in progress" />
        <StatCard tone="emerald" icon={IndianRupee} label="Customer Spend" value={formatINR(summary.spent)} hint="Completed shoots" />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">All Customers</h3>
            <p className="text-xs leading-snug text-slate-500">
              Name stays visible after self-delete so you know who left
              {summary.deleted > 0 ? ` · ${summary.deleted} deleted` : ''}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <AccountFilterBar value={account} onChange={setAccount} deletedCount={summary.deleted} />
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, location..."
              className="sm:w-64"
            />
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
          {customers.length === 0 ? (
            <li className="md:col-span-2">
              <EmptyState
                icon={Users}
                title="No customers found"
                description={
                  account === 'deleted'
                    ? 'Nobody has deleted their customer account yet.'
                    : 'Customers appear here as soon as they sign up.'
                }
              />
            </li>
          ) : (
            customers.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-snug font-bold text-slate-900">{c.name}</p>
                    <EmailCell email={c.email} deleted={Boolean(c.deletedAt)} className="text-[11px] text-slate-500" />
                    <p className="text-[11px] leading-snug text-slate-500">{c.phone}</p>
                    <div className="mt-1.5">
                      <LocationCell city={c.city} address={c.address} latitude={c.latitude} longitude={c.longitude} />
                    </div>
                  </div>
                  {c.active > 0 && <Badge tone="amber">{c.active} live</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Bookings</p>
                    <p className="text-sm font-bold text-slate-900">{c.bookings}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Completed</p>
                    <p className="text-sm font-bold text-slate-900">{c.completed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Spent</p>
                    <p className="text-sm font-bold text-slate-900">{formatINR(c.spent)}</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-slate-400">
                  Joined {formatDate(c.joinedAt)}
                  {c.lastBookingAt && <> · Last booking {timeAgo(c.lastBookingAt)}</>}
                </p>
                <div className="min-h-3 flex-1" />
                <div className="border-t border-slate-100 pt-3">
                  <AccountCell user={c} kind="customer" onChanged={load} />
                  {c.statusReason && <p className="mt-1 truncate text-[10px] text-slate-500">Reason: {c.statusReason}</p>}
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
              <tr>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Current Location</th>
                <th className="px-3 py-3 text-center">Bookings</th>
                <th className="px-3 py-3 text-center">Live</th>
                <th className="px-3 py-3 text-center">Completed</th>
                <th className="px-3 py-3 text-right">Total Spent</th>
                <th className="px-3 py-3">Last Booking</th>
                <th className="px-3 py-3">Joined</th>
                <th className="px-3 py-3">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState icon={Users} title="No customers found" description="Customers appear here as soon as they sign up." />
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="align-middle hover:bg-slate-50/80">
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0 max-w-[12rem]">
                          <p className="truncate leading-snug font-semibold text-slate-800">{c.name}</p>
                          <EmailCell email={c.email} deleted={Boolean(c.deletedAt)} className="mt-0.5 text-[10px] text-slate-400" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <p className="leading-snug text-slate-700">{c.phone}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-slate-400">{c.city || '—'}</p>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <LocationCell compact city={c.city} address={c.address} latitude={c.latitude} longitude={c.longitude} />
                    </td>
                    <td className="px-3 py-3.5 align-middle text-center font-bold text-slate-900">{c.bookings}</td>
                    <td className="px-3 py-3.5 align-middle text-center">{c.active > 0 ? <Badge tone="amber">{c.active}</Badge> : '—'}</td>
                    <td className="px-3 py-3.5 align-middle text-center">{c.completed}</td>
                    <td className="px-3 py-3.5 align-middle text-right font-bold text-slate-900">{formatINR(c.spent)}</td>
                    <td className="px-3 py-3.5 align-middle leading-snug">{c.lastBookingAt ? timeAgo(c.lastBookingAt) : '—'}</td>
                    <td className="px-3 py-3.5 align-middle leading-snug">{formatDate(c.joinedAt)}</td>
                    <td className="px-3 py-3.5 align-middle">
                      <AccountCell user={c} kind="customer" onChanged={load} />
                    </td>
                  </tr>
                ))
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
          label="customers"
        />
      </Card>

      <BookingsLedger title="Customer Bookings" subtitle="Every shoot request placed through Book a Shoot" />
    </div>
  );
}
