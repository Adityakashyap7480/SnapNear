import { useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Briefcase, CalendarPlus, Camera, Check, Lock, Mail, MapPin, User, Video, Wrench, type LucideIcon } from 'lucide-react-native';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { Checkbox, Input, PasswordInput, Select } from '../components/ui/FormField';
import OtpInput from '../components/ui/OtpInput';
import Text from '../components/ui/Text';
import { FadeUp } from '../components/ui/motion';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../config/routes';
import { homeFor } from '../lib/roleHome';
import toast from '../lib/toast';
import { colors } from '../theme/colors';
import type { ApiFailure } from '../types';
import { MESSAGES, isValidEmail, isValidPhone } from '../utils/validators';

const ROLE_OPTIONS: { id: 'client' | 'creator'; icon: LucideIcon; title: string; text: string; active: string; iconBox: string; iconColor: string }[] = [
  {
    id: 'client',
    icon: CalendarPlus,
    title: 'Book a shoot',
    text: 'Photographer at your doorstep',
    active: 'border-brand-orange bg-orange-50/70',
    iconBox: 'bg-orange-100',
    iconColor: colors.brand.orange,
  },
  {
    id: 'creator',
    icon: Briefcase,
    title: "I'm a photographer",
    text: 'Get paid shoots near you',
    active: 'border-brand-violet bg-indigo-50/70',
    iconBox: 'bg-indigo-100',
    iconColor: colors.brand.violet,
  },
];

const SERVICE_OPTIONS = [
  { id: 'photo', label: 'Photography', icon: Camera },
  { id: 'video', label: 'Videography', icon: Video },
];

const EXPERIENCE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 15].map((y) => ({ value: String(y), label: y === 0 ? '< 1 year' : `${y}+ years` }));

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const levels = [
    { label: 'Too weak', color: 'bg-red-400' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-emerald-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ];
  return { score, ...levels[score] };
}

interface Form {
  role: 'client' | 'creator';
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  confirmPassword: string;
  services: string[];
  experienceYears: string;
  gear: string;
  agree: boolean;
}

type Errors = Partial<Record<keyof Form, string>>;

