import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Banknote, Bell, Briefcase, ChevronDown, LogOut, PieChart, ShieldCheck, Users, Wifi, WifiOff } from 'lucide-react';
import Logo from '../components/ui/Logo';
import Avatar from '../components/ui/Avatar';
import AdminPayoutAlerts from '../components/admin/AdminPayoutAlerts';
import AdminShootAlerts from '../components/admin/AdminShootAlerts';
import { adminApi } from '../api/services';
import useAdminLive from '../hooks/useAdminLive';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useSocket } from '../context/SocketContext';
import { ROLE_LABELS } from '../config/constants';
import { ROUTES } from '../config/routes';
import type { User } from '../types';
import { formatINR } from '../utils/format';

function UserMenu({ user }: { user: User }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pr-2 pl-1 transition hover:bg-slate-50"
      >
        <Avatar name={user.name} size="sm" />
        <div className="hidden text-left leading-tight lg:block">
          <p className="max-w-[120px] truncate text-xs font-bold text-slate-900">{user.name}</p>
          <p className="text-[10px] font-medium text-slate-500">{ROLE_LABELS[user.role]}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 animate-fade-up rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              <ShieldCheck className="h-3 w-3" /> {ROLE_LABELS[user.role]}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/** Bell with a live badge for partner payout requests waiting on the Payouts page. */
function PayoutBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    adminApi
      .payouts()
      .then((d) => setCount(d.requests.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);
  useAdminLive(refresh);

  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.PAYOUTS)}
      title={count > 0 ? `${count} payout request(s) waiting` : 'Payout requests'}
      className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
          {count}
        </span>
      )}
    </button>
  );
}

export default function PortalLayout() {
  const { user } = useAuth();
  const { connected } = useSocket();
  const { partnerPct, platformPct, startingPrice } = useCatalog();
  if (!user) return null;

  const nav = [
    { to: ROUTES.CUSTOMERS, label: 'Customers', icon: Users, color: 'text-brand-orange' },
    { to: ROUTES.PARTNERS, label: 'Partners', icon: Briefcase, color: 'text-brand-violet' },
    { to: ROUTES.PLATFORM, label: `Platform ${platformPct}`, icon: PieChart, color: 'text-emerald-600' },
    { to: ROUTES.PAYOUTS, label: 'Payouts', icon: Banknote, color: 'text-teal-600' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AdminShootAlerts />
      <AdminPayoutAlerts />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <Logo tagline="Owner control centre" badge="Live" />
          </div>

          <nav className="hidden items-center rounded-xl border border-slate-200 bg-slate-100 p-1 md:flex">
            {nav.map(({ to, label, icon: Icon, color }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition lg:px-3.5 ${
                    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <PayoutBell />
            <span
              title={connected ? 'Live updates connected' : 'Reconnecting...'}
              className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold sm:flex ${
                connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? 'Live' : 'Offline'}
            </span>
            <UserMenu user={user} />
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 sm:px-4 md:hidden">
          {nav.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`
              }
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-3 py-5 sm:px-4 sm:py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center sm:flex-row sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} SnapNear Technologies. Photographers & videographers at your doorstep from{' '}
            {formatINR(startingPrice.photo)}/hr.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
            <span className="font-semibold text-emerald-600">&bull; {partnerPct} to Partners</span>
            <span className="font-semibold text-brand-orange">&bull; {platformPct} Platform</span>
            <span>&bull; Verified Partners</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
