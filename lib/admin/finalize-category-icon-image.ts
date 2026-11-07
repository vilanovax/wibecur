import { uploadImageFromUrlDetailed } from '@/lib/object-storage';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { normalizeOptionalUrl } from '@/lib/admin/category-form-constants';
import { isValidHttpImageUrl, normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';

export type FinalizeCategoryIconResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

/**
 * آیکون گرافیکی دسته — ParsPack پوشه category-icons، پروفایل categoryIcon (۲۵۶×۲۵۶ WebP شفاف).
 */
export async function finalizeCategoryIconImage(
  url: unknown
): Promise<FinalizeCategoryIconResult> {
  const normalized = normalizeOptionalUrl(url);
  if (!normalized) {
    return { ok: true, url: null };
  }

  const storageUrl = normalizeImageUrlForStorage(normalized);
  if (!storageUrl || !isValidHttpImageUrl(storageUrl)) {
    return { ok: false, error: 'آدرس تصویر آیکون نامعتبر است' };
  }

  if (isOurStorageUrl(storageUrl) && storageUrl.includes('/category-icons/')) {
    return { ok: true, url: storageUrl };
  }

  const uploaded = await uploadImageFromUrlDetailed(
    storageUrl,
    'category-icons',
    'categoryIcon'
  );
  if (!uploaded.ok) {
    return {
      ok: false,
      error:
        uploaded.error ||
        'آپلود آیکون دسته به Object Storage ناموفق بود. تنظیمات ParsPack را بررسی کنید.',
    };
  }

  return { ok: true, url: uploaded.url };
}
