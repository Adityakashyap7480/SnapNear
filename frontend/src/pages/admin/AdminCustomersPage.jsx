import { useMemo, useState } from 'react';
import { Activity, IndianRupee, User, Users } from 'lucide-react';
import Card, { EmptyState, StatCard } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { SearchInput } from '../../components/ui/FormField';
import { PageLoader } from '../../components/ui/Spinner';
import PageHeader from '../../components/admin/PageHeader';
import BookingsLedger from '../../components/admin/BookingsLedger';
import AccountStatusBadge from '../../components/admin/AccountStatusBadge';
import AccountActions from '../../components/admin/AccountActions';
import { adminApi } from '../../api/services';
import useAsync from '../../hooks/useAsync';
import useAdminLive from '../../hooks/useAdminLive';
import { formatDate, formatINR, timeAgo } from '../../utils/format';

export default function AdminCustomersPage() {
  const { data: customers, loading, reload } = useAsync(() => adminApi.clients().then((r) => r.clients), []);
  const [query, setQuery] = useState('');
  useAdminLive(() => reload());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers || [];
    return (customers || []).filter((c) => [c.name, c.email, c.phone, c.city].some((v) => v?.toLowerCase().includes(q)));
  }, [customers, query]);

  if (loading || !customers) return <PageLoader label="Loading customers..." />;

  const totals = customers.reduce(
    (acc, c) => ({ bookings: acc.bookings + c.bookings, active: acc.active + c.active, spent: acc.spent + c.spent }),
    { bookings: 0, active: 0, spent: 0 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="Customers & their bookings"
        subtitle="Everyone who books a photographer or videographer to their doorstep."
        onRefresh={() => reload()}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered Customers" value={customers.length} hint="Book a Shoot accounts" />
        <StatCard tone="amber" icon={User} label="Total Bookings" value={totals.bookings} hint="Across all customers" />
        <StatCard tone="violet" icon={Activity} label="Live Bookings" value={totals.active} hint="Searching or in progress" />
        <StatCard tone="emerald" icon={IndianRupee} label="Customer Spend" value={formatINR(totals.spent)} hint="Completed shoots" />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">All Customers</h3>
            <p className="text-xs text-slate-500">Name, contact and booking activity</p>
          </div>
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, city..."
            className="sm:w-64"
          />
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
          {filtered.length === 0 ? (
            <li className="md:col-span-2">
              <EmptyState icon={Users} title="No customers found" description="Customers appear here as soon as they sign up." />
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{c.email}</p>
                    <p className="text-[11px] text-slate-500">
                      {c.phone} &bull; {c.city || '—'}
                    </p>
                  </div>
                  {c.active > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {c.active} live
                    </span>
                  )}
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
                <p className="mt-2 text-[10px] text-slate-400">
                  Joined {formatDate(c.joinedAt)}
                  {c.lastBookingAt && <> &bull; Last booking {timeAgo(c.lastBookingAt)}</>}
                </p>
                <div className="min-h-3 flex-1" />
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <AccountStatusBadge status={c.accountStatus} reason={c.statusReason} />
                    {c.statusReason && <p className="mt-1 truncate text-[10px] text-slate-500">Reason: {c.statusReason}</p>}
                  </div>
                  <AccountActions user={c} kind="customer" onChanged={reload} />
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-[10px] font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-3 py-2.5">Customer</th>
                <th className="px-3 py-2.5">Contact</th>
                <th className="px-3 py-2.5 text-center">Bookings</th>
                <th className="px-3 py-2.5 text-center">Live</th>
                <th className="px-3 py-2.5 text-center">Completed</th>
                <th className="px-3 py-2.5 text-right">Total Spent</th>
                <th className="px-3 py-2.5">Last Booking</th>
                <th className="px-3 py-2.5">Joined</th>
                <th className="px-3 py-2.5">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon={Users} title="No customers found" description="Customers appear here as soon as they sign up." />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-slate-700">{c.phone}</p>
                      <p className="text-[10px] text-slate-400">{c.city || '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-900">{c.bookings}</td>
                    <td className="px-3 py-3 text-center">
                      {c.active > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{c.active}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">{c.completed}</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900">{formatINR(c.spent)}</td>
                    <td className="px-3 py-3">{c.lastBookingAt ? timeAgo(c.lastBookingAt) : '—'}</td>
                    <td className="px-3 py-3">{formatDate(c.joinedAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <AccountStatusBadge status={c.accountStatus} reason={c.statusReason} />
                        <AccountActions user={c} kind="customer" onChanged={reload} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BookingsLedger title="Customer Bookings" subtitle="Every shoot request placed through Book a Shoot" />
    </div>
  );
}
