import { BadgeCheck, Banknote, Clock } from 'lucide-react';
import Badge from './ui/Badge';
import { PAYMENT_STATUS } from '../config/constants';
import type { Payment } from '../types';

export default function PaymentBadge({ payment }: { payment: Payment | null }) {
  if (!payment) return null;

  if (payment.status !== PAYMENT_STATUS.PAID) {
    return (
      <Badge tone="orange" icon={Clock} ring>
        Payment due
      </Badge>
    );
  }

  const isCash = payment.via === 'cash' || payment.method === 'cash';
  if (!isCash) {
    return (
      <Badge tone="emerald" icon={BadgeCheck} ring>
        Paid
      </Badge>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone="emerald" icon={Banknote} ring>
        Paid · Cash
      </Badge>
      {payment.platformFeeStatus === 'due' && (
        <Badge tone="orange" icon={Clock} ring>
          Fee due
        </Badge>
      )}
      {payment.platformFeeStatus === 'paid' && (
        <Badge tone="emerald" icon={BadgeCheck} ring>
          Fee paid
        </Badge>
      )}
    </span>
  );
}
