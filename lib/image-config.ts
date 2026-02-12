/**
 * استانداردهای تصویری اپ (موبایل‌اول).
 * این پروفایل‌ها در زمان آپلود (کاربر، ادمین، یا جستجوی هوش مصنوعی) اعمال می‌شوند تا
 * سایز و کیفیت برای نمایش در کامپوننت‌های مختلف اپ یکسان و بهینه باشد.
 */

export type ImageProfile =
  | 'avatar'
  | 'coverProfile'
  | 'coverList'
  | 'itemImage'
  | 'itemThumbnail'
  | 'hubCover'
  | 'default';

export interface ImageProfileConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSize: number; // in bytes
  skipOptimizationIfSmallerThan: number; // in bytes
  format: 'webp' | 'jpeg' | 'png';
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

  /** کاور لیست — کارت لیست، جزئیات لیست (عرض معمول در موبایل ~۳۵۰px، رتینا ۲x) */
  coverList: {
    maxWidth: 1000,
    maxHeight: 800,
    quality: 85,
    maxSize: 1024 * 1024, // 1MB
    skipOptimizationIfSmallerThan: 400 * 1024,
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

  /** کاور هاب (ادمین) */
  hubCover: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    maxSize: 2 * 1024 * 1024, // 2MB
    skipOptimizationIfSmallerThan: 500 * 1024,
    format: 'webp',
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
