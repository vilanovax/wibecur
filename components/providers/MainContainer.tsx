'use client';

import { usePathname } from 'next/navigation';
import SidebarNav from '@/components/mobile/layout/SidebarNav';
import {
  MOBILE_SHELL_MAX_WIDTH_CLASS,
  DESKTOP_CONTENT_MAX_WIDTH_CLASS,
  DESKTOP_CONTENT_PADDING_CLASS,
  DESKTOP_CONTENT_PADDING_TOP_CLASS,
  CONSUMER_PAGE_PADDING_BOTTOM_CLASS,
} from '@/lib/layout-tokens';

export {
  MOBILE_SHELL_MAX_WIDTH,
  MOBILE_SHELL_MAX_WIDTH_CLASS,
  DESKTOP_SIDEBAR_WIDTH_CLASS,
  DESKTOP_CONTENT_MAX_WIDTH_CLASS,
  DESKTOP_CONTENT_PADDING_CLASS,
  DESKTOP_CONTENT_PADDING_TOP_CLASS,
  CONSUMER_PAGE_PADDING_BOTTOM_CLASS,
} from '@/lib/layout-tokens';

/**
 * شِل adaptive: موبایل 428px | دسکتاپ sidebar + محتوای تا 7xl
 * ادمین: عرض کامل بدون sidebar
 */
export default function MainContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isAuth = pathname === '/login' || pathname === '/register';

  if (isAdmin) {
    return (
      <div id="main" role="main" className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  if (isAuth) {
    return (
      <div id="main" role="main" className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-200 lg:bg-wibe-surface">
      {/* RTL: flex-row بدون reverse → آیتم اول DOM در سمت راست (سایدبار) */}
      <div className="lg:flex lg:min-h-screen lg:gap-0">
        <div
          id="main"
          role="main"
          className={`order-1 flex min-h-screen w-full min-w-0 flex-1 flex-col lg:order-2 ${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto lg:mx-0 lg:max-w-none`}
        >
          <div
            className={`mx-auto flex w-full min-w-0 flex-1 flex-col bg-white shadow-2xl lg:bg-wibe-surface lg:shadow-none ${DESKTOP_CONTENT_MAX_WIDTH_CLASS} ${DESKTOP_CONTENT_PADDING_CLASS} ${DESKTOP_CONTENT_PADDING_TOP_CLASS} ${CONSUMER_PAGE_PADDING_BOTTOM_CLASS}`}
          >
            {children}
          </div>
        </div>
        <SidebarNav className="order-2 lg:order-1" />
      </div>
    </div>
  );
}
