import { resolveListCover, type ListCoverSource } from '@/lib/resolve-list-cover';
import { coverLooksLikeCar } from '@/lib/resolve-cover-image';
import { isBannerCompatibleWithCategory } from '@/lib/category-cover-images';
import { isDisplayableCoverPath } from '@/lib/image-url-policy';

export type ListImageSource = ListCoverSource & {
  horizontalImage?: string | null;
};

function categoryHint(list: ListImageSource): string | null {
  return list.categorySlug ?? list.categories?.slug ?? null;
}

/**
 * بنر افقی — horizontalImage فقط اگر با دسته جور باشد و ماشینِ اشتباه نباشد؛
 * وگرنه کاور resolve‌شده (ترجیح coverImage معتبر).
 */
export function resolveListBannerImage(list: ListImageSource): string {
  const horizontal = list.horizontalImage?.trim();
  const cat = categoryHint(list);
  const horizontalOk =
    Boolean(horizontal) &&
    isDisplayableCoverPath(horizontal) &&
    isBannerCompatibleWithCategory(horizontal, cat) &&
    !(coverLooksLikeCar(horizontal!) && cat && !['car', 'tech'].includes(cat));

  if (horizontalOk && horizontal) {
    return horizontal;
  }
  return resolveListCover(list);
}

export function withResolvedListDisplay<T extends ListImageSource>(
  list: T
): T & { coverImage: string; bannerImage: string } {
  return {
    ...list,
    coverImage: resolveListCover(list),
    bannerImage: resolveListBannerImage(list),
  };
}

export function withResolvedListDisplays<T extends ListImageSource>(
  lists: T[]
): (T & { coverImage: string; bannerImage: string })[] {
  return lists.map(withResolvedListDisplay);
}
