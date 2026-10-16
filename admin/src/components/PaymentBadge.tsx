import { BadgeCheck, Clock } from 'lucide-react';
import Badge from './ui/Badge';
import { PAYMENT_STATUS } from '../config/constants';
import type { Payment } from '../types';

export default function PaymentBadge({ payment }: { payment: Payment | null }) {
  if (!payment) return null;

  return payment.status === PAYMENT_STATUS.PAID ? (
    <Badge tone="emerald" icon={BadgeCheck} ring>
      Paid
    </Badge>
  ) : (
    <Badge tone="orange" icon={Clock} ring>
      Payment due
    </Badge>
  );
}
