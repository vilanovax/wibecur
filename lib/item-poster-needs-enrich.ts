import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isAllowedItemImageUrl } from '@/lib/image-url-policy';
import { isMovieLikeCategory, resolveItemImage } from '@/lib/resolve-item-image';

export function itemNeedsPosterEnrich(input: {
  title: string;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  categorySlug?: string | null;
  force?: boolean;
}): boolean {
  if (!isMovieLikeCategory(input.categorySlug)) return false;
  if (input.force) return true;

  const resolved = resolveItemImage({
    imageUrl: input.imageUrl,
    title: input.title,
    metadata: input.metadata,
    categorySlug: input.categorySlug,
  });

  if (!resolved) return true;
  if (resolved.includes('image.tmdb.org')) return false;
  if (isOurStorageUrl(resolved)) return true;
  if (isAllowedItemImageUrl(resolved)) return false;

  return true;
}
