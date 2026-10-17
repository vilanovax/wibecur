'use client';

import dynamic from 'next/dynamic';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, Eye, EyeOff, Loader2 } from 'lucide-react';
import { DEFAULT_PACK_AVATARS } from '@/lib/vibe-avatars';
import {
  digitsFromPhoneInput,
  formatIranPhoneDisplay,
  formatPhoneDigitsForDisplay,
  normalizeIranPhone,
  validateAuthPassword,
  validatePhoneInput,
} from '@/lib/phone-auth';
import { cn } from '@/lib/utils';
import { trackSignupComplete, type SignupSource } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthShell from './AuthShell';

const RegisterAvatarPicker = dynamic(() => import('./RegisterAvatarPicker'), {
  loading: () => <div className="h-16 rounded-xl bg-muted" aria-hidden />,
});

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

function defaultAvatarId(): string {
  return DEFAULT_PACK_AVATARS.find((avatar) => avatar.id === 'vibe')?.id ?? DEFAULT_PACK_AVATARS[0]?.id ?? 'vibe';
}

export default function AuthScreen({ mode, callbackUrl, signupSource = 'direct' }: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState(defaultAvatarId);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [fieldErrorTarget, setFieldErrorTarget] = useState<'phone' | 'password' | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhone(digitsFromPhoneInput(value));
    if (fieldErrorTarget === 'phone') {
      setFieldError('');
      setFieldErrorTarget(null);
    }
  };

  const passwordStrength = getPasswordStrength(password);
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

  const showFieldError = (target: 'phone' | 'password', message: string) => {
    setFieldErrorTarget(target);
    setFieldError(message);
  };

  const handlePhoneContinue = (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      showFieldError('phone', phoneError);
      return;
    }

    setLoginStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      showFieldError('phone', phoneError);
      return;
    }

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      showFieldError('password', passwordError);
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
    clearFeedback();
  };

  const displayPhone = useMemo(() => {
    const normalized = normalizeIranPhone(phone);
    return normalized ? formatIranPhoneDisplay(normalized) : formatPhoneDigitsForDisplay(phone);
  }, [phone]);

  if (!isRegister) {
    return (
      <AuthShell>
        <div className="flex flex-col gap-6">
          <AuthBrandHeader />

          <AuthFormCard>
            <form
              onSubmit={loginStep === 'phone' ? handlePhoneContinue : handleLogin}
              className="flex flex-col gap-4"
              noValidate
            >
              {loginStep === 'phone' ? (
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
                  error={fieldErrorTarget === 'phone' ? fieldError : undefined}
                />
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
                      onClick={resetLoginStep}
                      className="flex min-h-11 shrink-0 items-center px-2! wibe-small font-medium text-brand"
                    >
                      تغییر
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="auth-password" className="wibe-small font-medium text-foreground">
                        رمز عبور
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setNotice(
                            'بازیابی رمز عبور به‌زودی اضافه می‌شود. فعلاً ثبت‌نام کن یا با پشتیبانی تماس بگیر.'
                          )
                        }
                        className="flex min-h-11 items-center px-2! wibe-caption font-medium text-brand"
                      >
                        فراموشی رمز؟
                      </button>
                    </div>
                    <AuthField
                      id="auth-password"
                      label="رمز عبور"
                      hideLabel
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
                  </div>
                </>
              )}

              {notice ? (
                <p role="status" className="wibe-caption text-muted-foreground">
                  {notice}
                </p>
              ) : null}

              {error ? <AuthErrorAlert message={error} /> : null}

              <AuthPrimaryButton loading={loading} loadingLabel="در حال ورود…">
                {loginStep === 'phone' ? (
                  'ادامه'
                ) : (
                  <>
                    ورود
                    <ArrowLeft className="size-4" aria-hidden />
                  </>
                )}
              </AuthPrimaryButton>
            </form>

            <Link
              href={guestHref}
              className="flex min-h-11 items-center justify-center wibe-small text-muted-foreground hover:text-foreground"
            >
              بعداً وارد می‌شوم
            </Link>
          </AuthFormCard>

          <AuthFooter
            legal={<AuthLegalNotice mode="login" />}
            prompt="حساب نداری؟"
            actionHref={registerHref}
            actionLabel="ثبت‌نام"
          />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <AuthBrandHeader title="ساخت حساب" subtitle="چند ثانیه تا شروع کشف لیست‌ها" />

        <AuthFormCard>
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4" noValidate>
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
              required
              dir="ltr"
              autoFocus
              error={fieldErrorTarget === 'phone' ? fieldError : undefined}
            />

            <div className="flex flex-col gap-2">
              <AuthField
                id="auth-new-password"
                label="رمز عبور"
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrorTarget === 'password') {
                    setFieldError('');
                    setFieldErrorTarget(null);
                  }
                }}
                placeholder="حداقل ۶ کاراکتر"
                autoComplete="new-password"
                required
                minLength={6}
                dir="ltr"
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
              {password.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1" aria-hidden>
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full',
                          passwordStrength >= level
                            ? passwordStrengthColor(passwordStrength)
                            : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                  <p className="wibe-caption text-muted-foreground">
                    {passwordStrengthLabel(passwordStrength)}
                  </p>
                </div>
              ) : null}
            </div>

            {error ? <AuthErrorAlert message={error} /> : null}

            <AuthPrimaryButton loading={loading} loadingLabel="در حال ساخت حساب…">
              <>
                ساخت حساب
                <ArrowLeft className="size-4" aria-hidden />
              </>
            </AuthPrimaryButton>
          </form>
        </AuthFormCard>

        <AuthFooter
          legal={<AuthLegalNotice mode="register" />}
          prompt="حساب داری؟"
          actionHref={loginHref}
          actionLabel="ورود"
        />
      </div>
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
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary">
        <Bookmark className="size-6 fill-primary-foreground text-primary-foreground" strokeWidth={2} aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="wibe-h2">{title}</h1>
        <p className="text-pretty wibe-small text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function AuthFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-popover p-5! shadow-overlay">
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

function getPasswordStrength(password: string): number {
  if (password.length >= 10) return 3;
  if (password.length >= 8) return 2;
  if (password.length >= 6) return 1;
  return 0;
}

function passwordStrengthColor(level: number): string {
  if (level >= 3) return 'bg-success';
  if (level >= 2) return 'bg-warning';
  return 'bg-destructive';
}

function passwordStrengthLabel(level: number): string {
  if (level >= 3) return 'رمز قوی';
  if (level >= 2) return 'رمز مناسب';
  if (level >= 1) return 'حداقل ۶ کاراکتر — قابل قبول';
  return 'خیلی کوتاه';
}
