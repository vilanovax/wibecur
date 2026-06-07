/**
 * نمایش تصاویر: Liara، Wikimedia (ایران)، یا مسیر محلی.
 */
import { toAbsoluteImageUrl } from '@/lib/seo';
import { isLegacyLiaraStorageUrl, isOurStorageUrl } from '@/lib/object-storage-config';
import { resolveStorageImageDisplayUrl } from '@/lib/storage-image-url';
import { getCategoryHeroImageUrl } from '@/lib/category-cover-images';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import { isAllowedExternalImageUrl, isAllowedItemImageUrl } from '@/lib/image-url-policy';

function finalizeDisplayUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  const absolute = toAbsoluteImageUrl(url) ?? url;
  if (isOurStorageUrl(absolute) || isLegacyLiaraStorageUrl(absolute)) {
    return resolveStorageImageDisplayUrl(absolute);
  }
  if (isAllowedExternalImageUrl(absolute)) return absolute;
  return '';
}

/** آدرس نهایی برای <img src> — Liara (مستقیم یا same-origin) */
export function getDisplayImageUrl(
  rawUrl: string | null | undefined,
  categorySlug?: string | null
): string {
  if (categorySlug && !rawUrl?.trim()) {
    return getCategoryHeroImageUrl(categorySlug);
  }
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();
  const absolute = toAbsoluteImageUrl(trimmed) ?? trimmed;
  if (isOurStorageUrl(absolute) || isLegacyLiaraStorageUrl(absolute)) {
    return resolveStorageImageDisplayUrl(absolute);
  }
  if (isAllowedExternalImageUrl(absolute)) return absolute;
  if (isAllowedItemImageUrl(absolute)) return absolute;
  if (absolute.startsWith('/')) return absolute;
  return categorySlug ? finalizeDisplayUrl(getCategoryHeroImageUrl(categorySlug)) : '';
}

export function getListCoverDisplayUrl(input: {
  coverImage?: string | null;
  categorySlug?: string | null;
  listSlug?: string | null;
  listTitle?: string | null;
}): string {
  return finalizeDisplayUrl(
    resolveCoverImage({
      coverImage: input.coverImage,
      categorySlug: input.categorySlug,
      listSlug: input.listSlug,
      listTitle: input.listTitle,
    })
  );
}

export function getCategoryHeroDisplayUrl(
  heroImage: string | null | undefined,
  categorySlug: string
): string {
  const resolved = heroImage?.trim()
    ? getDisplayImageUrl(heroImage, categorySlug)
    : getCategoryHeroImageUrl(categorySlug);
  return finalizeDisplayUrl(resolved) || getCategoryHeroImageUrl(categorySlug);
}
