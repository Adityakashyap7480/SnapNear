import { useCallback, useState } from 'react';
import { AlertTriangle, Ban, Check, CheckCircle2, Clock, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Textarea } from '../ui/FormField';
import { adminApi } from '../../api/services';

const OPTIONS = [
  {
    status: 'active',
    label: 'Active',
    icon: CheckCircle2,
    text: 'Can log in and use SnapNear normally.',
    selected: 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500',
    iconClass: 'bg-emerald-100 text-emerald-700',
    confirm: 'success',
    action: 'Reactivate account',
    done: (name) => `${name} is active again and can log in.`,
  },
  {
    status: 'suspended',
    label: 'Suspended',
    icon: Clock,
    text: "Temporary hold. Logged out right away and can't log in until you reactivate.",
    selected: 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500',
    iconClass: 'bg-amber-100 text-amber-700',
    confirm: 'amber',
    action: 'Suspend account',
    done: (name) => `${name} has been suspended and logged out.`,
  },
  {
    status: 'blocked',
    label: 'Blocked',
    icon: Ban,
    text: 'For fraud, abuse or serious policy violations. Logged out and access removed.',
    selected: 'border-red-500 bg-red-50/60 ring-1 ring-red-500',
    iconClass: 'bg-red-100 text-red-700',
    confirm: 'destructive',
    action: 'Block account',
    done: (name) => `${name} has been blocked and logged out.`,
  },
];

const optionFor = (status) => OPTIONS.find((o) => o.status === status) || OPTIONS[0];

function impactNote(kind, user) {
  if (kind === 'customer') {
    return 'Their requests still waiting for a photographer will be cancelled automatically. Shoots already accepted stay in the ledger.';
  }
  if (user.active > 0) {
    return `${user.name} has a shoot in progress. It stays as it is, so cancel it from the ledger if needed.`;
  }
  return 'They will be taken offline and stop receiving new shoot requests.';
}

export default function AccountActions({ user, kind, onChanged }) {
  const current = user.accountStatus || 'active';
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(current);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    setSelected(current);
    setReason(user.statusReason || '');
    setOpen(true);
  };
  const close = useCallback(() => !saving && setOpen(false), [saving]);

  const choice = optionFor(selected);
  const restricting = selected !== 'active';
  const unchanged = selected === current && (!restricting || reason.trim() === (user.statusReason || ''));
  const confirmLabel = selected === current && restricting ? 'Update reason' : choice.action;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await adminApi.setUserStatus(user.id, { status: selected, reason: restricting ? reason.trim() : '' });
      toast.success(selected === current ? `Reason updated for ${user.name}.` : choice.done(user.name));
      if (res.cancelledRequests > 0) toast(`${res.cancelledRequests} open request(s) from ${user.name} were cancelled.`);
      setOpen(false);
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={openModal} className="whitespace-nowrap">
        <UserCog className="h-3.5 w-3.5" /> Manage
      </Button>

      <Modal
        open={open}
        onClose={close}
        icon={UserCog}
        iconClass="bg-slate-100 text-slate-700"
        title={`Manage ${user.name}`}
        description={`Control whether this ${kind} can log in to SnapNear.`}
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button variant={choice.confirm} onClick={submit} loading={saving} disabled={unchanged}>
              {saving ? 'Saving...' : confirmLabel}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div role="radiogroup" aria-label="Account status" className="space-y-2">
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              const isSelected = selected === o.status;
              return (
                <button
                  key={o.status}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(o.status)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    isSelected ? o.selected : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${o.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      {o.label}
                      {current === o.status && (
                        <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                          Current
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{o.text}</span>
                  </span>
                  <span
                    className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </span>
                </button>
              );
            })}
          </div>

          {restricting && (
            <>
              {selected !== current && (
                <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {impactNote(kind, user)}
                </p>
              )}
              <Textarea
                label="Reason (optional, shown to the user)"
                name="reason"
                rows={2}
                maxLength={300}
                placeholder={
                  selected === 'blocked'
                    ? 'e.g. Repeated fake bookings reported by partners'
                    : 'e.g. Under review after a customer complaint'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                hint={`${reason.length}/300`}
              />
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
