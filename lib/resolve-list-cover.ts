import { resolveCoverImage, type ResolveCoverImageInput } from '@/lib/resolve-cover-image';

export type ListCoverSource = {
  coverImage?: string | null;
  slug: string;
  title: string;
  categories?: { slug?: string | null } | null;
  categorySlug?: string | null;
};

export function resolveListCover(list: ListCoverSource): string {
  return resolveCoverImage({
    coverImage: list.coverImage,
    listSlug: list.slug,
    listTitle: list.title,
    categorySlug: list.categorySlug ?? list.categories?.slug ?? null,
  });
}

export function withResolvedListCover<T extends ListCoverSource>(
  list: T
): T & { coverImage: string } {
  return {
    ...list,
    coverImage: resolveListCover(list),
  };
}

export function withResolvedListCovers<T extends ListCoverSource>(lists: T[]): (T & { coverImage: string })[] {
  return lists.map(withResolvedListCover);
}

export type { ResolveCoverImageInput };
