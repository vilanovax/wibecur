/**
 * ثابت‌های Trending Engine وایب
 */

/** وزن‌های فرمول امتیاز ترند */
export const TRENDING_WEIGHTS = {
  S7: 4,    // ذخیره ۷ روزه
  C7: 3,    // کامنت ۷ روزه
  L7: 2,    // لایک ۷ روزه
  V7: 0.5,  // بازدید ۷ روزه
  SAVE_VELOCITY: 5,
  AGE_DECAY: 0.1,
} as const;

/** آستانه بج */
export const TRENDING_THRESHOLDS = {
  HOT: 300,
  VIRAL: 600,
} as const;

/** بوست برای Fast Rising (۲۴ ساعته) */
export const FAST_RISING_BOOST = {
  S1_THRESHOLD: 20,
  BONUS: 20,
} as const;

/** بازه‌های زمانی (روز) */
export const TIME_WINDOWS = {
  WEEKLY: 7,
  DAILY: 1,
  MONTHLY: 30,
} as const;

/** سقف SaveVelocity برای جلوگیری از اسپایک با یک save تازه (anti-spike) */
export const SAVE_VELOCITY_MAX = 100;
