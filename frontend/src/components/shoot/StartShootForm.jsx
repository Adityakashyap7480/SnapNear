import { useState } from 'react';
import { KeyRound, Play } from 'lucide-react';
import Button from '../ui/Button';
import OtpInput from '../ui/OtpInput';
import { START_OTP_LENGTH } from '../../config/constants';
import { formatMinutes } from '../../utils/format';

/** Partner side: type the customer's OTP to start the shoot and its countdown. */
export default function StartShootForm({ job, onStart }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const first = job.client?.name?.split(' ')[0] || 'the customer';

  const submit = async (code = otp) => {
    if (submitting) return;
    if (code.length !== START_OTP_LENGTH) {
      setError(`Enter the ${START_OTP_LENGTH}-digit OTP from ${first}`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onStart(job, code);
    } catch (err) {
      setError(err.message);
      setOtp('');
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4 rounded-2xl border border-emerald-900/60 bg-gradient-to-b from-emerald-950/70 to-slate-950/40 p-4 text-center"
    >
      <div>
        <p className="flex items-center justify-center gap-1.5 font-display text-sm font-bold text-emerald-300">
          <KeyRound className="h-4 w-4" /> Enter start OTP
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Ask {first} for the {START_OTP_LENGTH}-digit OTP in their SnapNear app. The {formatMinutes(job.durationMinutes || 60)} timer starts as soon as it matches.
        </p>
      </div>

      <OtpInput
        id={`start-otp-${job.id}`}
        label="Customer start OTP"
        tone="dark"
        length={START_OTP_LENGTH}
        value={otp}
        onChange={(v) => {
          setOtp(v);
          if (error) setError('');
        }}
        onComplete={submit}
        error={Boolean(error)}
        disabled={submitting}
      />

      <p className={`min-h-4 text-xs font-semibold ${error ? 'text-red-300' : 'text-transparent'}`} role="alert">
        {error || '.'}
      </p>

      <Button type="submit" variant="success" size="lg" loading={submitting} disabled={otp.length !== START_OTP_LENGTH} className="w-full">
        {!submitting && <Play className="h-4 w-4 fill-current" />} Start Shoot
      </Button>
    </form>
  );
}
