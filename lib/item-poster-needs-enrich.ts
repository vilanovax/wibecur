import { isOurStorageUrl } from './object-storage-config';
import { isAllowedItemImageUrl } from './image-url-policy';
import { isMovieLikeCategory, resolveItemImage } from './resolve-item-image';

function isLocalBannerPlaceholder(url: string): boolean {
  return url.startsWith('/images/banners/');
}

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
  if (isLocalBannerPlaceholder(resolved)) return true;
  if (isOurStorageUrl(resolved)) return true;
  if (isAllowedItemImageUrl(resolved)) return false;

  return true;
}
