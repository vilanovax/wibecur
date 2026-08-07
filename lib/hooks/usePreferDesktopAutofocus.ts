'use client';

import { useEffect, useState } from 'react';

/**
 * فقط روی دستگاه‌های pointer دقیق (دسکتاپ) autoFocus بده —
 * روی موبایل از پرش کیبورد / زوم ناخواسته جلوگیری می‌کند.
 */
export function usePreferDesktopAutofocus(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return enabled;
}
