import { BadgeCheck, Clock } from 'lucide-react-native';
import Badge from '../ui/Badge';
import { isPaid } from '../../utils/bookingStatus';
import type { Payment } from '../../types';

export default function PaymentBadge({ payment }: { payment: Payment | null }) {
  if (!payment) return null;

  return isPaid({ payment }) ? (
    <Badge tone="emerald" icon={BadgeCheck} ring>
      Paid
    </Badge>
  ) : (
    <Badge tone="orange" icon={Clock} ring>
      Payment due
    </Badge>
  );
}
