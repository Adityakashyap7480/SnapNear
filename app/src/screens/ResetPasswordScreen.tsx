import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { PasswordInput } from '../components/ui/FormField';
import OtpInput from '../components/ui/OtpInput';
import Text from '../components/ui/Text';
import { authApi } from '../api/services';
import { ROUTES } from '../config/routes';
import toast from '../lib/toast';
import type { ApiFailure } from '../types';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; devOtp?: string }>();
  const email = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
  const initialDevOtp = typeof params.devOtp === 'string' ? params.devOtp : null;

  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(initialDevOtp);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; otp?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const validate = () => {
    const next: { password?: string; confirm?: string; otp?: string } = {};
    if (otp.length !== 6) next.otp = 'Enter the 6-digit code from your email';
    if (password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) next.password = 'Use a mix of letters and numbers';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (submitting || !validate()) return;
    if (!email) {
      setFormError('Start again from Forgot password.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({ email, otp, password });
      toast.success(res.message);
      router.replace(ROUTES.LOGIN);
    } catch (err) {
      setFormError((err as ApiFailure).message);
      setOtp('');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (resending || submitting || !email) return;
    setResending(true);
    setFormError('');
    try {
      const res = await authApi.forgotPassword(email);
      setDevOtp(res.devOtp || null);
      setOtp('');
      toast.success(res.devOtp ? 'New code ready (shown below)' : 'New code sent to your email');
    } catch (err) {
      setFormError((err as ApiFailure).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.replace(ROUTES.FORGOT_PASSWORD)}
        className="mb-4 flex-row items-center gap-1.5 self-start"
      >
        <ArrowLeft size={16} color="#64748b" />
        <Text className="text-xs font-semibold text-slate-500">Back</Text>
      </Pressable>

      <View>
        <Text className="text-xs font-bold uppercase tracking-wider text-brand-orange">Account recovery</Text>
        <Text role="heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
          Set a new password
        </Text>
        <Text className="mt-2 text-sm text-slate-500">
          {email ? (
            <>
              Enter the 6-digit code sent to <Text className="text-sm font-semibold text-slate-900">{email}</Text>, then choose a new
              password.
            </>
          ) : (
            'Open Forgot password first and request a code.'
          )}
        </Text>
      </View>

      <View className="mt-6 gap-4">
        {devOtp ? (
          <View className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-amber-800">
              Dev mode: your code is <Text className="text-xs font-extrabold tracking-widest text-amber-950">{devOtp}</Text>
            </Text>
          </View>
        ) : null}

        {formError ? (
          <View className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-red-700">{formError}</Text>
          </View>
        ) : null}

        {!email ? (
          <View className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-amber-800">Request a code from Forgot password first.</Text>
          </View>
        ) : null}

        <View>
          <Text className="mb-2 text-xs font-semibold text-slate-600">Email code</Text>
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setErrors((e) => ({ ...e, otp: undefined }));
              setFormError('');
            }}
            length={6}
            autoFocus={Boolean(email)}
            disabled={submitting || !email}
            error={Boolean(errors.otp)}
            id="reset-otp"
            label="Password reset code"
          />
          {errors.otp ? <Text className="mt-1.5 text-center text-[11px] font-medium text-red-600">{errors.otp}</Text> : null}
        </View>

        <PasswordInput
          label="New password"
          name="reset-password"
          placeholder="At least 8 characters"
          icon={Lock}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
        />
        <PasswordInput
          label="Confirm password"
          name="reset-confirm"
          placeholder="Re-enter password"
          icon={Lock}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          error={errors.confirm}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        <Button testID="reset-submit" size="lg" loading={submitting} onPress={onSubmit} className="w-full" disabled={!email}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>

        {email ? (
          <Pressable accessibilityRole="button" onPress={onResend} disabled={resending || submitting} className="items-center py-1">
            <Text className={`text-sm font-semibold ${resending ? 'text-slate-400' : 'text-brand-orange'}`}>
              {resending ? 'Sending...' : "Didn't get it? Resend code"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AuthLayout>
  );
}
