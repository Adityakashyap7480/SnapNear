import { OCCASION_EMOJI } from '../../utils/bookingStatus';

export default function OccasionChips({ occasions = [], value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {occasions.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            value === o
              ? 'border-brand-orange bg-orange-50 text-brand-orange'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {OCCASION_EMOJI[o] || '✨'} {o}
        </button>
      ))}
    </div>
  );
}
