import {
  getListTopicCoverUrl,
  getPinnedListTopicCover,
  inferCategorySlugFromTitle,
  isBannerCompatibleWithCategory,
  normalizeCategorySlug,
  pickCategoryCoverVariant,
} from '@/lib/category-cover-images';
import {
  isAllowedExternalImageUrl,
  isGenericListCover,
  normalizeLocalBannerSrc,
} from '@/lib/image-url-policy';
import { isLegacyLiaraStorageUrl, isOurStorageUrl } from '@/lib/object-storage-config';

export interface ResolveCoverImageInput {
  coverImage?: string | null;
  /** بنر افقی — فقط وقتی کاور عمودی نامعتبر است به‌عنوان جایگزین */
  horizontalImage?: string | null;
  categorySlug?: string | null;
  listSlug?: string | null;
  listTitle?: string | null;
}

function isUsableCoverUrl(cover: string): boolean {
  return (
    isOurStorageUrl(cover) ||
    isLegacyLiaraStorageUrl(cover) ||
    cover.startsWith('/') ||
    isAllowedExternalImageUrl(cover)
  );
}

/** بنر/کاور ماشین — حتی با نام گمراه‌کننده مثل Wey Coffee 02 */
export function coverLooksLikeCar(cover: string): boolean {
  const t = cover.toLowerCase();
  return (
    t.includes('/car.webp') ||
    t.includes('car.webp') ||
    t.includes('abandoned_car') ||
    t.includes('/cars/') ||
    t.includes('wey_coffee') ||
    t.includes('coffee_02') ||
    t.includes('iaa_2021') ||
    /[/_-]car[/_-]/.test(t)
  );
}

function isTrustedFieldCover(
  cover: string,
  coverCategory: string | null
): boolean {
  if (!cover.trim() || isGenericListCover(cover) || !isUsableCoverUrl(cover)) {
    return false;
  }
  if (!isBannerCompatibleWithCategory(cover, coverCategory)) return false;
  if (coverLooksLikeCar(cover) && coverCategory && !['car', 'tech'].includes(coverCategory)) {
    return false;
  }
  return true;
}

/**
 * کاور بنر/لیست
 * ۱. تصویر واقعی DB/استوریج (اگر placeholder نباشد و با دسته جور باشد)
 * ۲. کاور پین‌شدهٔ seed — فقط وقتی کاور واقعی ثبت نشده
 * ۳. کاور موضوعی از عنوان/slug
 * ۴. variant متنوع بر اساس دسته + slug
 */
export function resolveCoverImage(input: ResolveCoverImageInput): string {
  const cover = normalizeLocalBannerSrc(input.coverImage ?? '');
  const listSlug = normalizeCategorySlug(input.listSlug);
  const titleInferred = inferCategorySlugFromTitle(input.listTitle);
  const categorySlug =
    normalizeCategorySlug(input.categorySlug) ?? titleInferred;

  const coverCategory =
    titleInferred &&
    categorySlug &&
    titleInferred !== categorySlug &&
    ['cafe', 'cafes', 'restaurant', 'restaurants', 'movies', 'movie', 'film', 'books', 'book'].includes(
      titleInferred
    )
      ? titleInferred
      : categorySlug;

  const seed =
    [listSlug, input.listTitle?.trim()].filter(Boolean).join(':') ||
    coverCategory ||
    'default';

  if (isTrustedFieldCover(cover, coverCategory)) {
    return cover;
  }

  const horizontal = normalizeLocalBannerSrc(input.horizontalImage ?? '');
  if (horizontal && isTrustedFieldCover(horizontal, coverCategory)) {
    return horizontal;
  }

  // فقط وقتی کاور/بنر واقعی نداریم؛ ماشین اشتباه را جایگزین می‌کند
  const pinned = getPinnedListTopicCover(listSlug);
  if (pinned && !coverLooksLikeCar(pinned)) return pinned;

  const topicCover = getListTopicCoverUrl(listSlug, coverCategory, input.listTitle);
  if (
    topicCover &&
    !coverLooksLikeCar(topicCover) &&
    isBannerCompatibleWithCategory(topicCover, coverCategory)
  ) {
    return topicCover;
  }

  if (coverCategory) {
    const variant = pickCategoryCoverVariant(coverCategory, seed);
    if (!coverLooksLikeCar(variant) || ['car', 'tech'].includes(coverCategory)) {
      return variant;
    }
    return pickCategoryCoverVariant(
      coverCategory === 'car' || coverCategory === 'tech' ? coverCategory : 'cafe',
      seed
    );
  }

  return pickCategoryCoverVariant('default', seed);
}
