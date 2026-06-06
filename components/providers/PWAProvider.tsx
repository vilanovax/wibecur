'use client';

import { useEffect } from 'react';

const PWA_ENABLED = process.env.NEXT_PUBLIC_PWA_ENABLED === '1';

/**
 * PWA / Service Worker
 * sw.js با next-pwa + Turbopack (Next.js 16) ساخته نمی‌شود؛
 * تا فعال‌سازی واقعی PWA، فقط SWهای قدیمی پاک می‌شوند.
 * برای فعال‌سازی: NEXT_PUBLIC_PWA_ENABLED=1 + build با webpack/next-pwa
 */
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'development') return;

    let cancelled = false;

    if (!PWA_ENABLED) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (cancelled || registrations.length === 0) return;
        return Promise.all(registrations.map((registration) => registration.unregister()));
      });
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((reg) => {
        if (cancelled) return;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        /* sw.js موجود نیست */
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return <>{children}</>;
}
