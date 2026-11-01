/**
 * Slug helpers for admin lists (transliteration فارسی + لاتین)
 */

import {
  slugifyCategoryName,
  buildSlugCandidates,
  isValidCategorySlug,
} from '@/lib/admin/category-slug';

export const isValidListSlug = isValidCategorySlug;
export { buildSlugCandidates };

/** واژه‌های پرتکرار در عنوان لیست */
const LIST_WORD_MAP: Record<string, string> = {
  بهترین: 'best',
  برتر: 'top',
  'فیلم‌های': 'films',
  فیلمهای: 'films',
  فیلمها: 'films',
  فیلم: 'film',
  'سریال‌های': 'series',
  سریالها: 'series',
  سریال: 'series',
  مستند: 'documentary',
  'مستند‌های': 'documentaries',
  انیمیشن: 'animation',
  کمدی: 'comedy',
  عاشقانه: 'romance',
  ترسناک: 'horror',
  اکشن: 'action',
  قبل: 'before',
  بعد: 'after',
  شب: 'night',
  خواب: 'sleep',
  خانوادگی: 'family',
  ایرانی: 'iranian',
  کلاسیک: 'classic',
  جدید: 'new',
  قدیمی: 'classic',
  که: 'that',
  برای: 'for',
  دیدن: 'watch',
  تماشا: 'watch',
  ساکت: 'silent',
};

export function slugFromTitle(title: string): string {
  let text = title.trim().normalize('NFKC');
  if (!text) return '';

  const sorted = Object.keys(LIST_WORD_MAP).sort((a, b) => b.length - a.length);
  for (const word of sorted) {
    text = text.split(word).join(` ${LIST_WORD_MAP[word]} `);
  }

  const slug = slugifyCategoryName(text);
  return slug === 'category' && !/[a-z0-9]/.test(text) ? 'list' : slug;
}

/** هنگام تایپ: خط تیرهٔ پایانی را نگه می‌دارد تا بشود mid-string و انتهای فیلد `-` زد. */
export function normalizeListSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/g, '');
}

/** قبل از ذخیره / اعتبارسنجی نهایی — خط تیرهٔ ابتدا و انتها حذف می‌شود. */
export function finalizeListSlug(value: string): string {
  return normalizeListSlug(value).replace(/-+$/g, '');
}
