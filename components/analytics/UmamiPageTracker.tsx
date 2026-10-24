'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackUmamiPageView } from '@/lib/umami';

/** بازدید مسیرهای عمومی. پنل ادمین و کوئری فیلتر از اینجا رد نمی‌شوند. */
export default function UmamiPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackUmamiPageView(pathname);
  }, [pathname]);

  return null;
}
