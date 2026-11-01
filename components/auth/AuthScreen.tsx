'use client';

import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DEFAULT_PACK_AVATARS } from '@/lib/vibe-avatars';
import {
  digitsFromPhoneInput,
  formatIranPhoneDisplay,
  formatPhoneDigitsForDisplay,
  normalizeIranPhone,
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
type AuthStep = 'form' | 'otp';

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

function defaultAvatarId(): string {
  return DEFAULT_PACK_AVATARS.find((avatar) => avatar.id === 'vibe')?.id ?? DEFAULT_PACK_AVATARS[0]?.id ?? 'vibe';
}

export default function AuthScreen({ mode, callbackUrl, signupSource = 'direct' }: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [avatarId, setAvatarId] = useState(defaultAvatarId);
  const [step, setStep] = useState<AuthStep>('form');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [fieldErrorTarget, setFieldErrorTarget] = useState<'phone' | 'otp' | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

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

  const showFieldError = (target: 'phone' | 'otp', message: string) => {
    setFieldErrorTarget(target);
    setFieldError(message);
  };

  const sendOtp = async (): Promise<boolean> => {
    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      showFieldError('phone', phoneError);
      return false;
    }

    setLoading(true);
    clearFeedback();

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
        const retry = Number(json?.data?.retryAfterSeconds);
        if (Number.isFinite(retry) && retry > 0) {
          setResendSeconds(retry);
        }
        if (fieldLooksLikePhone(json?.error)) {
          showFieldError('phone', String(json.error));
        } else {
          setError(json?.error || 'ارسال کد ناموفق بود. دوباره تلاش کن.');
        }
        return false;
      }

      const retry = Number(json?.data?.retryAfterSeconds);
      setResendSeconds(Number.isFinite(retry) && retry > 0 ? retry : 60);
      setStep('otp');
      setOtp('');
      setNotice('کد تأیید به شماره موبایلت پیامک شد.');
      if (typeof json?.data?.devCode === 'string' && process.env.NODE_ENV !== 'production') {
        setNotice(`کد تأیید (حالت توسعه): ${fa(json.data.devCode)}`);
      }
      return true;
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کن.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFormContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    await sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const resetToForm = () => {
    setStep('form');
    setOtp('');
    setResendSeconds(0);
    clearFeedback();
  };

  const displayPhone = useMemo(() => {
    const normalized = normalizeIranPhone(phone);
    return normalized ? formatIranPhoneDisplay(normalized) : formatPhoneDigitsForDisplay(phone);
  }, [phone]);

  return (
    <AuthShell mode={isRegister ? 'register' : 'login'}>
      <div className="flex flex-col gap-6">
        <AuthBrandHeader
          title={isRegister ? 'ساخت حساب' : 'ورود'}
          subtitle={
            isRegister
              ? 'با شماره موبایل حساب بساز و لیست‌ها را شروع کن.'
              : 'با شماره موبایل وارد شو؛ کد تأیید پیامک می‌شود.'
          }
        />

        <AuthFormCard>
          <form
            onSubmit={step === 'form' ? handleFormContinue : handleVerifyOtp}
            className="flex flex-col gap-4"
            noValidate
          >
            {step === 'form' ? (
              <>
                {isRegister ? (
                  <>
                    <RegisterAvatarPicker value={avatarId} onChange={setAvatarId} />
                    <AuthField
                      id="auth-name"
                      label="نام"
                      hint="اختیاری — در پروفایل نمایش داده می‌شود"
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثلاً رامین"
                      autoComplete="name"
                    />
                  </>
                ) : null}

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
                  enterKeyHint="send"
                  required
                  dir="ltr"
                  autoFocus
                  error={fieldErrorTarget === 'phone' ? fieldError : undefined}
                />
              </>
            ) : (
              <>
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
              </>
            )}

            {notice ? (
              <p role="status" className="wibe-caption text-muted-foreground">
                {notice}
              </p>
            ) : null}

            {error ? <AuthErrorAlert message={error} /> : null}

            <AuthPrimaryButton
              loading={loading}
              loadingLabel={step === 'form' ? 'در حال ارسال کد…' : isRegister ? 'در حال ساخت حساب…' : 'در حال ورود…'}
            >
              {step === 'form' ? (
                'دریافت کد تأیید'
              ) : (
                <>
                  {isRegister ? 'تأیید و ساخت حساب' : 'ورود'}
                  <ArrowLeft className="size-4" aria-hidden />
                </>
              )}
            </AuthPrimaryButton>
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
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4! py-3! wibe-small text-destructive"
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
      className="w-full"
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
