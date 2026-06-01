'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, User, Smartphone, Lock } from 'lucide-react';
import { validateAuthPassword, validatePhoneInput } from '@/lib/phone-auth';
import RegisterAvatarPicker, {
  getDefaultRegisterAvatarId,
  getRegisterAvatarById,
} from './RegisterAvatarPicker';

export type AuthMode = 'login' | 'register';

interface AuthScreenProps {
  mode: AuthMode;
  callbackUrl: string;
}

export default function AuthScreen({ mode, callbackUrl }: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState(getDefaultRegisterAvatarId);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAvatar = useMemo(() => getRegisterAvatarById(avatarId), [avatarId]);
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
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

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f172a]" dir="rtl">
      <AuthBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-8">
        {/* هدر برند */}
        <div className={`text-center ${isRegister ? 'mb-5' : 'mb-8'}`}>
          {!isRegister && (
            <>
              <p className="mb-1 text-sm text-white/65">سلام، خوش اومدی به</p>
              <h1 className="text-3xl font-bold text-white">وایب</h1>
            </>
          )}
          {isRegister && selectedAvatar && (
            <div className="mx-auto mb-3 flex flex-col items-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-lg ring-4 ring-white/20 ${selectedAvatar.bgClass}`}
              >
                {selectedAvatar.emoji}
              </div>
              <p className="mt-2 text-xs font-medium text-white/50">{selectedAvatar.label}</p>
            </div>
          )}
          <h1 className={`font-bold text-white ${isRegister ? 'text-2xl' : 'sr-only'}`}>
            {isRegister ? 'ساخت حساب جدید' : 'وایب'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            {isRegister
              ? 'چند ثانیه تا شروع کشف لیست‌ها'
              : 'وارد شو و لیست‌ها و ذخیره‌هات رو ادامه بده'}
          </p>
        </div>

        {/* کارت فرم */}
        <div className="flex-1">
          {!isRegister && (
            <h2 className="mb-6 text-xl font-bold text-white">ورود</h2>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <RegisterAvatarPicker value={avatarId} onChange={setAvatarId} />
              </section>
            )}

            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              {isRegister && (
                <AuthInput
                  label="نام"
                  hint="اختیاری — در پروفایل نمایش داده می‌شود"
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً رامین"
                  autoComplete="name"
                />
              )}

              <AuthInput
                label="شماره موبایل"
                icon={<Smartphone className="h-4 w-4" />}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                autoComplete="tel"
                required
                dir="ltr"
                className="text-left"
              />

              <div>
                <AuthInput
                  label="رمز عبور"
                  icon={<Lock className="h-4 w-4" />}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  dir="ltr"
                  className="pe-10 text-left"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/75"
                      aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {isRegister && password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength >= i ? passwordStrengthColor(passwordStrength) : 'bg-white/15'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-white/45">{passwordStrengthLabel(passwordStrength)}</p>
                  </div>
                )}
                {isRegister && (
                  <p className="mt-2 text-[11px] text-white/40">بدون OTP — ثبت‌نام در یک مرحله</p>
                )}
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-bold text-primary shadow-lg transition-all hover:bg-white/95 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isRegister ? 'در حال ساخت حساب…' : 'در حال ورود…'}
                </>
              ) : isRegister ? (
                'ساخت حساب'
              ) : (
                'ورود'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/55">
            {isRegister ? (
              <>
                حساب داری؟{' '}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="font-semibold text-white hover:underline"
                >
                  ورود
                </Link>
              </>
            ) : (
              <>
                حساب نداری؟{' '}
                <Link
                  href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="font-semibold text-white hover:underline"
                >
                  ثبت‌نام رایگان
                </Link>
              </>
            )}
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-white/40 transition-colors hover:text-white/70"
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}

function AuthBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/35 via-[#1e1b4b] to-[#0f172a]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 bottom-40 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />
    </>
  );
}

function AuthInput({
  label,
  hint,
  icon,
  trailing,
  className = '',
  ...props
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-white/40">{hint}</span>}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute start-3 text-white/35">{icon}</span>
        <input
          {...props}
          className={`w-full rounded-xl border border-white/10 bg-white/5 py-3 ps-10 pe-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/10 ${className}`}
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
  if (level >= 3) return 'bg-emerald-400';
  if (level >= 2) return 'bg-amber-400';
  return 'bg-orange-400';
}

function passwordStrengthLabel(level: number): string {
  if (level >= 3) return 'رمز قوی';
  if (level >= 2) return 'رمز مناسب';
  if (level >= 1) return 'حداقل ۶ کاراکتر — قابل قبول';
  return 'خیلی کوتاه';
}
