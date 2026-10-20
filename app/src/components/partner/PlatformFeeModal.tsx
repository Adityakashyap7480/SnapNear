import { Landmark } from 'lucide-react-native';
import Modal from '../ui/Modal';
import PlatformFeeCard from './PlatformFeeCard';
import type { Booking } from '../../types';

interface PlatformFeeModalProps {
  jobs: Booking[];
  payingId: string | null;
  onPay: (job: Booking) => void;
}

/**
 * Blocking popup for unpaid platform fees on cash-collected shoots. No close button,
 * no backdrop dismiss, Android back is swallowed. It disappears on its own once every
 * fee is paid (the parent stops rendering it after reload), and while it is up the
 * backend also stops sending the partner new shoot requests.
 */
export default function PlatformFeeModal({ jobs, payingId, onPay }: PlatformFeeModalProps) {
  if (jobs.length === 0) return null;
  return (
    <Modal
      open
      dismissible={false}
      onClose={() => {}}
      title="Platform fee pending"
      description="You collected cash for a shoot — pay SnapNear's share to unlock new shoots. Jab tak fee clear nahi hogi, koi naya shoot nahi milega."
      icon={Landmark}
      iconBox="bg-red-100"
      iconColor="#b91c1c"
    >
      <PlatformFeeCard embedded jobs={jobs} payingId={payingId} onPay={onPay} />
    </Modal>
  );
}
