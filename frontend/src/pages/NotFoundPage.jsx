import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <Logo />
      <div>
        <p className="font-display text-7xl font-black text-brand-orange">404</p>
        <h1 className="mt-2 font-display text-xl font-bold text-slate-900">This page went out of frame</h1>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist or was moved.</p>
      </div>
      <Link to="/" className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
        Back to SnapNear
      </Link>
    </div>
  );
}
