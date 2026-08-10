import { resolveCoverImage, type ResolveCoverImageInput } from '@/lib/resolve-cover-image';
import { withResolvedListDisplay } from '@/lib/list-display-images';

export type ListCoverSource = {
  coverImage?: string | null;
  horizontalImage?: string | null;
  slug: string;
  title: string;
  categories?: { slug?: string | null } | null;
  categorySlug?: string | null;
};

export function resolveListCover(list: ListCoverSource): string {
  return resolveCoverImage({
    coverImage: list.coverImage,
    horizontalImage: list.horizontalImage,
    listSlug: list.slug,
    listTitle: list.title,
    categorySlug: list.categorySlug ?? list.categories?.slug ?? null,
  });
}

export function withResolvedListCover<T extends ListCoverSource>(
  list: T
): T & { coverImage: string; bannerImage: string } {
  return withResolvedListDisplay(list);
}

export function withResolvedListCovers<T extends ListCoverSource>(
  lists: T[]
): (T & { coverImage: string; bannerImage: string })[] {
  return lists.map(withResolvedListCover);
}

export type { ResolveCoverImageInput };
