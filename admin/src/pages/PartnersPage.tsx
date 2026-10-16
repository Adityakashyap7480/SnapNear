import { useMemo, useState } from 'react';
import { Briefcase, Camera, Radio, Star, Video, Wallet } from 'lucide-react';
import Card, { EmptyState, StatCard } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { SearchInput } from '../components/ui/FormField';
import { PageLoader } from '../components/ui/Spinner';
import PageHeader from '../components/admin/PageHeader';
import BookingsLedger from '../components/admin/BookingsLedger';
import AccountStatusBadge from '../components/admin/AccountStatusBadge';
import AccountActions from '../components/admin/AccountActions';
import { adminApi } from '../api/services';
import { BOOKING_FILTER } from '../config/constants';
import { useCatalog } from '../context/CatalogContext';
import useAsync from '../hooks/useAsync';
import useAdminLive from '../hooks/useAdminLive';
import type { AdminPartner } from '../types';
import { formatDate, formatINR } from '../utils/format';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'Offline' },
] as const;

type DutyFilter = (typeof FILTERS)[number]['id'];

function ServiceBadges({ services }: { services: string[] }) {
  return (
    <div className="flex gap-1">
      {services.includes('photo') && (
        <span className="flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
          <Camera className="h-3 w-3" /> Photo
        </span>
      )}
      {services.includes('video') && (
        <span className="flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-violet">
          <Video className="h-3 w-3" /> Video
        </span>
      )}
    </div>
  );
}

function DutyBadge({ partner }: { partner: AdminPartner }) {
  if (partner.active > 0) return <Badge tone="indigo">On a shoot</Badge>;
  if (partner.isOnline) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-emerald-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Online
      </span>
    );
  }
  return <span className="shrink-0 text-[11px] font-semibold text-slate-400">Offline</span>;
}

export default function PartnersPage() {
  const { partnerPct, platformPct } = useCatalog();
  const { data: partners, loading, reload } = useAsync(() => adminApi.creators().then((r) => r.creators), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DutyFilter>('all');
  useAdminLive(() => reload());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (partners || []).filter((c) => {
      if (filter === 'online' && !c.isOnline) return false;
      if (filter === 'offline' && c.isOnline) return false;
      return !q || [c.name, c.email, c.phone, c.city].some((v) => v?.toLowerCase().includes(q));
    });
  }, [partners, query, filter]);

  if (loading || !partners) return <PageLoader label="Loading partners..." />;

  const online = partners.filter((c) => c.isOnline).length;
  const activeJobs = partners.reduce((n, c) => n + c.active, 0);
  const paidOut = partners.reduce((n, c) => n + c.earnings, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Partners"
        title="Partners & their shoots"
        subtitle="Photographers & videographers who accept bookings and travel to the customer's location."
        onRefresh={() => reload()}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Registered Partners" value={partners.length} hint="SnapNear Partner accounts" />
        <StatCard tone="emerald" icon={Radio} label="Online Now" value={online} hint="Receiving live pings" />
        <StatCard tone="violet" icon={Camera} label="Shoots In Progress" value={activeJobs} hint="Accepted & ongoing" />
        <StatCard tone="amber" icon={Wallet} label="Partner Earnings" value={formatINR(paidOut, { fixed: true })} hint={`${partnerPct} of completed shoots`} />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">All Partners</h3>
            <p className="text-xs text-slate-500">Duty status, jobs and earnings</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, city..."
              className="sm:w-64"
            />
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
          {filtered.length === 0 ? (
            <li className="md:col-span-2">
              <EmptyState icon={Briefcase} title="No partners found" description="Partners appear here as soon as they sign up." />
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-slate-900">
                        <span className="truncate">{c.name}</span>
                        <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-amber-600">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          {c.rating.toFixed(1)}
                        </span>
                      </p>
                      <DutyBadge partner={c} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {c.phone} &bull; {c.city || '—'} &bull; {c.experienceYears}+ yrs
                    </p>
                    <div className="mt-1.5">
                      <ServiceBadges services={c.services} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-center min-[400px]:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Accepted</p>
                    <p className="text-sm font-bold text-slate-900">{c.accepted}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Done</p>
                    <p className="text-sm font-bold text-slate-900">{c.completed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase">Earned {partnerPct}</p>
                    <p className="text-xs font-bold text-emerald-600">{formatINR(c.earnings)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-brand-orange uppercase">Platform</p>
                    <p className="text-xs font-bold text-brand-orange">{formatINR(c.platformFee)}</p>
                  </div>
                </div>
                <div className="min-h-3 flex-1" />
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <AccountStatusBadge status={c.accountStatus} reason={c.statusReason} />
                    {c.statusReason && <p className="mt-1 truncate text-[10px] text-slate-500">Reason: {c.statusReason}</p>}
                  </div>
                  <AccountActions user={c} kind="partner" onChanged={reload} />
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-[10px] font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-3 py-2.5">Partner</th>
                <th className="px-3 py-2.5">Skills</th>
                <th className="px-3 py-2.5">Duty</th>
                <th className="px-3 py-2.5 text-center">Accepted</th>
                <th className="px-3 py-2.5 text-center">Done</th>
                <th className="px-3 py-2.5 text-right text-emerald-700">Earnings {partnerPct}</th>
                <th className="px-3 py-2.5 text-right text-brand-orange">Platform {platformPct}</th>
                <th className="px-3 py-2.5">Joined</th>
                <th className="px-3 py-2.5">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon={Briefcase} title="No partners found" description="Partners appear here as soon as they sign up." />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                            {c.name}
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              {c.rating.toFixed(1)}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {c.phone} &bull; {c.city || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <ServiceBadges services={c.services} />
                        <span className="text-[11px] font-semibold text-slate-700">{c.experienceYears}+ yrs</span>
                      </div>
                      <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-slate-400" title={c.gear}>
                        {c.gear || '—'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <DutyBadge partner={c} />
                    </td>
                    <td className="px-3 py-3 text-center">{c.accepted}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-900">{c.completed}</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-600">{formatINR(c.earnings, { fixed: true })}</td>
                    <td className="px-3 py-3 text-right font-bold text-brand-orange">{formatINR(c.platformFee, { fixed: true })}</td>
                    <td className="px-3 py-3">{formatDate(c.joinedAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <AccountStatusBadge status={c.accountStatus} reason={c.statusReason} />
                        <AccountActions user={c} kind="partner" onChanged={reload} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BookingsLedger
        title="Partner Requests & Jobs"
        subtitle="Open requests waiting for a partner and shoots in progress"
        initialStatus={BOOKING_FILTER.ACTIVE}
        tabs={[
          { id: BOOKING_FILTER.ACTIVE, label: 'Live / Active' },
          { id: BOOKING_FILTER.SEARCHING, label: 'Waiting for Partner' },
          { id: BOOKING_FILTER.COMPLETED, label: 'Completed' },
        ]}
      />
    </div>
  );
}
