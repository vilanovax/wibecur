'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { buildAdminLoginUrl } from '@/lib/admin/login-redirect';

/**
 * اگر نشست ادمین از بین برود (یا API ادمین ۴۰۱ بدهد) کاربر را به لاگین بفرست —
 * نه به صفحهٔ «دسترسی محدود» که دکمه‌هایش گیر می‌کنند.
 */
export default function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const redirecting = useRef(false);

  useEffect(() => {
    if (status !== 'unauthenticated' || redirecting.current) return;
    redirecting.current = true;
    router.replace(buildAdminLoginUrl(pathname));
  }, [status, pathname, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await originalFetch(...args);
      if (res.status !== 401) return res;

      let url = '';
      const input = args[0];
      if (typeof input === 'string') url = input;
      else if (input instanceof Request) url = input.url;
      else if (input && typeof input === 'object' && 'url' in input) {
        url = String((input as { url: string }).url);
      }

      const isAdminApi =
        url.includes('/api/admin') ||
        (url.startsWith('/') && url.startsWith('/api/admin'));

      if (isAdminApi && !redirecting.current) {
        redirecting.current = true;
        const path =
          typeof window !== 'undefined' ? window.location.pathname : pathname;
        window.location.assign(buildAdminLoginUrl(path));
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-wibe-secondary">نشست شما تمام شده؛ در حال انتقال به ورود…</p>
      </div>
    );
  }

  return <>{children}</>;
}
