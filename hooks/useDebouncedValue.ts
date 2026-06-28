'use client';

import { useEffect, useState } from 'react';

/** مقدار debounce‌شده — برای جستجوی درون‌صفحه‌ای */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
