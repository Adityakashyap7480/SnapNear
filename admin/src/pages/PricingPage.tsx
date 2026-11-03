import { useEffect, useState } from 'react';
import { Camera, IndianRupee, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/admin/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input } from '../components/ui/FormField';
import { PageLoader } from '../components/ui/Spinner';
import { adminApi } from '../api/services';
import { useCatalog } from '../context/CatalogContext';
import useAsync from '../hooks/useAsync';
import type { ApiFailure, ServicePricing, SessionPricing } from '../types';
import { formatINR } from '../utils/format';

type Draft = Record<string, string>;
type Drafts = { photo: Draft; video: Draft };

const digits = (value: string) => value.replace(/\D/g, '').slice(0, 6);

const toDraft = (pricing: SessionPricing): Drafts => ({
  photo: Object.fromEntries(pricing.photo.packages.map((pack) => [pack.id, String(pack.price)])),
  video: Object.fromEntries(pricing.video.packages.map((pack) => [pack.id, String(pack.price)])),
});

const toNumbers = (draft: Draft) =>
  Object.fromEntries(Object.entries(draft).map(([id, value]) => [id, Number(value)]));

function ServiceBoard({
  service,
  values,
  onChange,
  tone,
}: {
  service: ServicePricing;
  values: Draft;
  onChange: (id: string, value: string) => void;
  tone: 'orange' | 'violet';
}) {
  const Icon = service.service === 'photo' ? Camera : Video;
  const iconBox = tone === 'orange' ? 'bg-orange-100 text-brand-orange' : 'bg-indigo-100 text-brand-violet';
  const tile = tone === 'orange' ? 'border-brand-orange/70 bg-orange-50/50' : 'border-brand-violet/50 bg-indigo-50/40';

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBox}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Session duration</p>
          <h2 className="font-display text-base font-bold text-slate-900">{service.serviceLabel}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {service.packages.map((pack) => {
          const raw = values[pack.id] ?? '';
          const preview = Number(raw);
          return (
            <div key={pack.id} className={`rounded-xl border p-3 ${tile}`}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{pack.label}</p>
                <p className="font-display text-base font-black text-slate-900">
                  {Number.isInteger(preview) && preview > 0 ? formatINR(preview) : '—'}
                </p>
              </div>
              <p className="mb-3 truncate text-[11px] text-slate-500">{pack.subtitle}</p>
              <Input
                label="Customer pays"
                name={`${service.service}-${pack.id}`}
                inputMode="numeric"
                autoComplete="off"
                icon={IndianRupee}
                value={raw}
                onChange={(e) => onChange(pack.id, digits(e.target.value))}
                placeholder={String(pack.price)}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function PricingPage() {
  const { reload: reloadCatalog } = useCatalog();
  const { data, setData, loading, error, reload } = useAsync(() => adminApi.pricing().then((r) => r.pricing), []);
  const [draft, setDraft] = useState<Drafts | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data || draft) return;
    setDraft(toDraft(data));
  }, [data, draft]);

  if ((loading && !data) || !data || !draft) {
    if (error && !data) {
      return (
        <div className="space-y-4">
          <PageHeader eyebrow="Book a shoot" title="Shoot pricing" />
          <Card className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">{error}</p>
            <Button className="mt-4" variant="dark" onClick={() => reload({ silent: false })}>
              Try again
            </Button>
          </Card>
        </div>
      );
    }
    return <PageLoader label="Loading prices..." />;
  }

  const services = [data.photo, data.video] as const;
  const valid = services.every((service) =>
    service.packages.every((pack) => {
      const price = Number(draft[service.service][pack.id]);
      return Number.isInteger(price) && price >= 1;
    })
  );
  const dirty = services.some((service) =>
    service.packages.some((pack) => Number(draft[service.service][pack.id]) !== pack.price)
  );

  const setPrice = (service: 'photo' | 'video', id: string, value: string) => {
    setDraft((current) => (current ? { ...current, [service]: { ...current[service], [id]: value } } : current));
  };

  const save = async () => {
    if (!valid || !dirty || saving) return;
    setSaving(true);
    try {
      const { pricing } = await adminApi.updateSessionPrices({
        photo: toNumbers(draft.photo),
        video: toNumbers(draft.video),
      });
      setData(pricing);
      setDraft(toDraft(pricing));
      reloadCatalog();
      toast.success('Prices updated. Book a shoot will show them now.');
    } catch (err) {
      toast.error((err as ApiFailure).message || 'Could not save prices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Book a shoot"
        title="Shoot pricing"
        subtitle="These are the four session prices on Book a shoot. Photos Only and Video & Cinema each have their own rates."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ServiceBoard service={data.photo} values={draft.photo} onChange={(id, value) => setPrice('photo', id, value)} tone="orange" />
        <ServiceBoard service={data.video} values={draft.video} onChange={(id, value) => setPrice('video', id, value)} tone="violet" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Saving updates Book a shoot. Photos Only and Video & Cinema each use their own four rates.
        </p>
        <Button className="shrink-0 cursor-pointer" loading={saving} disabled={!dirty || !valid} onClick={save}>
          Save prices
        </Button>
      </div>
    </div>
  );
}
