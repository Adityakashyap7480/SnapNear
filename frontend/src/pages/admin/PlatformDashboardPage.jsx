import { Activity, Briefcase, CalendarCheck, IndianRupee, Landmark, TrendingUp, Users, Wallet } from 'lucide-react';
import Card, { StatCard } from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import PageHeader from '../../components/admin/PageHeader';
import BookingsLedger from '../../components/admin/BookingsLedger';
import { adminApi } from '../../api/services';
import useAsync from '../../hooks/useAsync';
import useAdminLive from '../../hooks/useAdminLive';
import { formatINR } from '../../utils/format';

function RevenueChart({ days }) {
  const max = Math.max(...days.map((d) => d.gross), 1);
  return (
    <div className="flex h-40 items-end gap-1.5 sm:h-44 sm:gap-3">
      {days.map((d) => {
        const grossH = (d.gross / max) * 100;
        const platformH = (d.platform / max) * 100;
        const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' });
        return (
          <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div className="relative flex h-full w-full items-end justify-center">
              <div className="absolute -top-1 hidden -translate-y-full rounded-lg bg-slate-900 px-2 py-1 text-center text-[10px] whitespace-nowrap text-white shadow-lg group-hover:block">
                {formatINR(d.gross)} gross
                <br />
                <span className="text-brand-yellow">{formatINR(d.platform, { fixed: true })} platform</span>
              </div>
              <div
                className="relative w-full max-w-[42px] overflow-hidden rounded-t-lg bg-emerald-100 transition-all duration-700"
                style={{ height: `${Math.max(grossH, 2)}%` }}
              >
                <div
                  className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-brand-orange to-brand-yellow"
                  style={{ height: `${grossH ? (platformH / grossH) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function PlatformDashboardPage() {
  const { data: overview, loading, reload } = useAsync(() => adminApi.overview().then((r) => r.overview), []);
  useAdminLive(() => reload());

  if (loading || !overview) return <PageLoader label="Loading Platform Dashboard..." />;

  const o = overview;
  const take = o.gross ? Math.round((o.platformTotal / o.gross) * 100) : 20;
  const weekPlatform = o.last7Days.reduce((n, d) => n + d.platform, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform 20%"
        title="Platform Financial Dashboard"
        subtitle="Your 20% platform fee vs 80% partner payouts across every customer booking, live."
        onRefresh={() => reload()}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard tone="amber" icon={IndianRupee} label="Gross Booking Volume" value={formatINR(o.gross, { fixed: true })} hint={`${o.completedCount} completed shoots • total customer payments`} />
        <StatCard tone="emerald" icon={Wallet} label="Partner Payouts (80%)" value={formatINR(o.creatorTotal, { fixed: true })} hint="Partners' share of completed shoots" />
        <StatCard tone="navy" icon={Landmark} label="Platform Retained (20%)" value={formatINR(o.platformTotal, { fixed: true })} hint={`Your net revenue • ${take}% effective take`} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Today's Platform Fee" value={formatINR(o.today.platform, { fixed: true })} hint={`${o.today.count} shoots • ${formatINR(o.today.gross)} gross`} />
        <StatCard icon={Activity} label="Live Pipeline" value={formatINR(o.pipeline.value)} hint={`${o.pipeline.count} active booking(s) in progress`} />
        <StatCard icon={Users} label="Customers" value={o.users.clients} hint={`${o.totalBookings} total bookings`} />
        <StatCard icon={Briefcase} label="Partners" value={o.users.creators} hint={`${o.users.onlineCreators} online right now`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 p-4 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Last 7 Days Revenue</h3>
              <p className="text-xs text-slate-500">
                Platform earned <span className="font-bold text-brand-orange">{formatINR(weekPlatform, { fixed: true })}</span> this week
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-200" /> Partner 80%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-brand-orange" /> Platform 20%
              </span>
            </div>
          </div>
          <RevenueChart days={o.last7Days} />
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-slate-400" />
            <h3 className="font-display text-base font-bold text-slate-900">Booking Funnel</h3>
          </div>
          <ul className="space-y-3">
            {Object.entries(o.byStatus).map(([status, s]) => (
              <li key={status} className="flex items-center justify-between gap-2">
                <StatusBadge status={status} long />
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{s.count}</p>
                  <p className="text-[10px] text-slate-400">{formatINR(s.value)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <BookingsLedger />
    </div>
  );
}
