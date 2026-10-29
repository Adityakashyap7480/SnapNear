import AccountActions from './AccountActions';
import AccountStatusBadge from './AccountStatusBadge';
import type { AccountStatus } from '../../config/constants';

interface AccountCellProps {
  user: {
    id: string;
    name: string;
    active: number;
    accountStatus?: AccountStatus;
    statusReason?: string;
    deletedAt?: string | null;
  };
  kind: 'customer' | 'partner';
  onChanged?: () => void;
}

/**
 * Stable Account column: status + Manage always sit in a fixed two-column grid
 * so Manage buttons line up even when badges differ (Active vs Deleted).
 */
export default function AccountCell({ user, kind, onChanged }: AccountCellProps) {
  const deleted = Boolean(user.deletedAt);

  return (
    <div
      className={`grid w-[11.5rem] items-center gap-x-2 ${
        deleted ? 'grid-cols-1' : 'grid-cols-[minmax(4.5rem,1fr)_auto]'
      }`}
    >
      <div className="min-w-0">
        <AccountStatusBadge status={user.accountStatus} reason={user.statusReason} deletedAt={user.deletedAt} />
      </div>
      {!deleted && (
        <div className="shrink-0 justify-self-end">
          <AccountActions user={user} kind={kind} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}
