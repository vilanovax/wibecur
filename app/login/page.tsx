'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Phone, Mail, Lock, Loader2 } from 'lucide-react';

type LoginMode = 'phone' | 'email';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        ...(mode === 'phone' ? { phone: phone.trim() } : { email: email.trim() }),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/');
      }
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-violet-50/30 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-200/50 mb-4">
            <span className="text-2xl font-black text-white tracking-tight">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ورود به وایب‌کر</h1>
          <p className="text-gray-500 text-sm mt-1.5">خوش برگشتی!</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('phone'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'phone'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Phone className="w-4 h-4" />
            موبایل
          </button>
          <button
            type="button"
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            ایمیل
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'phone' ? (
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
                className="w-full pr-11 pl-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm tracking-wider outline-none transition-all placeholder:text-gray-400 focus:border-[#6366F1] focus:ring-2 focus:ring-violet-100"
                dir="ltr"
                inputMode="numeric"
                required
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل"
                className="w-full pr-11 pl-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#6366F1] focus:ring-2 focus:ring-violet-100"
                dir="ltr"
                required
              />
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور"
              className="w-full pr-11 pl-11 py-3.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#6366F1] focus:ring-2 focus:ring-violet-100"
              dir="ltr"
              required
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
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-l from-[#7C3AED] to-[#6366F1] text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ورود...
              </>
            ) : (
              'ورود'
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            هنوز عضو نیستی؟{' '}
            <Link
              href="/register"
              className="text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors"
            >
              ثبت‌نام
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
