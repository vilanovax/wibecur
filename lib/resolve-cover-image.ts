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
} from '@/lib/image-url-policy';
import { isOurStorageUrl } from '@/lib/object-storage-config';

export interface ResolveCoverImageInput {
  coverImage?: string | null;
  categorySlug?: string | null;
  listSlug?: string | null;
  listTitle?: string | null;
}

function isUsableCoverUrl(cover: string): boolean {
  return (
    isOurStorageUrl(cover) ||
    cover.startsWith('/') ||
    isAllowedExternalImageUrl(cover)
  );
}

function coverLooksLikeCar(cover: string): boolean {
  const t = cover.toLowerCase();
  return (
    t.includes('/car.webp') ||
    t.includes('car.webp') ||
    t.includes('abandoned_car') ||
    t.includes('/cars/') ||
    /[/_-]car[/_-]/.test(t)
  );
}

/**
 * کاور بنر/لیست
 * ۰. کاور پین‌شدهٔ seed (اجباری — جلوگیری از ماشین روی کافه و مشابه)
 * ۱. تصویر واقعی DB/استوریج (اگر placeholder نباشد و با دسته جور باشد)
 * ۲. کاور موضوعی از عنوان/slug
 * ۳. variant متنوع بر اساس دسته + slug
 */
export function resolveCoverImage(input: ResolveCoverImageInput): string {
  const cover = input.coverImage?.trim() ?? '';
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

  // seedهای شناخته‌شده: همیشه topic پین — حتی اگر DB عکس اشتباه داشته باشد
  const pinned = getPinnedListTopicCover(listSlug);
  if (pinned) return pinned;

  const coverTrusted =
    !isGenericListCover(cover) &&
    isUsableCoverUrl(cover) &&
    isBannerCompatibleWithCategory(cover, coverCategory) &&
    !(coverLooksLikeCar(cover) && coverCategory && !['car', 'tech'].includes(coverCategory));

  if (coverTrusted) {
    return cover;
  }

  const topicCover = getListTopicCoverUrl(listSlug, coverCategory, input.listTitle);
  if (topicCover && isBannerCompatibleWithCategory(topicCover, coverCategory)) {
    return topicCover;
  }

  if (coverCategory) {
    return pickCategoryCoverVariant(coverCategory, seed);
  }

  return pickCategoryCoverVariant('default', seed);
}
