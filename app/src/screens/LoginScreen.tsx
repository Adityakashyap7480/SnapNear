import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import AuthLayout from '../components/layout/AuthLayout';
import AccountNotice from '../components/auth/AccountNotice';
import Button from '../components/ui/Button';
import { Input, PasswordInput } from '../components/ui/FormField';
import Text from '../components/ui/Text';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../config/routes';
import { homeFor } from '../lib/roleHome';
import toast from '../lib/toast';
import type { ApiFailure } from '../types';
import { MESSAGES, isValidEmail } from '../utils/validators';

type Form = { email: string; password: string };

export default function LoginScreen() {
  const { login, accountNotice, setAccountNotice } = useAuth();
  const [form, setForm] = useState<Form>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const update = (name: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const next: Partial<Form> = {};
    if (!isValidEmail(form.email)) next.email = MESSAGES.EMAIL;
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (submitting || !validate()) return;
    setSubmitting(true);
    setAccountNotice(null);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.replace(homeFor(user.role));
    } catch (err) {
      const e = err as ApiFailure;
      if (e.code?.startsWith('ACCOUNT_')) {
        setAccountNotice({ code: e.code, message: e.message, account: e.account, email: form.email.trim() });
      } else {
        setFormError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <View>
        <Text className="text-xs font-bold uppercase tracking-wider text-brand-orange">Welcome back</Text>
        <Text role="heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
          Log in to SnapNear
        </Text>
        <Text className="mt-2 text-sm text-slate-500">One secure login for customers, photographer partners and the owner.</Text>
      </View>

      <View className="mt-6 gap-4">
        {accountNotice && <AccountNotice notice={accountNotice} />}
        {formError ? (
          <View className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-red-700">{formError}</Text>
          </View>
        ) : null}

        <Input
          label="Email address"
          name="email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="you@example.com"
          icon={Mail}
          value={form.email}
          onChangeText={update('email')}
          error={errors.email}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordInput
          ref={passwordRef}
          label="Password"
          name="password"
          autoComplete="current-password"
          textContentType="password"
          placeholder="Enter your password"
          icon={Lock}
          value={form.password}
          onChangeText={update('password')}
          error={errors.password}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        <Button testID="login-submit" size="lg" loading={submitting} onPress={onSubmit} iconAfter={submitting ? undefined : ArrowRight} className="w-full">
          {submitting ? 'Signing in...' : 'Log in'}
        </Button>
      </View>

      <View className="my-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-200" />
        <Text className="text-[11px] font-semibold uppercase text-slate-400">New to SnapNear?</Text>
        <View className="h-px flex-1 bg-slate-200" />
      </View>

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(`${ROUTES.SIGNUP}?role=customer`)}
          className="flex-1 items-center rounded-xl border border-slate-200 p-3 active:border-brand-orange active:bg-orange-50/50"
        >
          <Text className="text-center text-xs font-bold text-slate-900">Book a shoot</Text>
          <Text className="text-center text-[11px] text-slate-500">Create customer account</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(`${ROUTES.SIGNUP}?role=partner`)}
          className="flex-1 items-center rounded-xl border border-slate-200 p-3 active:border-brand-violet active:bg-indigo-50/50"
        >
          <Text className="text-center text-xs font-bold text-slate-900">Become a partner</Text>
          <Text className="text-center text-[11px] text-slate-500">Get paid shoots near you</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
