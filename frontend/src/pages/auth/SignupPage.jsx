import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarPlus, Camera, Check, Lock, Mail, MapPin, User, Video, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import { Input, PasswordInput, Select } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { MESSAGES, isValidEmail, isValidPhone } from '../../utils/validators';

const ROLE_OPTIONS = [
  {
    id: 'client',
    icon: CalendarPlus,
    title: 'Book a shoot',
    text: 'Photographer at your doorstep',
    active: 'border-brand-orange bg-orange-50/70 ring-brand-orange',
    iconColor: 'bg-orange-100 text-brand-orange',
  },
  {
    id: 'creator',
    icon: Briefcase,
    title: "I'm a photographer",
    text: 'Accept nearby shoots, earn 80%',
    active: 'border-brand-violet bg-indigo-50/70 ring-brand-violet',
    iconColor: 'bg-indigo-100 text-brand-violet',
  },
];

const SERVICE_OPTIONS = [
  { id: 'photo', label: 'Photography', icon: Camera },
  { id: 'video', label: 'Videography', icon: Video },
];

function passwordStrength(pw) {
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

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    role: ['partner', 'creator'].includes(params.get('role')) ? 'creator' : 'client',
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    services: ['photo'],
    experienceYears: '1',
    gear: '',
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const isCreator = form.role === 'creator';

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError('');
  };
  const update = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

  const toggleService = (id) => {
    const has = form.services.includes(id);
    set('services', has ? form.services.filter((s) => s !== id) : [...form.services, id]);
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidEmail(form.email)) next.email = MESSAGES.EMAIL;
    if (!isValidPhone(form.phone)) next.phone = MESSAGES.PHONE;
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      next.password = 'Use a mix of letters and numbers';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    if (isCreator && form.services.length === 0) next.services = 'Select at least one service';
    if (!form.agree) next.agree = 'Please accept the terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        password: form.password,
        ...(isCreator && {
          services: form.services,
          experienceYears: Number(form.experienceYears),
          gear: form.gear.trim(),
        }),
      };
      const user = await signup(payload);
      toast.success(`Welcome to SnapNear, ${user.name.split(' ')[0]}!`);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      const fieldErrors = Object.fromEntries((err.details || []).map((d) => [d.field, d.message]));
      setErrors(fieldErrors);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <p className="text-xs font-bold tracking-wider text-brand-orange uppercase">Get started free</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-2 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-orange hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {ROLE_OPTIONS.map(({ id, icon: Icon, title, text, active, iconColor }) => {
          const selected = form.role === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => set('role', id)}
              className={`relative flex flex-col items-start justify-start rounded-xl border-2 p-3.5 text-left transition ${
                selected ? `${active} ring-1` : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {selected && (
                <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor}`}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2 text-sm font-bold text-slate-900">{title}</p>
              <p className="text-[11px] text-slate-500">{text}</p>
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3.5">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {formError}
          </div>
        )}

        <Input label="Full name" name="name" icon={User} placeholder="Aarav Verma" value={form.name} onChange={update} error={errors.name} autoComplete="name" />

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Input label="Email" name="email" type="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={update} error={errors.email} autoComplete="email" />
          <Input
            label="Mobile number"
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            prefix="+91"
            placeholder="9876543210"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
            error={errors.phone}
            autoComplete="tel-national"
          />
        </div>

        <Input label="City / Area" name="city" icon={MapPin} placeholder="Greater Noida West" value={form.city} onChange={update} error={errors.city} />

        {isCreator && (
          <div className="animate-fade-up space-y-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <p className="text-[11px] font-bold tracking-wider text-brand-violet uppercase">Partner profile</p>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">Services you offer</p>
              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                {SERVICE_OPTIONS.map(({ id, label, icon: Icon }) => {
                  const on = form.services.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleService(id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        on ? 'border-brand-violet bg-white text-brand-violet shadow-sm' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-brand-violet bg-brand-violet text-white' : 'border-slate-300'}`}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
                    </button>
                  );
                })}
              </div>
              {errors.services && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.services}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[120px_1fr]">
              <Select label="Experience" name="experienceYears" value={form.experienceYears} onChange={update}>
                {[0, 1, 2, 3, 4, 5, 6, 8, 10, 15].map((y) => (
                  <option key={y} value={y}>
                    {y === 0 ? '< 1 year' : `${y}+ years`}
                  </option>
                ))}
              </Select>
              <Input label="Primary gear" name="gear" icon={Wrench} placeholder="Sony A7 IV, 24-70mm, Gimbal" value={form.gear} onChange={update} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <PasswordInput label="Password" name="password" icon={Lock} placeholder="Min. 8 characters" value={form.password} onChange={update} error={errors.password} autoComplete="new-password" />
            {form.password && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{strength.label}</span>
              </div>
            )}
          </div>
          <PasswordInput label="Confirm password" name="confirmPassword" icon={Lock} placeholder="Re-enter password" value={form.confirmPassword} onChange={update} error={errors.confirmPassword} autoComplete="new-password" />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 pt-1">
          <input type="checkbox" name="agree" checked={form.agree} onChange={update} className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-brand-orange" />
          <span className="text-xs text-slate-600">
            I agree to SnapNear&apos;s <span className="font-semibold text-slate-900">Terms of Service</span> and{' '}
            <span className="font-semibold text-slate-900">Privacy Policy</span>
            {isCreator && ', including the 80% partner / 20% platform payout model'}.
          </span>
        </label>
        {errors.agree && <p className="-mt-2 text-[11px] font-medium text-red-600">{errors.agree}</p>}

        <Button type="submit" size="lg" variant={isCreator ? 'violet' : 'primary'} loading={submitting} className="w-full">
          {submitting ? 'Creating account...' : isCreator ? 'Join as Partner' : 'Create Customer Account'}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
