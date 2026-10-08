import { EmptyState } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import { formatDate, formatINR } from '../../utils/format';

const payout = (h) => (h.status === 'completed' ? formatINR(h.creatorPayout, { fixed: true }) : '—');

export default function JobHistory({ history }) {
  if (history.length === 0) {
    return <EmptyState title="No completed jobs yet" description="Accepted shoots you finish will show up here with your payout." />;
  }

  return (
    <>
      <ul className="divide-y divide-slate-100 md:hidden">
        {history.map((h) => (
          <li key={h.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{h.client.name}</p>
                <p className="text-[11px] text-slate-500">
                  {h.code} &bull; {h.occasion} &bull; {h.durationLabel}
                </p>
              </div>
              <StatusBadge status={h.status} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-500">{formatDate(h.completedAt || h.shootDate)}</span>
              <span className="font-bold text-emerald-600">{payout(h)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] font-semibold text-slate-500 uppercase">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3">Booking</th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Shoot</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3 text-right">Your 80%</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {history.map((h) => (
              <tr key={h.id}>
                <td className="py-2.5 pr-3 font-semibold text-slate-800">{h.code}</td>
                <td className="py-2.5 pr-3">{h.client.name}</td>
                <td className="py-2.5 pr-3">
                  {h.occasion} &bull; {h.durationLabel}
                </td>
                <td className="py-2.5 pr-3">{formatDate(h.completedAt || h.shootDate)}</td>
                <td className="py-2.5 pr-3 text-right font-bold text-emerald-600">{payout(h)}</td>
                <td className="py-2.5 text-right">
                  <StatusBadge status={h.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
