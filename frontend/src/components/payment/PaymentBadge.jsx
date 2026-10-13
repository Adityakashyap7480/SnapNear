import { BadgeCheck, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import { isPaid } from '../../utils/payment';

export default function PaymentBadge({ payment }) {
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
