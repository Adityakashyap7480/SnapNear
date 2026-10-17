import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { PasswordInput } from '../components/ui/FormField';
import Text from '../components/ui/Text';
import { authApi } from '../api/services';
import { ROUTES } from '../config/routes';
import toast from '../lib/toast';
import type { ApiFailure } from '../types';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) next.password = 'Use a mix of letters and numbers';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (submitting || !validate()) return;
    if (!token) {
      setFormError('This reset link is missing a token. Request a new one from Forgot password.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({ token, password });
      toast.success(res.message);
      router.replace(ROUTES.LOGIN);
    } catch (err) {
      setFormError((err as ApiFailure).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.replace(ROUTES.LOGIN)}
        className="mb-4 flex-row items-center gap-1.5 self-start"
      >
        <ArrowLeft size={16} color="#64748b" />
        <Text className="text-xs font-semibold text-slate-500">Back to log in</Text>
      </Pressable>

      <View>
        <Text className="text-xs font-bold uppercase tracking-wider text-brand-orange">Account recovery</Text>
        <Text role="heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
          Set a new password
        </Text>
        <Text className="mt-2 text-sm text-slate-500">Choose a strong password for your SnapNear account.</Text>
      </View>

      <View className="mt-6 gap-4">
        {formError ? (
          <View className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-red-700">{formError}</Text>
          </View>
        ) : null}
        {!token ? (
          <View className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-amber-800">
              Open the link from your email, or request a new reset from Forgot password.
            </Text>
          </View>
        ) : null}

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
          autoFocus
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

        <Button testID="reset-submit" size="lg" loading={submitting} onPress={onSubmit} className="w-full" disabled={!token}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </View>
    </AuthLayout>
  );
}
