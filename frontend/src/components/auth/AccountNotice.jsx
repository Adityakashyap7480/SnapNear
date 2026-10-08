import { Ban, Clock, Mail } from 'lucide-react';
import { SUPPORT_EMAIL } from '../../config/constants';

const VARIANTS = {
  suspended: {
    icon: Clock,
    title: 'Account suspended',
    box: 'border-amber-200 bg-amber-50',
    iconBox: 'bg-amber-100 text-amber-700',
    titleColor: 'text-amber-900',
    button: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/40',
  },
  blocked: {
    icon: Ban,
    title: 'Account blocked',
    box: 'border-red-200 bg-red-50',
    iconBox: 'bg-red-100 text-red-700',
    titleColor: 'text-red-900',
    button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/40',
  },
};

function supportMailto(supportEmail, status, email) {
  const subject = `Account review request${email ? ` - ${email}` : ''}`;
  const body = [
    'Hello SnapNear Support,',
    '',
    `My SnapNear account${email ? ` (${email})` : ''} has been ${status}. Could you please review it and let me know the next steps?`,
    '',
    'Thank you.',
  ].join('\n');
  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AccountNotice({ notice }) {
  const status = notice.account?.status === 'blocked' ? 'blocked' : 'suspended';
  const v = VARIANTS[status];
  const Icon = v.icon;
  const supportEmail = notice.account?.supportEmail || SUPPORT_EMAIL;
  const reason = notice.account?.reason;

  return (
    <div role="alert" className={`animate-fade-up rounded-2xl border p-4 ${v.box}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${v.iconBox}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-display text-sm font-bold ${v.titleColor}`}>{v.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">{notice.message}</p>
          {reason && (
            <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-slate-700">
              <span className="font-semibold">Reason:</span> {reason}
            </p>
          )}
        </div>
      </div>

      <a
        href={supportMailto(supportEmail, status, notice.email)}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white transition outline-none focus-visible:ring-4 ${v.button}`}
      >
        <Mail className="h-4 w-4 shrink-0" />
        <span className="break-all">Email {supportEmail}</span>
      </a>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Please write from your registered email address so we can find your account quickly.
      </p>
    </div>
  );
}
