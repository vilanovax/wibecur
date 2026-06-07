import { uploadImageFromUrlDetailed } from '@/lib/object-storage';
import { isParsPackHubsUrl } from '@/lib/object-storage-config';
import { normalizeOptionalUrl } from '@/lib/admin/category-form-constants';
import { isValidHttpImageUrl, normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';

export type FinalizeCategoryHeroResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

/**
 * کاور دسته: همیشه در ParsPack (پوشه hubs) با پروفایل hubCover (۱۶۰۰×۹۰۰ WebP ~۳۲۰KB)
 * — URL خارجی یا Liara قدیمی → دانلود، بهینه، آپلود
 * — URL قبلاً در hubs → بدون پردازش مجدد
 */
export async function finalizeCategoryHeroImage(
  url: unknown
): Promise<FinalizeCategoryHeroResult> {
  const normalized = normalizeOptionalUrl(url);
  if (!normalized) {
    return { ok: true, url: null };
  }

  const storageUrl = normalizeImageUrlForStorage(normalized);
  if (!storageUrl || !isValidHttpImageUrl(storageUrl)) {
    return { ok: false, error: 'آدرس تصویر کاور نامعتبر است' };
  }

  if (isParsPackHubsUrl(storageUrl)) {
    return { ok: true, url: storageUrl };
  }

  const uploaded = await uploadImageFromUrlDetailed(storageUrl, 'hubs', 'hubCover');
  if (!uploaded.ok) {
    return {
      ok: false,
      error:
        uploaded.error ||
        'آپلود کاور دسته به Object Storage ناموفق بود. تنظیمات ParsPack را در ادمین بررسی کنید.',
    };
  }

  return { ok: true, url: uploaded.url };
}
