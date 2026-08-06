'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import {
  formatIranPhoneDisplay,
  normalizeIranPhone,
  validateAuthPassword,
  validatePhoneInput,
} from '@/lib/phone-auth';
import { persianToEnglish } from '@/lib/utils/number-converter';
import RegisterAvatarPicker, {
  getDefaultRegisterAvatarId,
} from './RegisterAvatarPicker';
import AuthShell from './AuthShell';
import { trackSignupComplete, type SignupSource } from '@/lib/analytics';

export type AuthMode = 'login' | 'register';
type LoginStep = 'phone' | 'password';

interface AuthScreenProps {
  mode: AuthMode;
  callbackUrl: string;
  signupSource?: SignupSource;
}

const SIGNUP_SOURCES: SignupSource[] = [
  'home_strip',
  'login_banner',
  'item_gate',
  'bookmark_gate',
  'home_empty',
  'direct',
];

function parseSignupSource(raw?: string | null): SignupSource {
  if (raw && SIGNUP_SOURCES.includes(raw as SignupSource)) {
    return raw as SignupSource;
  }
  return 'direct';
}

export function resolveSignupSource(raw?: string | null): SignupSource {
  return parseSignupSource(raw);
}

export default function AuthScreen({ mode, callbackUrl, signupSource = 'direct' }: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState(getDefaultRegisterAvatarId);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhone(persianToEnglish(value));
  };

  const passwordStrength = getPasswordStrength(password);
  const sourceQuery =
    signupSource !== 'direct' ? `&source=${encodeURIComponent(signupSource)}` : '';
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}${sourceQuery}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}${sourceQuery}`;
  const guestHref = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/';

  const handlePhoneContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoginStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('شماره یا رمز عبور اشتباه است');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password,
          name: name.trim() || undefined,
          avatarId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'خطا در ثبت‌نام');
        return;
      }

      const result = await signIn('credentials', {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('ثبت‌نام شد ولی ورود ناموفق بود — دوباره تلاش کن');
        return;
      }

      trackSignupComplete(signupSource);
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  };

  const resetLoginStep = () => {
    setLoginStep('phone');
    setPassword('');
    setError('');
  };

  const displayPhone = useMemo(() => {
    const normalized = normalizeIranPhone(phone);
    return normalized ? formatIranPhoneDisplay(normalized) : phone;
  }, [phone]);

  if (!isRegister) {
    return (
      <AuthShell>
        <AuthBrandHeader />

        <AuthFormCard>
          <form
            onSubmit={loginStep === 'phone' ? handlePhoneContinue : handleLogin}
            className="space-y-4"
          >
            {loginStep === 'phone' ? (
              <AuthField
                label="شماره موبایل"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
                autoComplete="tel"
                required
                dir="ltr"
                className="text-left tracking-wide"
                autoFocus
                hasError={Boolean(error)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">شماره موبایل</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-gray-900" dir="ltr">
                      {displayPhone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetLoginStep}
                    className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark"
                  >
                    تغییر
                  </button>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                    <button
                      type="button"
                      onClick={() =>
                        setError(
                          'بازیابی رمز عبور به‌زودی اضافه می‌شود. فعلاً ثبت‌نام کن یا با پشتیبانی تماس بگیر.'
                        )
                      }
                      className="text-xs font-medium text-primary transition-colors hover:text-primary-dark"
                    >
                      فراموشی رمز؟
                    </button>
                  </div>
                  <AuthField
                    label=""
                    hideLabel
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    dir="ltr"
                    className="pe-11 text-left"
                    autoFocus
                    hasError={Boolean(error)}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[1.125rem] w-[1.125rem]" />
                        ) : (
                          <Eye className="h-[1.125rem] w-[1.125rem]" />
                        )}
                      </button>
                    }
                  />
                </div>
              </>
            )}

            {error && <AuthErrorAlert message={error} />}

            <AuthPrimaryButton loading={loading} loadingLabel="در حال ورود…">
              {loginStep === 'phone' ? (
                'ادامه'
              ) : (
                <>
                  ورود
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </>
              )}
            </AuthPrimaryButton>
          </form>

          <p className="mt-4 text-center">
            <Link
              href={guestHref}
              className="text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              بعداً وارد می‌شوم
            </Link>
          </p>
        </AuthFormCard>

        <AuthLegalNotice mode="login" />

        <p className="mt-4 text-center text-sm text-gray-500">
          حساب نداری؟{' '}
          <Link
            href={registerHref}
            className="font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
          >
            ثبت‌نام
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthBrandHeader
        title="ساخت حساب"
        subtitle="چند ثانیه تا شروع کشف لیست‌ها"
      />

      <AuthFormCard>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <RegisterAvatarPicker value={avatarId} onChange={setAvatarId} />

          <AuthField
            label="نام"
            hint="اختیاری — در پروفایل نمایش داده می‌شود"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً رامین"
            autoComplete="name"
          />

          <AuthField
            label="شماره موبایل"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
            autoComplete="tel"
            required
            dir="ltr"
            className="text-left tracking-wide"
            autoFocus
            hasError={Boolean(error)}
          />

          <div>
            <AuthField
              label="رمز عبور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
              autoComplete="new-password"
              required
              minLength={6}
              dir="ltr"
              className="pe-11 text-left"
              hasError={Boolean(error)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                >
                  {showPassword ? (
                    <EyeOff className="h-[1.125rem] w-[1.125rem]" />
                  ) : (
                    <Eye className="h-[1.125rem] w-[1.125rem]" />
                  )}
                </button>
              }
            />
            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= i ? passwordStrengthColor(passwordStrength) : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 wibe-caption text-gray-500">{passwordStrengthLabel(passwordStrength)}</p>
              </div>
            )}
          </div>

          {error && <AuthErrorAlert message={error} />}

          <AuthPrimaryButton loading={loading} loadingLabel="در حال ساخت حساب…">
            <>
              ساخت حساب
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </>
          </AuthPrimaryButton>
        </form>
      </AuthFormCard>

      <AuthLegalNotice mode="register" />

      <p className="mt-4 text-center text-sm text-gray-500">
        حساب داری؟{' '}
        <Link
          href={loginHref}
          className="font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
        >
          ورود
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthBrandHeader({
  title = 'وایب',
  subtitle = 'لیست‌های خوب را پیدا کن، ذخیره کن، بعداً برگرد.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
        <Bookmark className="h-6 w-6 fill-white text-white" strokeWidth={2.25} />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{subtitle}</p>
    </div>
  );
}

function AuthFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border border-gray-100/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      {children}
    </div>
  );
}

function AuthLegalNotice({ mode }: { mode: 'login' | 'register' }) {
  const verb = mode === 'register' ? 'ثبت‌نام' : 'ورود';
  return (
    <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
      {verb} یعنی پذیرش قوانین و حریم خصوصی
    </p>
  );
}

function AuthErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
    >
      {message}
    </div>
  );
}

function AuthPrimaryButton({
  children,
  loading,
  loadingLabel,
}: {
  children: React.ReactNode;
  loading: boolean;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function AuthField({
  label,
  hint,
  icon,
  trailing,
  className = '',
  hasError = false,
  hideLabel = false,
  id,
  ...props
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  hasError?: boolean;
  hideLabel?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId =
    id ||
    (label
      ? `auth-field-${label.replace(/\s+/g, '-').slice(0, 40)}`
      : undefined);

  return (
    <div>
      {!hideLabel && label ? (
        <label htmlFor={fieldId} className="mb-2 block">
          <span className="wibe-small font-medium text-gray-700">{label}</span>
          {hint && <span className="mt-0.5 block wibe-caption text-gray-400">{hint}</span>}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute start-3.5 text-gray-400">{icon}</span>
        )}
        <input
          {...props}
          id={fieldId}
          aria-label={hideLabel && label ? label : props['aria-label']}
          aria-invalid={hasError || undefined}
          className={`w-full rounded-xl border bg-white py-3.5 wibe-body text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15 ${
            icon ? 'ps-11 pe-3' : 'px-3.5'
          } ${
            hasError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'
          } ${className}`}
        />
        {trailing}
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): number {
  if (password.length >= 10) return 3;
  if (password.length >= 8) return 2;
  if (password.length >= 6) return 1;
  return 0;
}

function passwordStrengthColor(level: number): string {
  if (level >= 3) return 'bg-emerald-500';
  if (level >= 2) return 'bg-amber-400';
  return 'bg-orange-400';
}

function passwordStrengthLabel(level: number): string {
  if (level >= 3) return 'رمز قوی';
  if (level >= 2) return 'رمز مناسب';
  if (level >= 1) return 'حداقل ۶ کاراکتر — قابل قبول';
  return 'خیلی کوتاه';
}
