'use client';

import { usePathname } from 'next/navigation';

/** عرض شِل موبایل — هماهنگ با MainContainer */
export const MOBILE_SHELL_MAX_WIDTH = 428;
export const MOBILE_SHELL_MAX_WIDTH_CLASS = 'max-w-[428px]';

/**
 * برای اپ موبایل: کانتینر با max-width 428px
 * برای پنل ادمین: بدون محدودیت عرض (دسکتاپ)
 */
export default function MainContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div id="main" role="main" className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full ${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto md:bg-white md:shadow-2xl`}
      id="main"
      role="main"
    >
      {children}
    </div>
  );
}
