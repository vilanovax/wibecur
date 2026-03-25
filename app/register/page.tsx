'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Phone, Lock, Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const isPhoneValid = /^09\d{9}$/.test(phone.trim());
  const isPasswordValid = password.length >= 6;
  const isNameValid = name.trim().length >= 2;
  const isFormValid = isPhoneValid && isPasswordValid && isNameValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      // 1. Register
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          password,
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ثبت‌نام');
        setLoading(false);
        return;
      }

      // 2. Auto login
      const signInResult = await signIn('credentials', {
        phone: phone.trim(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        setStep('success');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch {
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-violet-50/30 px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-3xl text-white">✓</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ثبت‌نام موفق!</h1>
            <p className="text-gray-500 text-sm mt-2">حساب شما ساخته شد. وارد شوید.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors"
          >
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-violet-50/30 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-200/50 mb-4">
            <span className="text-2xl font-black text-white tracking-tight">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">عضویت در وایب‌کر</h1>
          <p className="text-gray-500 text-sm mt-1.5">لیست‌های کیوریتد خودت رو بساز</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام نمایشی"
              className={`
                w-full pr-11 pl-4 py-3.5 bg-white border rounded-xl text-sm
                outline-none transition-all placeholder:text-gray-400
                ${name && !isNameValid
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-violet-100'
                }
              `}
              dir="rtl"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                setPhone(val);
              }}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              className={`
                w-full pr-11 pl-4 py-3.5 bg-white border rounded-xl text-sm tracking-wider
                outline-none transition-all placeholder:text-gray-400
                ${phone && !isPhoneValid
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-violet-100'
                }
              `}
              dir="ltr"
              inputMode="numeric"
            />
            {phone && !isPhoneValid && (
              <p className="text-red-500 text-xs mt-1 pr-1">شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور (حداقل ۶ کاراکتر)"
              className={`
                w-full pr-11 pl-11 py-3.5 bg-white border rounded-xl text-sm
                outline-none transition-all placeholder:text-gray-400
                ${password && !isPasswordValid
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-violet-100'
                }
              `}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200/80 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`
              w-full py-3.5 rounded-xl text-sm font-semibold transition-all
              flex items-center justify-center gap-2
              ${isFormValid && !loading
                ? 'bg-gradient-to-l from-[#7C3AED] to-[#6366F1] text-white shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ثبت‌نام...
              </>
            ) : (
              'ثبت‌نام'
            )}
          </button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            قبلاً عضو شدی؟{' '}
            <Link
              href="/login"
              className="text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors"
            >
              ورود
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-gray-400 text-xs mt-4 leading-5">
          با ثبت‌نام، <span className="text-gray-500">شرایط استفاده</span> و{' '}
          <span className="text-gray-500">حریم خصوصی</span> را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}
