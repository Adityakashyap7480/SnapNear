import { Camera } from 'lucide-react';

export default function Logo({ tagline = 'Photographers at your doorstep', badge, dark = false, size = 'md' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const icon = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const text = size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} flex shrink-0 items-center justify-center bg-gradient-to-tr from-brand-orange to-brand-yellow text-white shadow-glow`}
      >
        <Camera className={icon} />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-extrabold tracking-tight ${text} ${dark ? 'text-white' : 'text-slate-900'}`}>
            Snap<span className="text-brand-orange">Near</span>
          </span>
          {badge && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {badge}
            </span>
          )}
        </div>
        {tagline && (
          <p className={`truncate text-[11px] font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{tagline}</p>
        )}
      </div>
    </div>
  );
}
