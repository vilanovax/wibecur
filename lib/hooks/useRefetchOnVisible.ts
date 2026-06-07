'use client';

import { useEffect } from 'react';

/** وقتی تب از حالت suspend برمی‌گردد، fetch را دوباره اجرا کن */
export function useRefetchOnVisible(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = () => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [callback, enabled]);
}
