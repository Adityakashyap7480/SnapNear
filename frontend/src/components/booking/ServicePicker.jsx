import { Camera, Video } from 'lucide-react';

const SERVICES = [
  {
    id: 'photo',
    title: 'Photos Only',
    text: 'Portraits, candids, baby & event stills',
    icon: Camera,
    from: '₹500',
    active: 'border-brand-orange bg-orange-50/60',
    iconBox: 'bg-orange-100 text-brand-orange',
    pill: 'bg-slate-900',
  },
  {
    id: 'video',
    title: 'Video & Cinema',
    text: 'Reels, 4K video, stabilizer & audio',
    icon: Video,
    from: '₹999',
    active: 'border-brand-violet bg-indigo-50/60',
    iconBox: 'bg-indigo-100 text-brand-violet',
    pill: 'bg-brand-violet',
  },
];

export default function ServicePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:gap-3">
      {SERVICES.map(({ id, title, text, icon: Icon, from, active, iconBox, pill }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded-xl border-2 p-3 text-left transition sm:p-4 ${value === id ? active : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBox}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${pill}`}>Starts {from}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{text}</p>
        </button>
      ))}
    </div>
  );
}