export default function SignupScreen() {
  const { verifySignupOtp } = useAuth();
  // Marketing/terms copy — live split still comes from catalog after login.
  const partnerPct = '80%';
  const platformPct = '20%';
  const params = useLocalSearchParams<{ role?: string; email?: string; name?: string }>();
  const { width } = useWindowDimensions();
  const sm = width >= 640;

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);

  const [form, setForm] = useState<Form>({
    role: ['partner', 'creator'].includes(String(params.role)) ? 'creator' : 'client',
    name: typeof params.name === 'string' ? params.name : '',
    email: typeof params.email === 'string' ? params.email : '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    services: ['photo'],
    experienceYears: '1',
    gear: '',
    agree: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const isCreator = form.role === 'creator';
  const email = form.email.trim().toLowerCase();

  const set = <K extends keyof Form>(name: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError('');
  };

  const toggleService = (id: string) => {
    const has = form.services.includes(id);
    set('services', has ? form.services.filter((s) => s !== id) : [...form.services, id]);
  };

  const validate = () => {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidEmail(form.email)) next.email = MESSAGES.EMAIL;
    if (!isValidPhone(form.phone)) next.phone = MESSAGES.PHONE;
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) next.password = 'Use a mix of letters and numbers';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    if (isCreator && form.services.length === 0) next.services = 'Select at least one service';
    if (!form.agree) next.agree = 'Please accept the terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const signupPayload = () => ({
    role: form.role,
    name: form.name.trim(),
    email,
    phone: form.phone.trim(),
    city: form.city.trim(),
    password: form.password,
    ...(form.role === 'creator' && {
      services: form.services,
      experienceYears: Number(form.experienceYears),
      gear: form.gear.trim(),
    }),
  });

  const onSubmitForm = async () => {
    if (submitting || !validate()) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await authApi.requestSignupOtp(signupPayload());
      setDevOtp(res.devOtp || null);
      setOtp('');
      setOtpError('');
      setStep('otp');
      toast.success(res.devOtp ? 'Use the code shown below (email SMTP not set yet)' : `Code sent to ${email}`);
    } catch (err) {
      const e = err as ApiFailure;
      const fieldErrors = Object.fromEntries((e.details || []).map((d) => [d.field, d.message]));
      setErrors(fieldErrors as Errors);
      setFormError(e.message);
      if (e.status === 409) toast(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const completeWithOtp = async (code: string) => {
    if (submitting || code.length !== 6) return;
    setSubmitting(true);
    setOtpError('');
    try {
      const user = await verifySignupOtp({ email, otp: code });
      toast.success(`Welcome to SnapNear, ${user.name.split(' ')[0]}!`);
      router.replace(homeFor(user.role));
    } catch (err) {
      const e = err as ApiFailure;
      setOtpError(e.message);
      setOtp('');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (resending || submitting) return;
    setResending(true);
    setOtpError('');
    try {
      const res = await authApi.resendSignupOtp(email);
      setDevOtp(res.devOtp || null);
      setOtp('');
      toast.success(res.devOtp ? 'New code ready (shown below)' : 'New code sent to your email');
    } catch (err) {
      setOtpError((err as ApiFailure).message);
    } finally {
      setResending(false);
    }
  };

  const row = sm ? 'flex-row gap-3.5' : 'gap-3.5';

  if (step === 'otp') {
    return (
      <AuthLayout>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setStep('form');
            setOtp('');
            setOtpError('');
            setDevOtp(null);
          }}
          className="mb-4 flex-row items-center gap-1.5 self-start"
          hitSlop={8}
        >
          <ArrowLeft size={16} color={colors.slate[600]} />
          <Text className="text-sm font-semibold text-slate-600">Back</Text>
        </Pressable>

        <View>
          <Text className="text-xs font-bold uppercase tracking-wider text-brand-orange">Almost there</Text>
          <Text role="heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
            Verify your email
          </Text>
          <Text className="mt-2 text-sm text-slate-500">
            Enter the 6-digit code we sent to <Text className="text-sm font-semibold text-slate-900">{email}</Text>
          </Text>
        </View>

        <View className="mt-8 gap-5">
          {devOtp ? (
            <View className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <Text className="text-xs font-semibold text-amber-800">
                Dev mode (SMTP not configured): your code is{' '}
                <Text className="text-xs font-extrabold tracking-widest text-amber-950">{devOtp}</Text>
              </Text>
            </View>
          ) : null}

          {otpError ? (
            <View className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
              <Text className="text-xs font-semibold text-red-700">{otpError}</Text>
            </View>
          ) : null}

          <OtpInput
            value={otp}
            onChange={setOtp}
            length={6}
            autoFocus
            disabled={submitting}
            error={Boolean(otpError)}
            onComplete={completeWithOtp}
            id="signup-otp"
            label="Email verification code"
          />

          <Button
            testID="signup-verify"
            size="lg"
            variant={isCreator ? 'violet' : 'primary'}
            loading={submitting}
            disabled={otp.length !== 6}
            onPress={() => void completeWithOtp(otp)}
            iconAfter={submitting ? undefined : ArrowRight}
            className="w-full"
          >
            {submitting ? 'Verifying...' : 'Verify & continue'}
          </Button>

          <Pressable accessibilityRole="button" onPress={onResend} disabled={resending || submitting} className="items-center py-1">
            <Text className={`text-sm font-semibold ${resending ? 'text-slate-400' : 'text-brand-orange'}`}>
              {resending ? 'Sending...' : "Didn't get it? Resend code"}
            </Text>
          </Pressable>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout center={false}>
      <View>
        <Text className="text-xs font-bold uppercase tracking-wider text-brand-orange">Get started free</Text>
        <Text role="heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">
          Create your account
        </Text>
        <Text className="mt-2 text-sm text-slate-500">
          Already have an account?{' '}
          <Text accessibilityRole="link" onPress={() => router.push(ROUTES.LOGIN)} className="text-sm font-semibold text-brand-orange">
            Log in
          </Text>
        </Text>
      </View>

      <View className="mt-6 flex-row gap-3">
        {ROLE_OPTIONS.map(({ id, icon: Icon, title, text, active, iconBox, iconColor }) => {
          const selected = form.role === id;
          return (
            <Pressable
              key={id}
              testID={`role-${id}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => set('role', id)}
              className={`relative flex-1 items-start rounded-xl border-2 p-3.5 ${selected ? active : 'border-slate-200'}`}
            >
              {selected && (
                <View className="absolute right-2.5 top-2.5 h-4 w-4 items-center justify-center rounded-full bg-slate-900">
                  <Check size={10} color={colors.white} />
                </View>
              )}
              <View className={`h-8 w-8 items-center justify-center rounded-lg ${iconBox}`}>
                <Icon size={16} color={iconColor} />
              </View>
              <Text className="mt-2 text-sm font-bold text-slate-900">{title}</Text>
              <Text className="text-[11px] text-slate-500">{text}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-5 gap-3.5">
        {formError ? (
          <View className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <Text className="text-xs font-semibold text-red-700">{formError}</Text>
          </View>
        ) : null}

        <Input label="Full name" name="name" icon={User} placeholder="Aarav Verma" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} autoComplete="name" textContentType="name" />

        <View className={row}>
          <Input
            className={sm ? 'flex-1' : ''}
            label="Email"
            name="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon={Mail}
            placeholder="you@example.com"
            value={form.email}
            onChangeText={(v) => set('email', v)}
            error={errors.email}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Input
            className={sm ? 'flex-1' : ''}
            label="Mobile number"
            name="phone"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={10}
            prefix="+91"
            placeholder="9876543210"
            value={form.phone}
            onChangeText={(v) => set('phone', v.replace(/\D/g, ''))}
            error={errors.phone}
            autoComplete="tel-national"
            textContentType="telephoneNumber"
          />
        </View>

        <Input label="City / Area" name="city" icon={MapPin} placeholder="Greater Noida West" value={form.city} onChangeText={(v) => set('city', v)} error={errors.city} />

        {isCreator && (
          <FadeUp className="gap-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-brand-violet">Partner profile</Text>
            <View>
              <Text className="mb-1.5 text-xs font-semibold text-slate-600">Services you offer</Text>
              <View className={width >= 360 ? 'flex-row gap-2' : 'gap-2'}>
                {SERVICE_OPTIONS.map(({ id, label, icon: Icon }) => {
                  const on = form.services.includes(id);
                  return (
                    <Pressable
                      key={id}
                      testID={`service-${id}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      onPress={() => toggleService(id)}
                      className={`flex-1 flex-row items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${on ? 'border-brand-violet' : 'border-slate-200'}`}
                    >
                      <View className={`h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-brand-violet bg-brand-violet' : 'border-slate-300'}`}>
                        {on && <Check size={12} color={colors.white} />}
                      </View>
                      <Icon size={14} color={on ? colors.brand.violet : colors.slate[600]} />
                      <Text className={`text-xs font-semibold ${on ? 'text-brand-violet' : 'text-slate-600'}`}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.services && <Text className="mt-1 text-[11px] font-medium text-red-600">{errors.services}</Text>}
            </View>
            <View className={row}>
              <Select
                className={sm ? 'w-[120px]' : ''}
                label="Experience"
                name="experienceYears"
                value={form.experienceYears}
                onChange={(v) => set('experienceYears', v)}
                options={EXPERIENCE_OPTIONS}
              />
              <Input className={sm ? 'flex-1' : ''} label="Primary gear" name="gear" icon={Wrench} placeholder="Sony A7 IV, 24-70mm, Gimbal" value={form.gear} onChangeText={(v) => set('gear', v)} />
            </View>
          </FadeUp>
        )}

        <View className={row}>
          <View className={sm ? 'flex-1' : ''}>
            <PasswordInput label="Password" name="password" icon={Lock} placeholder="Min. 8 characters" value={form.password} onChangeText={(v) => set('password', v)} error={errors.password} autoComplete="new-password" textContentType="newPassword" />
            {form.password ? (
              <View className="mt-1.5 flex-row items-center gap-2">
                <View className="flex-1 flex-row gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                  ))}
                </View>
                <Text className="text-[10px] font-semibold text-slate-500">{strength.label}</Text>
              </View>
            ) : null}
          </View>
          <PasswordInput
            className={sm ? 'flex-1' : ''}
            label="Confirm password"
            name="confirmPassword"
            icon={Lock}
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChangeText={(v) => set('confirmPassword', v)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </View>

        <View className="pt-1">
          <Checkbox name="agree" checked={form.agree} onChange={(v) => set('agree', v)}>
            <Text className="text-xs text-slate-600">
              I agree to SnapNear&apos;s <Text className="text-xs font-semibold text-slate-900">Terms of Service</Text> and{' '}
              <Text className="text-xs font-semibold text-slate-900">Privacy Policy</Text>
              {isCreator && `, including the ${partnerPct} partner / ${platformPct} platform payout model`}.
            </Text>
          </Checkbox>
          {errors.agree && <Text className="mt-1.5 text-[11px] font-medium text-red-600">{errors.agree}</Text>}
        </View>

        <Text className="text-center text-[11px] leading-4 text-slate-500">
          We&apos;ll email a 6-digit code to verify your address before your account is created.
        </Text>

        <Button
          testID="signup-submit"
          size="lg"
          variant={isCreator ? 'violet' : 'primary'}
          loading={submitting}
          onPress={onSubmitForm}
          iconAfter={submitting ? undefined : ArrowRight}
          className="w-full"
        >
          {submitting ? 'Sending code...' : isCreator ? 'Join as Partner' : 'Create Customer Account'}
        </Button>
      </View>
    </AuthLayout>
  );
}
