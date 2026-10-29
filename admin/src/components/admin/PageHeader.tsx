interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export default function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <div>
      {eyebrow && <p className="text-xs font-bold tracking-wider text-brand-orange uppercase">{eyebrow}</p>}
      <h1 className="font-display text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm leading-snug text-slate-500">{subtitle}</p>}
    </div>
  );
}
