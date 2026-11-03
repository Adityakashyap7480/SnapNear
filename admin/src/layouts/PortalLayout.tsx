import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Banknote, Briefcase, ChevronDown, IndianRupee, LogOut, PieChart, ShieldCheck, Users } from 'lucide-react';
import Logo from '../components/ui/Logo';
import AdminPayoutAlerts from '../components/admin/AdminPayoutAlerts';
import AdminShootAlerts from '../components/admin/AdminShootAlerts';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useSocketEvent } from '../context/SocketContext';
import { ROLE_LABELS } from '../config/constants';
import { SOCKET_EVENTS } from '../config/events';
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
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white py-1.5 pr-2.5 pl-1.5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-[13px] font-semibold leading-none text-slate-900">{user.name}</p>
          <p className="mt-1 truncate text-[10px] font-medium tracking-wide text-slate-500 uppercase">Owner</p>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-bold tracking-wide text-slate-700 uppercase ring-1 ring-slate-200">
              <ShieldCheck className="h-3 w-3 text-slate-500" /> {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalLayout() {
  const { user } = useAuth();
  const { partnerPct, platformPct, startingPrice, reload } = useCatalog();
  useSocketEvent(SOCKET_EVENTS.CATALOG_UPDATE, () => {
    reload();
  });
  if (!user) return null;

  const nav = [
    { to: ROUTES.CUSTOMERS, label: 'Customers', icon: Users, color: 'text-brand-orange' },
    { to: ROUTES.PARTNERS, label: 'Partners', icon: Briefcase, color: 'text-brand-violet' },
    { to: ROUTES.PLATFORM, label: `Platform ${platformPct}`, icon: PieChart, color: 'text-emerald-600' },
    { to: ROUTES.PAYOUTS, label: 'Payouts', icon: Banknote, color: 'text-teal-600' },
    { to: ROUTES.PRICING, label: 'Pricing', icon: IndianRupee, color: 'text-amber-600' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AdminShootAlerts />
      <AdminPayoutAlerts />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0 shrink-0">
            <Logo tagline="Owner control centre" badge="Live" />
          </div>

          <nav className="hidden min-w-0 flex-1 justify-center md:flex">
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
              {nav.map(({ to, label, icon: Icon, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition lg:px-3 ${
                      isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="flex shrink-0 items-center justify-end">
            <UserMenu user={user} />
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-6 md:hidden">
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

      <main className="w-full flex-grow px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
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
