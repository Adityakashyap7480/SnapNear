import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Banknote, Briefcase, CalendarPlus, ChevronDown, LogOut, PieChart, ShieldCheck, Users, Wifi, WifiOff } from 'lucide-react';
import Logo from '../components/ui/Logo';
import Avatar from '../components/ui/Avatar';
import AdminShootAlerts from '../components/admin/AdminShootAlerts';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { APP_NAMES, ROLE_LABELS, ROLES } from '../config/constants';
import { ROUTES } from '../config/routes';

const NAV_BY_ROLE = {
  [ROLES.CLIENT]: [{ to: ROUTES.BOOK, label: APP_NAMES.client, icon: CalendarPlus, color: 'text-brand-orange' }],
  [ROLES.CREATOR]: [{ to: ROUTES.PARTNER, label: APP_NAMES.creator, icon: Briefcase, color: 'text-brand-violet' }],
  [ROLES.SUPER_ADMIN]: [
    { to: ROUTES.ADMIN_CUSTOMERS, label: 'Customers', icon: Users, color: 'text-brand-orange' },
    { to: ROUTES.ADMIN_PARTNERS, label: 'Partners', icon: Briefcase, color: 'text-brand-violet' },
    { to: ROUTES.ADMIN_PLATFORM, label: APP_NAMES.platform, icon: PieChart, color: 'text-emerald-600' },
    { to: ROUTES.ADMIN_PAYOUTS, label: 'Payouts', icon: Banknote, color: 'text-teal-600' },
  ],
};

const TAGLINE = {
  [ROLES.CLIENT]: 'Photographers at your doorstep',
  [ROLES.CREATOR]: 'Partner app for photographers',
  [ROLES.SUPER_ADMIN]: 'Owner control centre',
};

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
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

export default function PortalLayout() {
  const { user } = useAuth();
  const { connected } = useSocket();
  const nav = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="flex min-h-screen flex-col">
      {user.role === ROLES.SUPER_ADMIN && <AdminShootAlerts />}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <Logo tagline={TAGLINE[user.role]} badge="Live" />
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
            <span
              title={connected ? 'Live updates connected' : 'Reconnecting...'}
              className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold sm:flex ${
                connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? 'Live' : 'Offline'}
            </span>
            <UserMenu />
          </div>
        </div>

        {nav.length > 1 && (
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
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-3 py-5 sm:px-4 sm:py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} SnapNear Technologies. Photographers & videographers at your doorstep from ₹500/hr.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
            <span className="font-semibold text-emerald-600">&bull; 80% to Partners</span>
            <span className="font-semibold text-brand-orange">&bull; 20% Platform</span>
            <span>&bull; Verified Partners</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
