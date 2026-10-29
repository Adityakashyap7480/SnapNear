import { ExternalLink, MapPin } from 'lucide-react';

interface LocationCellProps {
  city?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Compact single-line for table; fuller block for cards. */
  compact?: boolean;
}

function mapsUrl(address: string, latitude?: number | null, longitude?: number | null) {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Shows current location for customers/partners in the owner tables. */
export default function LocationCell({ city = '', address = '', latitude, longitude, compact = false }: LocationCellProps) {
  const label = address || city;
  if (!label) {
    return <span className="text-[11px] text-slate-400">—</span>;
  }

  const href = mapsUrl(label, latitude, longitude);

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={label}
        className="group inline-flex max-w-[220px] items-center gap-1 text-left text-slate-700 hover:text-brand-orange"
      >
        <MapPin className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-brand-orange" />
        <span className="min-w-0">
          <span className="line-clamp-2 leading-snug">{label}</span>
          {city && address && city !== address && (
            <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">{city}</span>
          )}
        </span>
        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 transition group-hover:opacity-60" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      className="group flex items-center gap-1.5 text-left text-slate-700 hover:text-brand-orange"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-brand-orange" />
      <span className="min-w-0">
        <span className="line-clamp-2 text-[11px] leading-snug font-medium">{label}</span>
        {city && address && city !== address && (
          <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">{city}</span>
        )}
      </span>
    </a>
  );
}
