import type { ReactNode } from 'react';
import { BadgeCheck, Bell, Camera, IndianRupee, MapPin, ShieldCheck, Star, Video, Zap } from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useCatalog } from '../context/CatalogContext';
import { formatINR } from '../utils/format';

function FloatingPingCard() {
  const { catalog } = useCatalog();
  const photoTiers = catalog.tiers.photo || [];
  const sample = photoTiers[1] || photoTiers[0];

  return (
    <div className="animate-float rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-brand-yellow">
          <Bell className="h-3.5 w-3.5" /> New shoot request
        </span>
        <span className="rounded-md bg-brand-orange px-2 py-0.5 text-[10px] font-bold text-white">1.4 km</span>
      </div>
      <p className="mt-2 font-display text-base font-bold text-white">🎂 Birthday Celebration</p>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-300">
        <MapPin className="h-3 w-3" /> Gaur City 2, Greater Noida West
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Partner earns</p>
          <p className="font-display text-xl font-black text-emerald-400">{formatINR(sample?.creatorPayout, { fixed: true })}</p>
        </div>
        <span className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white">Accept</span>
      </div>
    </div>
  );
}

function FloatingPartnerCard() {
  return (
    <div className="animate-float rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 shadow-2xl backdrop-blur-xl [animation-delay:1.5s]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-violet to-indigo-400 font-display text-sm font-bold text-white">
          RK
        </div>
        <div>
          <p className="flex items-center gap-1 text-sm font-bold text-white">
            Rohan Kapoor <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
          </p>
          <p className="flex items-center gap-1 text-[11px] text-amber-300">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 &bull; Arriving in 12 min
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { startingPrice } = useCatalog();
  const features = [
    { icon: Zap, title: 'Instant doorstep dispatch', text: 'Verified photographers within 5 km get your request in seconds.' },
    { icon: ShieldCheck, title: 'Verified & experienced', text: 'Every SnapNear Partner is background-checked.' },
    {
      icon: IndianRupee,
      title: 'Transparent pricing',
      text: `Starts at ${formatINR(startingPrice.photo)}/hr. No surge, travel included.`,
    },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Pinned to the viewport so a long form never stretches this panel */}
      <aside className="no-scrollbar sticky top-0 hidden h-screen w-[46%] shrink-0 overflow-x-hidden overflow-y-auto bg-brand-navy lg:block">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-brand-violet/30 blur-[120px]" />

        <div className="relative z-10 flex min-h-full flex-col justify-between gap-8">
          <div className="p-10 pb-0 shorter:p-8 shorter:pb-0 xl:p-14 xl:pb-0">
            <Logo dark size="lg" tagline="Photographers at your doorstep" />
          </div>

          <div className="px-10 shorter:px-8 xl:px-14">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live in Noida, Greater Noida & Ghaziabad
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.1] font-extrabold text-white shorter:text-3xl xl:text-5xl xl:shorter:text-4xl">
              Your photographer,
              <br />
              <span className="bg-gradient-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent">
                at your doorstep
              </span>{' '}
              in minutes.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Book verified photographers & videographers for birthdays, reels, baby shoots and society events, just
              like booking a ride.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-1 items-start gap-4 shorter:hidden xl:grid-cols-2">
              <FloatingPingCard />
              <div className="space-y-4 xl:pt-10">
                <FloatingPartnerCard />
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-slate-200">
                    <Camera className="h-3.5 w-3.5 text-brand-orange" /> Photos from {formatINR(startingPrice.photo)}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-slate-200">
                    <Video className="h-3.5 w-3.5 text-brand-violet" /> Video from {formatINR(startingPrice.video)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 p-10 short:hidden xl:px-14">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="h-5 w-5 text-brand-yellow" />
                <p className="mt-2 text-xs font-bold text-white">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{text}</p>
              </div>
            ))}
          </div>
          <div className="hidden h-2 short:block" />
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </div>
        <p className="pb-6 text-center text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} SnapNear Technologies &bull; Verified photographers at your doorstep
        </p>
      </section>
    </div>
  );
}
