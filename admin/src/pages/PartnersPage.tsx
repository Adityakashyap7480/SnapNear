import { useEffect, useState } from 'react';
import { Briefcase, Camera, Radio, Star, Video, Wallet } from 'lucide-react';
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
import LocationCell from '../components/admin/LocationCell';
import { adminApi } from '../api/services';
import { BOOKING_FILTER } from '../config/constants';
import { useCatalog } from '../context/CatalogContext';
import useAdminLive from '../hooks/useAdminLive';
import useDebouncedValue from '../hooks/useDebouncedValue';
import type { AdminPartner, ApiFailure, Pagination } from '../types';
import { formatDate, formatINR } from '../utils/format';

function ServiceBadges({ services }: { services: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
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
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-emerald-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Online
      </span>
    );
  }
  return <span className="shrink-0 text-[11px] font-semibold text-slate-400">Offline</span>;
}

export default function PartnersPage() {
  const { partnerPct, platformPct } = useCatalog();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim());
  const [account, setAccount] = useState<AccountFilter>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(20);
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [summary, setSummary] = useState({ total: 0, online: 0, activeJobs: 0, earnings: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [debounced, account, limit]);

  const load = async () => {
    try {
      const res = await adminApi.creators({ q: debounced, page, limit, account });
      setPartners(res.creators);
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
  }, [debounced, account, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useAdminLive(() => load());

  if (loading && partners.length === 0) return <PageLoader label="Loading partners..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Partners"
        title="Partners & their shoots"
        subtitle="Photographers & videographers who accept bookings. Use Deleted to see who closed their partner account."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Registered Partners" value={summary.total} hint="SnapNear Partner accounts" />
        <StatCard tone="emerald" icon={Radio} label="Online Now" value={summary.online} hint="Receiving live pings" />
        <StatCard tone="violet" icon={Camera} label="Shoots In Progress" value={summary.activeJobs} hint="Accepted & ongoing" />
        <StatCard tone="amber" icon={Wallet} label="Partner Earnings" value={formatINR(summary.earnings, { fixed: true })} hint={`${partnerPct} of completed shoots`} />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">All Partners</h3>
            <p className="text-xs leading-snug text-slate-500">
              Duty status, jobs and earnings
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
          {partners.length === 0 ? (
            <li className="md:col-span-2">
              <EmptyState
                icon={Briefcase}
                title="No partners found"
                description={
                  account === 'deleted'
                    ? 'Nobody has deleted their partner account yet.'
                    : 'Partners appear here as soon as they sign up.'
                }
              />
            </li>
          ) : (
            partners.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm leading-snug font-bold text-slate-900">
                        <span className="truncate">{c.name}</span>
                        <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-amber-600">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          {c.rating.toFixed(1)}
                          {c.ratingCount > 0 ? ` (${c.ratingCount})` : ''}
                        </span>
                      </p>
                      <DutyBadge partner={c} />
                    </div>
                    <p className="text-[11px] leading-snug text-slate-500">
                      {c.phone} · {c.experienceYears}+ yrs
                    </p>
                    <div className="mt-1.5">
                      <LocationCell city={c.city} address={c.address} latitude={c.latitude} longitude={c.longitude} />
                    </div>
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
                <div className="border-t border-slate-100 pt-3">
                  <AccountCell user={c} kind="partner" onChanged={load} />
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
                <th className="px-3 py-3">Partner</th>
                <th className="px-3 py-3">Current Location</th>
                <th className="px-3 py-3">Skills</th>
                <th className="px-3 py-3">Duty</th>
                <th className="px-3 py-3 text-center">Accepted</th>
                <th className="px-3 py-3 text-center">Done</th>
                <th className="px-3 py-3 text-right text-emerald-700">Earnings {partnerPct}</th>
                <th className="px-3 py-3 text-right text-brand-orange">Platform {platformPct}</th>
                <th className="px-3 py-3">Joined</th>
                <th className="px-3 py-3">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={Briefcase}
                      title="No partners found"
                      description={
                        account === 'deleted'
                          ? 'Nobody has deleted their partner account yet.'
                          : 'Partners appear here as soon as they sign up.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                partners.map((c) => (
                  <tr key={c.id} className="align-middle hover:bg-slate-50/80">
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-1.5 leading-snug font-semibold text-slate-800">
                            {c.name}
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              {c.rating.toFixed(1)}
                              {c.ratingCount > 0 ? ` (${c.ratingCount})` : ''}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                            {c.phone} · {c.city || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <LocationCell compact city={c.city} address={c.address} latitude={c.latitude} longitude={c.longitude} />
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ServiceBadges services={c.services} />
                        <span className="text-[11px] font-semibold text-slate-700">{c.experienceYears}+ yrs</span>
                      </div>
                      <p className="mt-0.5 max-w-[220px] truncate text-[10px] leading-snug text-slate-400" title={c.gear}>
                        {c.gear || '—'}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <DutyBadge partner={c} />
                    </td>
                    <td className="px-3 py-3.5 align-middle text-center leading-snug">{c.accepted}</td>
                    <td className="px-3 py-3.5 align-middle text-center leading-snug font-bold text-slate-900">{c.completed}</td>
                    <td className="px-3 py-3.5 align-middle text-right leading-snug font-semibold text-emerald-600">
                      {formatINR(c.earnings, { fixed: true })}
                    </td>
                    <td className="px-3 py-3.5 align-middle text-right leading-snug font-bold text-brand-orange">
                      {formatINR(c.platformFee, { fixed: true })}
                    </td>
                    <td className="px-3 py-3.5 align-middle leading-snug">{formatDate(c.joinedAt)}</td>
                    <td className="px-3 py-3.5 align-middle">
                      <AccountCell user={c} kind="partner" onChanged={load} />
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
          label="partners"
        />
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
