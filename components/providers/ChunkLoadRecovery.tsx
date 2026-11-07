'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'wibe-chunk-reload';

function isNextChunkUrl(url: string): boolean {
  return url.includes('/_next/static/chunks/');
}

/**
 * بعد از rebuild، اگر مرورگر runtime/chunk قدیمی کش کرده باشد و ۴۰۴ بدهد،
 * یک‌بار صفحه را تازه بارگذاری کن (بدون حلقهٔ بی‌نهایت).
 */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
        sessionStorage.setItem(RELOAD_KEY, '1');
      } catch {
        /* private mode */
      }
      window.location.reload();
    };

    const onScriptError = (event: ErrorEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLScriptElement)) return;
      const src = target.src || '';
      if (!isNextChunkUrl(src)) return;
      reloadOnce();
    };

    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : String(reason ?? '');
      if (
        /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module/i.test(
          message
        )
      ) {
        reloadOnce();
      }
    };

    // بعد از لود موفق، پرچم reload را پاک کن تا deploy بعدی دوباره کار کند
    try {
      if (sessionStorage.getItem(RELOAD_KEY) === '1') {
        const clear = window.setTimeout(() => {
          try {
            sessionStorage.removeItem(RELOAD_KEY);
          } catch {
            /* ignore */
          }
        }, 4000);
        return () => {
          window.clearTimeout(clear);
          window.removeEventListener('error', onScriptError, true);
          window.removeEventListener('unhandledrejection', onUnhandled);
        };
      }
    } catch {
      /* ignore */
    }

    window.addEventListener('error', onScriptError, true);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onScriptError, true);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);

  return null;
}
