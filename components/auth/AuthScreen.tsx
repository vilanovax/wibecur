'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Clapperboard,
  Coffee,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react';
import { validateAuthPassword, validatePhoneInput } from '@/lib/phone-auth';
import RegisterAvatarPicker, {
  getDefaultRegisterAvatarId,
  getRegisterAvatarById,
} from './RegisterAvatarPicker';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import type { VibeAvatarOption } from '@/lib/vibe-avatars';
import { trackSignupComplete, type SignupSource } from '@/lib/analytics';

export type AuthMode = 'login' | 'register';
type LoginMethod = 'password' | 'otp';

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

const CATEGORY_PILLS = [
  { label: 'فیلم', icon: Clapperboard },
  { label: 'کتاب', icon: BookOpen },
  { label: 'کافه', icon: Coffee },
  { label: 'پادکست', icon: Headphones },
] as const;

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
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAvatar = useMemo(() => getRegisterAvatarById(avatarId), [avatarId]);
  const passwordStrength = getPasswordStrength(password);
  const sourceQuery =
    signupSource !== 'direct' ? `&source=${encodeURIComponent(signupSource)}` : '';
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}${sourceQuery}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}${sourceQuery}`;
  const guestHref = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneError = validatePhoneInput(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!isRegister && loginMethod === 'otp') {
      setError('ورود با کد یکبارمصرف به‌زودی فعال می‌شود — فعلاً با رمز عبور وارد شو.');
      return;
    }

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
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
      }

      const result = await signIn('credentials', {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isRegister
            ? 'ثبت‌نام شد ولی ورود ناموفق بود — دوباره تلاش کن'
            : 'شماره یا رمز عبور اشتباه است'
        );
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

  if (!isRegister) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]" dir="rtl">
        <div className="mx-auto w-full max-w-[22rem] sm:max-w-[24rem]">
          <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.08)]">
            <AuthHeroHeader
              title="سلام، خوش اومدی 👋"
              subtitle="وارد شو، لیست‌ها و ذخیره‌هات رو هر جا داشته باش."
              showCategoryPills
            />

            <div className="px-5 pb-6 pt-1 sm:px-6">
              <LoginMethodTabs
                value={loginMethod}
                onChange={(method) => {
                  setLoginMethod(method);
                  setError('');
                }}
              />

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <AuthField
                  label="شماره موبایل"
                  icon={<Smartphone className="h-[1.125rem] w-[1.125rem]" />}
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
                  autoComplete="tel"
                  required
                  dir="ltr"
                  className="text-left tracking-wide"
                  autoFocus
                  hasError={Boolean(error)}
                />

                {loginMethod === 'password' ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                      <button
                        type="button"
                        onClick={() =>
                          setError('بازیابی رمز عبور به‌زودی اضافه می‌شود. فعلاً ثبت‌نام کن یا با پشتیبانی تماس بگیر.')
                        }
                        className="text-xs font-medium text-primary transition-colors hover:text-primary-dark"
                      >
                        فراموشی رمز؟
                      </button>
                    </div>
                    <AuthField
                      label=""
                      hideLabel
                      icon={<Lock className="h-[1.125rem] w-[1.125rem]" />}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      autoComplete="current-password"
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
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-gray-500">
                    یه کد تأیید برات پیامک می‌کنیم. نیازی به رمز نیست.
                  </p>
                )}

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.28)] transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {loginMethod === 'otp' ? 'در حال ارسال…' : 'در حال ورود…'}
                    </>
                  ) : loginMethod === 'otp' ? (
                    <>
                      ارسال کد تأیید
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                    </>
                  ) : (
                    <>
                      ورود
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </form>

              <AuthDivider />

              <Link
                href={guestHref}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                ادامه بدون حساب
              </Link>

              <p className="mt-5 text-center text-sm text-gray-500">
                حساب نداری؟{' '}
                <Link href={registerHref} className="font-semibold text-primary hover:text-primary-dark hover:underline">
                  ثبت‌نام رایگان
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]" dir="rtl">
      <div className="mx-auto w-full max-w-[22rem] sm:max-w-[24rem]">
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.08)]">
          <AuthHeroHeader
            title="ساخت حساب جدید"
            subtitle="چند ثانیه تا شروع کشف لیست‌ها"
            avatar={selectedAvatar}
          />

          <div className="px-5 pb-6 pt-1 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <section className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <RegisterAvatarPicker value={avatarId} onChange={setAvatarId} />
              </section>

              <AuthField
                label="نام"
                hint="اختیاری — در پروفایل نمایش داده می‌شود"
                icon={<User className="h-[1.125rem] w-[1.125rem]" />}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً رامین"
                autoComplete="name"
              />

              <AuthField
                label="شماره موبایل"
                icon={<Smartphone className="h-[1.125rem] w-[1.125rem]" />}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                  icon={<Lock className="h-[1.125rem] w-[1.125rem]" />}
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
                    <p className="mt-1 text-[11px] text-gray-500">{passwordStrengthLabel(passwordStrength)}</p>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-gray-400">بدون OTP — ثبت‌نام در یک مرحله</p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.28)] transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    در حال ساخت حساب…
                  </>
                ) : (
                  <>
                    ساخت حساب
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              حساب داری؟{' '}
              <Link href={loginHref} className="font-semibold text-primary hover:text-primary-dark hover:underline">
                ورود
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthBrandMark() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_6px_16px_rgba(99,102,241,0.35)]">
        <Bookmark className="h-5 w-5 fill-white text-white" strokeWidth={2.25} />
      </div>
      <span className="text-[1.65rem] font-bold leading-none text-primary">وایب</span>
    </div>
  );
}

function AuthHeroHeader({
  title,
  subtitle,
  showCategoryPills = false,
  avatar,
}: {
  title: string;
  subtitle: string;
  showCategoryPills?: boolean;
  avatar?: VibeAvatarOption | null;
}) {
  return (
    <div className="relative overflow-hidden px-6 pb-6 pt-8 text-center">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -start-6 top-0 h-36 w-36 rounded-full bg-sky-200/70 blur-3xl" />
        <div className="absolute -end-2 top-6 h-32 w-32 rounded-full bg-violet-200/80 blur-3xl" />
        <div className="absolute start-1/2 top-10 h-28 w-44 -translate-x-1/2 rounded-full bg-pink-200/60 blur-3xl" />
      </div>

      <div className="relative">
        {avatar ? (
          <div className="mx-auto mb-3 flex flex-col items-center">
            <VibeAvatarDisplay avatar={avatar} size={80} />
            <p className="mt-2 text-xs font-medium text-gray-500">{avatar.label}</p>
          </div>
        ) : (
          <AuthBrandMark />
        )}

        <h1 className="mt-5 text-[1.35rem] font-bold text-gray-900 sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{subtitle}</p>

        {showCategoryPills && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_PILLS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoginMethodTabs({
  value,
  onChange,
}: {
  value: LoginMethod;
  onChange: (method: LoginMethod) => void;
}) {
  const tabs: { id: LoginMethod; label: string }[] =
    value === 'otp'
      ? [
          { id: 'otp', label: 'کد یکبارمصرف' },
          { id: 'password', label: 'رمز عبور' },
        ]
      : [
          { id: 'password', label: 'رمز عبور' },
          { id: 'otp', label: 'کد یکبارمصرف' },
        ];

  return (
    <div className="flex rounded-xl bg-gray-100 p-1" role="tablist" aria-label="روش ورود">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
            value === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-medium text-gray-400">یا</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
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
  ...props
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  hasError?: boolean;
  hideLabel?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {!hideLabel && (
        <label className="mb-2 block">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {hint && <span className="mt-0.5 block text-[11px] text-gray-400">{hint}</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute start-3.5 text-gray-400">{icon}</span>
        <input
          {...props}
          aria-invalid={hasError || undefined}
          className={`w-full rounded-xl border bg-white py-3.5 ps-11 pe-3 text-[0.9375rem] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15 ${
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
