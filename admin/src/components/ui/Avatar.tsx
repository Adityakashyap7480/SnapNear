import { initials } from '../../utils/format';

const PALETTES = [
  'from-brand-orange to-brand-yellow text-slate-950',
  'from-brand-violet to-indigo-400 text-white',
  'from-emerald-500 to-teal-400 text-white',
  'from-sky-500 to-cyan-400 text-white',
  'from-rose-500 to-pink-400 text-white',
];

const SIZES = {
  sm: 'h-8 w-8 text-[11px] rounded-lg',
  md: 'h-10 w-10 text-xs rounded-xl',
  lg: 'h-14 w-14 text-base rounded-2xl',
};

export default function Avatar({ name = '', size = 'md' }: { name?: string; size?: keyof typeof SIZES }) {
  const idx = [...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % PALETTES.length;
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br font-display font-bold ${PALETTES[idx]} ${SIZES[size]}`}
    >
      {initials(name)}
    </div>
  );
}
