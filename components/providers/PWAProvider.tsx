'use client';

import { useEffect } from 'react';

const PWA_ENABLED = process.env.NEXT_PUBLIC_PWA_ENABLED === '1';

/**
 * PWA / Service Worker + bust cache بعد از rebuild
 */
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let removeControllerListener: (() => void) | undefined;

    const run = async () => {
      if (process.env.NODE_ENV === 'production') {
        const buildId = process.env.NEXT_PUBLIC_BUILD_ID;
        if (buildId) {
          const storageKey = 'wibe-build-id';
          const previousBuildId = localStorage.getItem(storageKey);
          if (previousBuildId !== buildId) {
            localStorage.setItem(storageKey, buildId);

            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map((name) => caches.delete(name)));
            }

            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              await Promise.all(registrations.map((registration) => registration.unregister()));
            }

            if (previousBuildId) {
              window.location.reload();
              return;
            }
          }
        }
      }

      if (cancelled || !('serviceWorker' in navigator)) return;
      if (process.env.NODE_ENV === 'development') return;

      if (!PWA_ENABLED) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (!cancelled && registrations.length > 0) {
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
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
      removeControllerListener = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };

      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
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
      } catch {
        /* sw.js موجود نیست */
      }
    };

    void run();

    return () => {
      cancelled = true;
      removeControllerListener?.();
    };
  }, []);

  return <>{children}</>;
}
