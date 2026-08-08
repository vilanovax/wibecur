import {
  getListTopicCoverUrl,
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

/**
 * کاور بنر/لیست
 * ۱. تصویر واقعی DB/استوریج (اگر placeholder نباشد و با دسته جور باشد)
 * ۲. کاور موضوعی اختصاصی slug
 * ۳. variant متنوع بر اساس دسته + slug
 */
export function resolveCoverImage(input: ResolveCoverImageInput): string {
  const cover = input.coverImage?.trim() ?? '';
  const listSlug = normalizeCategorySlug(input.listSlug);
  const categorySlug =
    normalizeCategorySlug(input.categorySlug) ??
    inferCategorySlugFromTitle(input.listTitle);

  const seed =
    [listSlug, input.listTitle?.trim()].filter(Boolean).join(':') ||
    categorySlug ||
    'default';

  // کاور اختصاصی — فقط اگر generic/placeholder نباشد و بنر اشتباه دسته نباشد
  if (
    !isGenericListCover(cover) &&
    isUsableCoverUrl(cover) &&
    isBannerCompatibleWithCategory(cover, categorySlug)
  ) {
    return cover;
  }

  const topicCover = getListTopicCoverUrl(listSlug, categorySlug, input.listTitle);
  if (topicCover && isBannerCompatibleWithCategory(topicCover, categorySlug)) {
    return topicCover;
  }

  if (categorySlug) {
    return pickCategoryCoverVariant(categorySlug, seed);
  }

  return pickCategoryCoverVariant('default', seed);
}
