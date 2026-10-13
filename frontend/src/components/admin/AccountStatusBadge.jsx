import Badge from '../ui/Badge';
import { ACCOUNT_STATUS } from '../../config/constants';

const STYLES = {
  [ACCOUNT_STATUS.ACTIVE]: { label: 'Active', tone: 'emerald', dot: 'bg-emerald-500' },
  [ACCOUNT_STATUS.SUSPENDED]: { label: 'Suspended', tone: 'amber', dot: 'bg-amber-500' },
  [ACCOUNT_STATUS.BLOCKED]: { label: 'Blocked', tone: 'red', dot: 'bg-red-500' },
};

export default function AccountStatusBadge({ status = ACCOUNT_STATUS.ACTIVE, reason }) {
  const s = STYLES[status] || STYLES[ACCOUNT_STATUS.ACTIVE];
  return (
    <Badge tone={s.tone} dot={s.dot} ring title={reason ? `Reason: ${reason}` : undefined}>
      {s.label}
    </Badge>
  );
}
