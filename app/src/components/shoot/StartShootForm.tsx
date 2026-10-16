import { useState } from 'react';
import { View } from 'react-native';
import { KeyRound, Play } from 'lucide-react-native';
import Button from '../ui/Button';
import Gradient from '../ui/Gradient';
import OtpInput from '../ui/OtpInput';
import Text from '../ui/Text';
import { useCatalog } from '../../context/CatalogContext';
import type { ApiFailure, Booking } from '../../types';
import { colors } from '../../theme/colors';
import { formatMinutes } from '../../utils/format';

interface StartShootFormProps {
  job: Booking;
  onStart: (job: Booking, otp: string) => Promise<unknown>;
}

/** Partner side: type the customer's OTP to start the shoot and its countdown. */
export default function StartShootForm({ job, onStart }: StartShootFormProps) {
  const { startOtpLength } = useCatalog();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const first = job.client?.name?.split(' ')[0] || 'the customer';

  const submit = async (code = otp) => {
    if (submitting) return;
    if (code.length !== startOtpLength) {
      setError(`Enter the ${startOtpLength}-digit OTP from ${first}`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onStart(job, code);
    } catch (err) {
      setError((err as ApiFailure).message);
      setOtp('');
      setSubmitting(false);
    }
  };

  return (
    <Gradient colors={['rgba(2, 44, 34, 0.7)', 'rgba(2, 6, 23, 0.4)']} to="b" className="gap-4 rounded-2xl border border-emerald-900/60 p-4">
      <View>
        <View className="flex-row items-center justify-center gap-1.5">
          <KeyRound size={16} color={colors.emerald[300]} />
          <Text className="font-display text-sm font-bold text-emerald-300">Enter start OTP</Text>
        </View>
        <Text className="mt-1 text-center text-xs text-slate-400">
          Ask {first} for the {startOtpLength}-digit OTP in their SnapNear app. The {formatMinutes(job.durationMinutes || 60)} timer starts as soon as it matches.
        </Text>
      </View>

      <OtpInput
        id={`start-otp-${job.id}`}
        label="Customer start OTP"
        tone="dark"
        length={startOtpLength}
        value={otp}
        onChange={(v) => {
          setOtp(v);
          if (error) setError('');
        }}
        onComplete={submit}
        error={Boolean(error)}
        disabled={submitting}
      />

      <Text role="alert" className={`min-h-4 text-center text-xs font-semibold ${error ? 'text-red-300' : 'text-transparent'}`}>
        {error || '.'}
      </Text>

      <Button
        testID="start-shoot"
        variant="success"
        size="lg"
        loading={submitting}
        disabled={otp.length !== startOtpLength}
        onPress={() => submit()}
        icon={Play}
        className="w-full"
      >
        Start Shoot
      </Button>
    </Gradient>
  );
}
