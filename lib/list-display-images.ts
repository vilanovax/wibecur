import { resolveListCover, type ListCoverSource } from '@/lib/resolve-list-cover';
import { isDisplayableCoverPath } from '@/lib/image-url-policy';

export type ListImageSource = ListCoverSource & {
  horizontalImage?: string | null;
};

/** بنر افقی — horizontalImage در صورت وجود، وگرنه کاور resolve‌شده */
export function resolveListBannerImage(list: ListImageSource): string {
  const horizontal = list.horizontalImage?.trim();
  if (horizontal && isDisplayableCoverPath(horizontal)) {
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
