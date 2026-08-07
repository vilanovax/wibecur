/** عرض شِل موبایل — هماهنگ با MainContainer */
export const MOBILE_SHELL_MAX_WIDTH = 428;

/** @deprecated فقط برای overlayهای قدیمی؛ شِل صفحه موبایل تمام‌عرض است */
export const MOBILE_SHELL_MAX_WIDTH_CLASS = 'max-w-[428px]';

/** شِل موبایل — تمام عرض viewport (بدون ستون خاکستری کناری) */
export const MOBILE_VIEW_SHELL_CLASS = 'w-full max-w-none';

/** @deprecated سایدبار حذف شد — نوار بالا */
export const DESKTOP_SIDEBAR_WIDTH_CLASS = 'lg:w-0';

/** ارتفاع نوار ناوبری بالای دسکتاپ */
export const DESKTOP_TOP_NAV_HEIGHT = '3.5rem';

/** عرض ثابت شِل دسکتاپ (پیکسل) — نمایش متمرکز و خوانا */
export const DESKTOP_PAGE_MAX_WIDTH_PX = 1200;

export const DESKTOP_PAGE_MAX_WIDTH_CLASS = 'lg:max-w-[1200px]';

/**
 * فریم واحد سایت (موبایل ۴۲۸px | دسکتاپ ۱۲۰۰px) — نوار، محتوا، فوتر
 */
export const DESKTOP_SITE_SHELL_CLASS =
  'wibe-desktop-shell mx-auto flex w-full min-w-0 flex-col overflow-x-hidden lg:min-h-screen lg:w-[min(100%,1200px)] lg:max-w-[1200px] lg:shrink-0 lg:bg-white lg:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.06)] lg:ring-1 lg:ring-black/[0.04]';

/** @deprecated از DESKTOP_PAGE_MAX_WIDTH_CLASS استفاده کنید */
export const DESKTOP_CONTENT_MAX_WIDTH_CLASS = DESKTOP_PAGE_MAX_WIDTH_CLASS;

/** گرید فید صفحهٔ خانه — ۴ ستون از lg برای چیدمان یکنواخت دسکتاپ */
export const HOME_FEED_GRID_CLASS =
  'lg:grid lg:grid-cols-4 lg:gap-3 xl:gap-4';

/** @deprecated سایدبار دسکتاپ حذف شد — از چیدمان magazine استفاده کنید */
export const HOME_DESKTOP_LAYOUT_CLASS =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8';

/** @deprecated */
export const HOME_CURATOR_SIDEBAR_CLASS =
  'hidden lg:block lg:sticky lg:top-14 lg:self-start';

/** padding افقی محتوا روی دسکتاپ — فشرده */
export const DESKTOP_CONTENT_PADDING_CLASS = 'lg:px-4 xl:px-5';

/** padding عمودی بالای محتوا در شِل دسکتاپ */
export const DESKTOP_CONTENT_PADDING_TOP_CLASS = 'lg:pt-3';

/** sticky زیر نوار بالای دسکتاپ */
export const DESKTOP_STICKY_TOP_CLASS = 'lg:top-14';

/** sticky زیر نوار بالا + هدر صفحه */
export const DESKTOP_STICKY_BELOW_PAGE_HEADER_CLASS = 'lg:top-[6.5rem]';

/**
 * جای خالی درون‌جریانی برای BottomNav ثابت — فقط داخل کامپوننت BottomNav.
 * صفحات نباید pb-20 یا padding پایین جدا اضافه کنند.
 */
export const MOBILE_BOTTOM_NAV_SPACER_CLASS =
  'h-[calc(5.25rem+env(safe-area-inset-bottom,0px))] shrink-0 lg:hidden';

/** فاصله پایین شِل دسکتاپ (فوتر سایت) */
export const CONSUMER_PAGE_PADDING_BOTTOM_CLASS = 'lg:pb-6';
