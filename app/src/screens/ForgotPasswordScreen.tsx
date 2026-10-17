import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/FormField';
import Text from '../components/ui/Text';
import { authApi } from '../api/services';
import { ROUTES } from '../config/routes';
import toast from '../lib/toast';
import type { ApiFailure } from '../types';
import { MESSAGES, isValidEmail } from '../utils/validators';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (submitting) return;
    if (!isValidEmail(email)) {
      setError(MESSAGES.EMAIL);
      return;
    }
    setError('');
    setFormError('');
    setSubmitting(true);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await authApi.forgotPassword(normalized);
      toast.success(res.devOtp ? 'Use the code on the next screen (SMTP not set)' : 'Check your email for a 6-digit code');
      router.push({
        pathname: ROUTES.RESET_PASSWORD,
        params: { email: normalized, ...(res.devOtp ? { devOtp: res.devOtp } : {}) },
      });
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
          Forgot password?
        </Text>
        <Text className="mt-2 text-sm text-slate-500">
          Enter your account email. If it is registered, we will send a 6-digit code so you can set a new password in the app.
        </Text>
      </View>

      <View className="mt-6 gap-4">
        {formError ? (
          <View className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-red-700">{formError}</Text>
          </View>
        ) : null}

        <Input
          label="Email address"
          name="forgot-email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="you@example.com"
          icon={Mail}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError('');
            setFormError('');
          }}
          error={error}
          autoFocus
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        <Button testID="forgot-submit" size="lg" loading={submitting} onPress={onSubmit} className="w-full">
          {submitting ? 'Sending…' : 'Send code'}
        </Button>
      </View>
    </AuthLayout>
  );
}
