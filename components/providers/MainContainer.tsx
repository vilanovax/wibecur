'use client';

import { usePathname } from 'next/navigation';
import DesktopTopNav from '@/components/mobile/layout/DesktopTopNav';
import DesktopSiteFooter from '@/components/mobile/layout/DesktopSiteFooter';
import {
  DESKTOP_SITE_SHELL_CLASS,
  DESKTOP_CONTENT_PADDING_CLASS,
  DESKTOP_CONTENT_PADDING_TOP_CLASS,
  CONSUMER_PAGE_PADDING_BOTTOM_CLASS,
} from '@/lib/layout-tokens';

export {
  MOBILE_SHELL_MAX_WIDTH,
  MOBILE_SHELL_MAX_WIDTH_CLASS,
  DESKTOP_SIDEBAR_WIDTH_CLASS,
  DESKTOP_PAGE_MAX_WIDTH_CLASS,
  DESKTOP_PAGE_MAX_WIDTH_PX,
  DESKTOP_SITE_SHELL_CLASS,
  DESKTOP_CONTENT_PADDING_CLASS,
  DESKTOP_CONTENT_PADDING_TOP_CLASS,
  CONSUMER_PAGE_PADDING_BOTTOM_CLASS,
} from '@/lib/layout-tokens';

/**
 * شِل adaptive: موبایل 428px | دسکتاپ فریم واحد 1200px (منو + محتوا + فوتر)
 */
export default function MainContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isAuth = pathname === '/login' || pathname === '/register';
  const isMaintenance = pathname === '/maintenance';

  if (isAdmin || isAuth || isMaintenance) {
    return (
      <div id="main" role="main" className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-x-clip bg-wibe-surface lg:min-h-screen lg:bg-[#e8eaef]">
      <div className={DESKTOP_SITE_SHELL_CLASS}>
        <DesktopTopNav />
        <div
          id="main"
          role="main"
          className={`flex min-w-0 flex-1 flex-col max-lg:bg-wibe-surface lg:bg-white ${DESKTOP_CONTENT_PADDING_CLASS} ${DESKTOP_CONTENT_PADDING_TOP_CLASS} ${CONSUMER_PAGE_PADDING_BOTTOM_CLASS}`}
        >
          {children}
          <DesktopSiteFooter />
        </div>
      </div>
    </div>
  );
}
