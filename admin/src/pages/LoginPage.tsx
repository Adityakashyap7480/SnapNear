import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';
import AccountNotice from '../components/AccountNotice';
import Button from '../components/ui/Button';
import { Input, PasswordInput } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { APP_HOME, APP_URL, ROLES } from '../config/constants';
import { ROUTES } from '../config/routes';
import type { ApiFailure } from '../types';
import { EMAIL_MESSAGE, isValidEmail } from '../utils/validators';

type Form = { email: string; password: string };

export default function LoginPage() {
  const { login, accountNotice, setAccountNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<Form>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const update = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const next: Partial<Form> = {};
    if (!isValidEmail(form.email)) next.email = EMAIL_MESSAGE;
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setAccountNotice(null);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === ROLES.SUPER_ADMIN) {
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from && from !== ROUTES.LOGIN ? from : ROUTES.PLATFORM, { replace: true });
      } else {
        window.location.replace(APP_HOME[user.role]);
      }
    } catch (err) {
      const failure = err as ApiFailure;
      if (failure.code?.startsWith('ACCOUNT_')) {
        setAccountNotice({ code: failure.code, message: failure.message, account: failure.account, email: form.email.trim() });
      } else {
        setFormError(failure.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <p className="text-xs font-bold tracking-wider text-brand-orange uppercase">Welcome back</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">Log in to SnapNear</h2>
        <p className="mt-2 text-sm text-slate-500">One secure login for customers, photographer partners and the owner.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {accountNotice && <AccountNotice notice={accountNotice} />}
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {formError}
          </div>
        )}

        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          value={form.email}
          onChange={update}
          error={errors.email}
          autoFocus
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={Lock}
          value={form.password}
          onChange={update}
          error={errors.password}
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? 'Signing in...' : 'Log in'}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold text-slate-400 uppercase">
        <span className="h-px flex-1 bg-slate-200" /> New to SnapNear? <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`${APP_URL}/signup?role=customer`}
          className="rounded-xl border border-slate-200 p-3 text-center transition hover:border-brand-orange hover:bg-orange-50/50"
        >
          <p className="text-xs font-bold text-slate-900">Book a shoot</p>
          <p className="text-[11px] text-slate-500">Create customer account</p>
        </a>
        <a
          href={`${APP_URL}/signup?role=partner`}
          className="rounded-xl border border-slate-200 p-3 text-center transition hover:border-brand-violet hover:bg-indigo-50/50"
        >
          <p className="text-xs font-bold text-slate-900">Become a partner</p>
          <p className="text-[11px] text-slate-500">Get paid shoots near you</p>
        </a>
      </div>
    </AuthLayout>
  );
}
