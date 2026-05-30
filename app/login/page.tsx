'use client';

import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const msg =
          result.error === 'Configuration'
            ? 'خطای پیکربندی سرور. سرور dev را یک‌بار restart کنید و /api/health را بررسی کنید.'
            : result.error === 'CredentialsSignin'
              ? 'ایمیل یا رمز عبور اشتباه است، یا اتصال دیتابیس موقتاً قطع است.'
              : result.error;
        setError(msg);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-wibe-card rounded-lg border border-wibe shadow-card p-8">
      <div className="text-center mb-6">
        <h1 className="wibe-h2 text-foreground">ورود به Wibe</h1>
        <p className="wibe-small text-wibe-secondary mt-1">پنل مدیریت و حساب کاربری</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block wibe-small font-medium text-foreground mb-2">ایمیل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-wibe bg-wibe-surface wibe-small focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            required
          />
        </div>
        <div>
          <label className="block wibe-small font-medium text-foreground mb-2">رمز عبور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-wibe bg-wibe-surface wibe-small focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            required
          />
        </div>
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md wibe-small">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-md wibe-small font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
      <div className="mt-6 wibe-caption text-wibe-secondary text-center space-y-1">
        <p>برای تست:</p>
        <p className="font-mono text-foreground/80">admin@listhub.ir / admin123</p>
      </div>
      <Link href="/" className="block text-center mt-4 wibe-small text-primary hover:underline">
        بازگشت به خانه
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-wibe-surface px-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-wibe-card rounded-lg border border-wibe shadow-card p-8 animate-pulse h-80" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
