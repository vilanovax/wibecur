/**
 * استانداردهای تصویری اپ (موبایل‌اول).
 * این پروفایل‌ها در زمان آپلود (کاربر، ادمین، یا جستجوی هوش مصنوعی) اعمال می‌شوند تا
 * سایز و کیفیت برای نمایش در کامپوننت‌های مختلف اپ یکسان و بهینه باشد.
 */

export type ImageProfile =
  | 'avatar'
  | 'coverProfile'
  | 'coverList'
  | 'coverListHorizontal'
  | 'itemImage'
  | 'itemThumbnail'
  | 'hubCover'
  | 'siteLogo'
  | 'default';

export interface ImageProfileConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSize: number; // in bytes
  skipOptimizationIfSmallerThan: number; // in bytes
  format: 'webp' | 'jpeg' | 'png';
  /** نسبت عرض به ارتفاع — مثلاً 4/3 یا 21/9 */
  aspectRatio?: number;
  /** cover = برش مرکزی به نسبت هدف؛ inside = حفظ نسبت داخل قاب */
  resizeFit?: 'inside' | 'cover';
  /** همیشه بهینه‌سازی شود (مثلاً لوگو) */
  forceOptimize?: boolean;
  /** برش حاشیه شفاف قبل از resize */
  trimTransparent?: boolean;
  /** حفظ آلفا در WebP */
  preserveAlpha?: boolean;
}

/**
 * پروفایل‌های بهینه‌سازی بر اساس نوع استفاده در اپ موبایل.
 * ابعاد برای نمایش در کارت‌ها و فید موبایل (با احتساب رتینا ۲x) تعیین شده‌اند.
 */
export const IMAGE_PROFILES: Record<ImageProfile, ImageProfileConfig> = {
  /** آواتار کاربر — نمایش در هدر، کامنت، پروفایل (معمولاً ۴۸–۹۶px در UI) */
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
    maxSize: 500 * 1024, // 500KB
    skipOptimizationIfSmallerThan: 200 * 1024, // 200KB
    format: 'webp',
  },

  /** کاور پروفایل (استفاده محدود) */
  coverProfile: {
    maxWidth: 1000,
    maxHeight: 500,
    quality: 85,
    maxSize: 1024 * 1024, // 1MB
    skipOptimizationIfSmallerThan: 300 * 1024,
    format: 'webp',
  },

  /** کاور لیست — کارت، جزئیات (۴:۳) */
  coverList: {
    maxWidth: 1280,
    maxHeight: 960,
    aspectRatio: 4 / 3,
    resizeFit: 'cover',
    quality: 78,
    maxSize: 180 * 1024, // 180KB — هدف لود سریع موبایل
    skipOptimizationIfSmallerThan: 80 * 1024, // 80KB
    format: 'webp',
  },

  /** بنر افقی لیست — featured carousel، هدر جزئیات (۲۱:۹) */
  coverListHorizontal: {
    maxWidth: 1600,
    maxHeight: 686,
    aspectRatio: 21 / 9,
    resizeFit: 'cover',
    quality: 78,
    maxSize: 220 * 1024, // 220KB
    skipOptimizationIfSmallerThan: 100 * 1024,
    format: 'webp',
  },

  /** تصویر آیتم — فید، جزئیات آیتم، جستجوی AI (عرض معمول ~۳۵۰–۴۰۰px در موبایل) */
  itemImage: {
    maxWidth: 1000,
    maxHeight: 900,
    quality: 85,
    maxSize: 1024 * 1024, // 1MB
    skipOptimizationIfSmallerThan: 300 * 1024,
    format: 'webp',
  },

  /** تامبنیل آیتم — لیست‌های فشرده (رتینا ۲x) */
  itemThumbnail: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 80,
    maxSize: 300 * 1024, // 300KB
    skipOptimizationIfSmallerThan: 150 * 1024,
    format: 'webp',
  },

  /** کاور هاب / هیرو دسته (ادمین) */
  hubCover: {
    maxWidth: 1600,
    maxHeight: 900,
    quality: 80,
    maxSize: 320 * 1024, // 320KB
    skipOptimizationIfSmallerThan: 150 * 1024,
    format: 'webp',
  },

  /** لوگوی سایت — هدر و ناوبری (نسبت افقی، شفافیت حفظ می‌شود) */
  siteLogo: {
    maxWidth: 480,
    maxHeight: 120,
    resizeFit: 'inside',
    quality: 88,
    maxSize: 120 * 1024, // 120KB
    skipOptimizationIfSmallerThan: 0,
    format: 'webp',
    forceOptimize: true,
    trimTransparent: true,
    preserveAlpha: true,
  },

  /** پیش‌فرض (fallback) */
  default: {
    maxWidth: 1000,
    maxHeight: 1000,
    quality: 80,
    maxSize: 500 * 1024, // 500KB
    skipOptimizationIfSmallerThan: 300 * 1024,
    format: 'webp',
  },
};

/**
 * Get image profile configuration
 */
export function getImageProfile(profile: ImageProfile): ImageProfileConfig {
  return IMAGE_PROFILES[profile] || IMAGE_PROFILES.default;
}

/**
 * Allowed image formats for upload
 */
export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

/**
 * Maximum upload size before optimization (10MB)
 */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/** حداکثر حجم فایل خام قبل از بهینه‌سازی — UI/API */
export const MAX_RAW_UPLOAD_SIZE = MAX_UPLOAD_SIZE;

/** راهنمای نمایش در فرم‌های آپلود */
export const IMAGE_UPLOAD_HINTS = {
  listCover:
    'JPG/PNG/WebP تا ۱۰MB — برش ۴:۳، WebP ۱۲۸۰×۹۶۰ (~۱۸۰KB) و ذخیره در ParsPack',
  listHorizontal:
    'JPG/PNG/WebP تا ۱۰MB — برش ۲۱:۹، WebP ۱۶۰۰×۶۸۶ (~۲۲۰KB) و ذخیره در ParsPack',
  categoryHero:
    'JPG/PNG/WebP تا ۱۰MB — در ParsPack (hubs) · WebP ۱۶۰۰×۹۰۰ (~۳۲۰KB)',
  siteLogo:
    'PNG/WebP با پس‌زمینه شفاف · خروجی WebP حداکثر ۴۸۰×۱۲۰px (~۱۲۰KB) — مناسب هدر سایت',
  avatar: 'JPG/PNG/WebP تا ۱۰MB — به WebP ۴۰۰×۴۰۰ (~۵۰۰KB) بهینه می‌شود',
} as const;
