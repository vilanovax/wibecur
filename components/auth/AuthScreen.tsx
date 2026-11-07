'use client';

import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, MessageSquare } from 'lucide-react';
import { DEFAULT_PACK_AVATARS } from '@/lib/vibe-avatars';
import {
  digitsFromPhoneInput,
  formatIranPhoneDisplay,
  formatPhoneDigitsForDisplay,
  normalizeIranPhone,
  validateAuthPassword,
  validatePhoneInput,
} from '@/lib/phone-auth';
import { OTP_LENGTH, normalizeOtpInput, validateOtpInput } from '@/lib/otp-shared';
import { cn, fa } from '@/lib/utils';
import { trackSignupComplete, type SignupSource } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthShell from './AuthShell';

const RegisterAvatarPicker = dynamic(() => import('./RegisterAvatarPicker'), {
  loading: () => <div className="h-16 rounded-xl bg-muted" aria-hidden />,
});

export type AuthMode = 'login' | 'register';
type AuthStep = 'form' | 'method' | 'otp' | 'password';

interface AuthScreenProps {
  mode: AuthMode;
  callbackUrl: string;
  signupSource?: SignupSource;
  /** بازیابی شماره بعد از submit ناخواستهٔ HTML (GET با ?tel=) */
  initialPhone?: string;
  initialName?: string;
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

function defaultAvatarId(): string {
  return DEFAULT_PACK_AVATARS.find((avatar) => avatar.id === 'vibe')?.id ?? DEFAULT_PACK_AVATARS[0]?.id ?? 'vibe';
}

export default function AuthScreen({
  mode,
  callbackUrl,
  signupSource = 'direct',
  initialPhone = '',
  initialName = '',
}: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [phone, setPhone] = useState(() => digitsFromPhoneInput(initialPhone));
  const [name, setName] = useState(() => initialName.trim().slice(0, 80));
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarId, setAvatarId] = useState(defaultAvatarId);
  const [step, setStep] = useState<AuthStep>('form');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [fieldErrorTarget, setFieldErrorTarget] = useState<'phone' | 'otp' | 'password' | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  // اگر مرورگر قبل از hydrate فرم را GET کرده، شماره را از query نگه دار و URL را پاک کن.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('tel') && !url.searchParams.has('name')) return;
    url.searchParams.delete('tel');
    url.searchParams.delete('name');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', next);
    if (initialPhone && !validatePhoneInput(digitsFromPhoneInput(initialPhone))) {
      setNotice('شماره از قبل پر شده — برای دریافت کد، دکمه را دوباره بزن.');
    }
  }, [initialPhone]);

  const handlePhoneChange = (value: string) => {
    setPhone(digitsFromPhoneInput(value));
    if (fieldErrorTarget === 'phone') {
      setFieldError('');
      setFieldErrorTarget(null);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(normalizeOtpInput(value));
    if (fieldErrorTarget === 'otp') {
      setFieldError('');
      setFieldErrorTarget(null);
    }
  };

  const sourceQuery =
    signupSource !== 'direct' ? `&source=${encodeURIComponent(signupSource)}` : '';
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}${sourceQuery}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}${sourceQuery}`;
  const guestHref = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/';

  const clearFeedback = () => {
    setError('');
    setFieldError('');
    setFieldErrorTarget(null);
    setNotice('');
  };

  const showFieldError = (target: 'phone' | 'otp' | 'password', message: string) => {
    setFieldErrorTarget(target);
    setFieldError(message);
  };

  const sendOtp = async (): Promise<boolean> => {
    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      showFieldError('phone', phoneError);
      setStep('form');
      return false;
    }

    setLoading(true);
    clearFeedback();
    setNotice('در حال ارسال کد تأیید…');

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          purpose: isRegister ? 'register' : 'login',
          ...(isRegister
            ? {
                name: name.trim() || undefined,
                avatarId,
              }
            : {}),
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setNotice('');
        const retry = Number(json?.data?.retryAfterSeconds);
        if (Number.isFinite(retry) && retry > 0) {
          setResendSeconds(retry);
        }
        const message = String(json?.error || 'ارسال کد ناموفق بود. دوباره تلاش کن.');
        if (fieldLooksLikePhone(message)) {
          showFieldError('phone', message);
          setStep('form');
        } else {
          setError(message);
        }
        return false;
      }

      const retry = Number(json?.data?.retryAfterSeconds);
      setResendSeconds(Number.isFinite(retry) && retry > 0 ? retry : 60);
      setStep('otp');
      setOtp('');
      let successNotice = 'کد تأیید به شماره موبایلت پیامک شد. کد ۵ رقمی را وارد کن.';
      if (typeof json?.data?.devCode === 'string' && process.env.NODE_ENV !== 'production') {
        successNotice = `کد تأیید (حالت توسعه): ${fa(json.data.devCode)}`;
      }
      setNotice(successNotice);
      return true;
    } catch {
      setNotice('');
      setError('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFormContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearFeedback();

    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      showFieldError('phone', phoneError);
      return;
    }

    if (isRegister) {
      await sendOtp();
      return;
    }

    setStep('method');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearFeedback();

    const otpError = validateOtpInput(otp);
    if (otpError) {
      showFieldError('otp', otpError);
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        phone,
        otp: normalizeOtpInput(otp),
        redirect: false,
      });

      if (result?.error) {
        setError('کد تأیید نادرست است یا منقضی شده');
        return;
      }

      if (isRegister) {
        trackSignupComplete(signupSource);
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearFeedback();

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      showFieldError('password', passwordError);
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

  const resetToForm = () => {
    setStep('form');
    setOtp('');
    setPassword('');
    setResendSeconds(0);
    clearFeedback();
  };

  const backToMethod = () => {
    setStep('method');
    setOtp('');
    setPassword('');
    setResendSeconds(0);
    clearFeedback();
  };

  const displayPhone = useMemo(() => {
    const normalized = normalizeIranPhone(phone);
    return normalized ? formatIranPhoneDisplay(normalized) : formatPhoneDigitsForDisplay(phone);
  }, [phone]);

  const onSubmit =
    step === 'form'
      ? handleFormContinue
      : step === 'otp'
        ? handleVerifyOtp
        : step === 'password'
          ? handlePasswordLogin
          : (e: React.FormEvent) => e.preventDefault();

  return (
    <AuthShell mode={isRegister ? 'register' : 'login'}>
      <div className="flex flex-col gap-4 lg:gap-6">
        <AuthBrandHeader
          title={isRegister ? 'ساخت حساب' : 'ورود'}
          subtitle={
            isRegister
              ? 'با شماره موبایل حساب بساز و لیست‌ها را شروع کن.'
              : 'با شماره موبایل وارد شو — کد پیامک یا رمز عبور.'
          }
        />

        <AuthFormCard>
          <form
            method="post"
            action="#"
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            {step === 'form' ? (
              <>
                {/* موبایل SE: شماره + CTA اول؛ آواتار/نام اختیاری پایین‌تر */}
                <AuthField
                  id="auth-phone"
                  label="شماره موبایل"
                  type="tel"
                  inputMode="tel"
                  name="tel"
                  value={formatPhoneDigitsForDisplay(phone)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
                  autoComplete="tel"
                  enterKeyHint="next"
                  required
                  dir="ltr"
                  autoFocus
                  disabled={loading}
                  error={fieldErrorTarget === 'phone' ? fieldError : undefined}
                />
              </>
            ) : null}

            {step !== 'form' ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4! py-2!">
                <div className="min-w-0">
                  <p className="wibe-caption text-muted-foreground">شماره موبایل</p>
                  <p className="truncate wibe-small font-medium text-foreground" dir="ltr">
                    {displayPhone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetToForm}
                  className="flex min-h-11 shrink-0 items-center px-2! wibe-small font-medium text-brand"
                >
                  تغییر
                </button>
              </div>
            ) : null}

            {step === 'method' ? (
              <div className="flex flex-col gap-3">
                <p className="wibe-small text-muted-foreground">چطور می‌خواهی وارد شوی؟</p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    void sendOtp();
                  }}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-4! py-3! text-start transition-colors hover:bg-muted"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <MessageSquare className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="wibe-small font-medium text-foreground">کد پیامک</span>
                    <span className="wibe-caption text-muted-foreground">کد ۵ رقمی به موبایلت می‌آید</span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    clearFeedback();
                    setPassword('');
                    setStep('password');
                  }}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-4! py-3! text-start transition-colors hover:bg-muted"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <KeyRound className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="wibe-small font-medium text-foreground">رمز عبور</span>
                    <span className="wibe-caption text-muted-foreground">اگر قبلاً در پروفایل رمز گذاشتی</span>
                  </span>
                </button>
              </div>
            ) : null}

            {step === 'otp' ? (
              <>
                <AuthField
                  id="auth-otp"
                  label="کد تأیید"
                  type="text"
                  inputMode="numeric"
                  name="one-time-code"
                  value={otp ? fa(otp) : ''}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder={'۰'.repeat(OTP_LENGTH)}
                  autoComplete="one-time-code"
                  enterKeyHint="done"
                  required
                  maxLength={OTP_LENGTH}
                  dir="ltr"
                  autoFocus
                  error={fieldErrorTarget === 'otp' ? fieldError : undefined}
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="wibe-caption text-muted-foreground">کد را دریافت نکردی؟</p>
                  <button
                    type="button"
                    disabled={loading || resendSeconds > 0}
                    onClick={() => {
                      void sendOtp();
                    }}
                    className="flex min-h-11 items-center px-2! wibe-caption font-medium text-brand disabled:text-muted-foreground"
                  >
                    {resendSeconds > 0 ? `ارسال دوباره (${fa(resendSeconds)})` : 'ارسال دوباره'}
                  </button>
                </div>

                {!isRegister ? (
                  <button
                    type="button"
                    onClick={backToMethod}
                    className="flex min-h-11 items-center justify-center wibe-caption font-medium text-muted-foreground hover:text-foreground"
                  >
                    انتخاب روش دیگر
                  </button>
                ) : null}
              </>
            ) : null}

            {step === 'password' ? (
              <>
                <AuthField
                  id="auth-password"
                  label="رمز عبور"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrorTarget === 'password') {
                      setFieldError('');
                      setFieldErrorTarget(null);
                    }
                  }}
                  placeholder="رمز عبور"
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  minLength={6}
                  dir="ltr"
                  autoFocus
                  error={fieldErrorTarget === 'password' ? fieldError : undefined}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute end-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" strokeWidth={1.5} />
                      ) : (
                        <Eye className="size-5" strokeWidth={1.5} />
                      )}
                    </button>
                  }
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      void sendOtp();
                    }}
                    className="flex min-h-11 items-center px-2! wibe-caption font-medium text-brand"
                  >
                    فراموشی رمز؟ ورود با کد
                  </button>
                  <button
                    type="button"
                    onClick={backToMethod}
                    className="flex min-h-11 items-center px-2! wibe-caption font-medium text-muted-foreground hover:text-foreground"
                  >
                    روش دیگر
                  </button>
                </div>
              </>
            ) : null}

            {notice ? <AuthStatusNotice message={notice} tone={error ? 'muted' : 'success'} /> : null}

            {error ? <AuthErrorAlert message={error} /> : null}

            {step === 'form' || step === 'otp' || step === 'password' ? (
              <AuthPrimaryButton
                loading={loading}
                loadingLabel={
                  step === 'form'
                    ? isRegister
                      ? 'در حال ارسال کد…'
                      : 'در حال ادامه…'
                    : step === 'otp'
                      ? isRegister
                        ? 'در حال ساخت حساب…'
                        : 'در حال ورود…'
                      : 'در حال ورود…'
                }
              >
                {step === 'form' ? (
                  isRegister ? (
                    'دریافت کد تأیید'
                  ) : (
                    'ادامه'
                  )
                ) : (
                  <>
                    {isRegister ? 'تأیید و ساخت حساب' : 'ورود'}
                    <ArrowLeft className="size-4" aria-hidden />
                  </>
                )}
              </AuthPrimaryButton>
            ) : null}

            {step === 'form' && isRegister ? (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <p className="wibe-caption text-muted-foreground">اختیاری — بعداً هم می‌شود عوض کرد</p>
                <AuthField
                  id="auth-name"
                  label="نام"
                  hint="در پروفایل نمایش داده می‌شود"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً رامین"
                  autoComplete="name"
                  disabled={loading}
                />
                <RegisterAvatarPicker value={avatarId} onChange={setAvatarId} />
              </div>
            ) : null}

            {step === 'method' && loading ? (
              <div className="flex min-h-11 items-center justify-center gap-2 wibe-small text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                در حال ارسال کد…
              </div>
            ) : null}
          </form>

          {!isRegister ? (
            <Link
              href={guestHref}
              className="flex min-h-11 items-center justify-center wibe-small text-muted-foreground hover:text-foreground"
            >
              بعداً وارد می‌شوم
            </Link>
          ) : null}
        </AuthFormCard>

        <AuthFooter
          legal={<AuthLegalNotice mode={isRegister ? 'register' : 'login'} />}
          prompt={isRegister ? 'حساب داری؟' : 'حساب نداری؟'}
          actionHref={isRegister ? loginHref : registerHref}
          actionLabel={isRegister ? 'ورود' : 'ثبت‌نام'}
        />
      </div>
    </AuthShell>
  );
}

function fieldLooksLikePhone(error: unknown): boolean {
  return typeof error === 'string' && error.includes('موبایل');
}

function AuthBrandHeader({
  title = 'وایب',
  subtitle = 'لیست‌های خوب را پیدا کن، ذخیره کن، بعداً برگرد.',
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 text-center lg:text-start', className)}>
      <h1 className="wibe-h2">{title}</h1>
      <p className="text-pretty wibe-small text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function AuthFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-popover/95 p-5! shadow-overlay backdrop-blur-sm">
      {children}
    </div>
  );
}

function AuthFooter({
  legal,
  prompt,
  actionHref,
  actionLabel,
}: {
  legal: React.ReactNode;
  prompt: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {legal}
      <p className="flex flex-wrap items-center justify-center gap-1 wibe-small text-muted-foreground">
        <span>{prompt}</span>
        <Link
          href={actionHref}
          className="inline-flex min-h-11 items-center px-2! font-medium text-brand hover:underline"
        >
          {actionLabel}
        </Link>
      </p>
    </div>
  );
}

function AuthLegalNotice({ mode }: { mode: 'login' | 'register' }) {
  const verb = mode === 'register' ? 'ثبت‌نام' : 'ورود';
  return (
    <p className="text-pretty wibe-caption text-muted-foreground">
      {verb} یعنی پذیرش قوانین و حریم خصوصی
    </p>
  );
}

function AuthErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4! py-3! wibe-small text-destructive"
    >
      {message}
    </div>
  );
}

function AuthStatusNotice({
  message,
  tone = 'success',
}: {
  message: string;
  tone?: 'success' | 'muted';
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-xl px-4! py-3! wibe-small',
        tone === 'success'
          ? 'border border-border bg-muted text-foreground'
          : 'text-muted-foreground'
      )}
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
    <Button
      type="submit"
      variant="brand"
      size="lg"
      disabled={loading}
      aria-busy={loading}
      className="min-h-12 w-full focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {loading ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function AuthField({
  label,
  hint,
  trailing,
  className = '',
  error,
  hideLabel = false,
  id,
  dir,
  ...props
}: {
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  className?: string;
  error?: string;
  hideLabel?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id || `auth-field-${label.replace(/\s+/g, '-').slice(0, 40)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const ltr = dir === 'ltr';

  return (
    <div className="flex flex-col gap-2">
      {!hideLabel && label ? (
        <label htmlFor={fieldId} className="flex flex-col gap-1">
          <span className="wibe-small font-medium text-foreground">{label}</span>
          {hint ? <span className="wibe-caption text-muted-foreground">{hint}</span> : null}
        </label>
      ) : null}
      <div className="relative" dir={ltr ? 'ltr' : undefined}>
        <Input
          {...props}
          id={fieldId}
          dir={dir}
          aria-label={hideLabel && label ? label : props['aria-label']}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'h-12! rounded-xl! wibe-body ps-4!',
            trailing ? 'pe-12!' : 'pe-4!',
            ltr && 'text-start',
            className,
          )}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="wibe-small text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
