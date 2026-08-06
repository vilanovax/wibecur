import { isOurStorageUrl } from './object-storage-config';
import {
  isAllowedExternalImageUrl,
  isAllowedItemImageUrl,
  isPlaceholderCoverPath,
  isTmdbImageUrl,
} from './image-url-policy';
import { getItemPlaceholderImageUrl } from './item-placeholder-image';

export type ItemImageSource = {
  id?: string;
  imageUrl?: string | null;
  title: string;
  metadata?: Record<string, unknown> | null;
  categorySlug?: string | null;
};

function metaImageUrl(metadata?: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  for (const key of ['posterUrl', 'poster', 'imageUrl', 'coverUrl']) {
    const val = metadata[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return null;
}

function isUsableItemImage(url: string): boolean {
  if (!url || isPlaceholderCoverPath(url) || isTmdbImageUrl(url)) return false;
  if (url.startsWith('/')) return true;
  if (isOurStorageUrl(url)) return true;
  if (isAllowedItemImageUrl(url)) return true;
  if (isAllowedExternalImageUrl(url)) return true;
  return false;
}

/** آدرس نمایشی poster آیتم — بدون جایگزینی با بنر لیست */
export function resolveItemImage(input: ItemImageSource): string {
  const candidates = [input.imageUrl, metaImageUrl(input.metadata)].filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0
  );

  for (const raw of candidates) {
    const url = raw.trim();
    if (isUsableItemImage(url)) return url;
  }

  return '';
}

/** آدرس نمایشی با fallback تصویر رندومِ متناسب با دسته */
export function resolveItemDisplayImage(input: ItemImageSource): string {
  const resolved = resolveItemImage(input);
  if (resolved) return resolved;
  return getItemPlaceholderImageUrl({
    seed: input.id ?? input.title,
    title: input.title,
    categorySlug: input.categorySlug,
  });
}

export function withResolvedItemImage<T extends ItemImageSource>(
  item: T,
  categorySlug?: string | null
): T & { displayImageUrl: string } {
  return {
    ...item,
    displayImageUrl: resolveItemDisplayImage({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
      metadata: item.metadata,
      categorySlug,
    }),
  };
}

export function withResolvedItemImages<T extends ItemImageSource>(
  items: T[],
  categorySlug?: string | null
): (T & { displayImageUrl: string })[] {
  return items.map((item) => withResolvedItemImage(item, categorySlug));
}

export function isMovieLikeCategory(categorySlug?: string | null): boolean {
  if (!categorySlug) return false;
  const s = categorySlug.toLowerCase();
  return s.includes('movie') || s.includes('film') || s === 'series';
}

/** دسته‌هایی که کاورشان مستطیلی (پرتره) نمایش داده می‌شود: فیلم، سریال، کتاب و پادکست. */
export function isPortraitCoverCategory(categorySlug?: string | null): boolean {
  if (!categorySlug) return false;
  if (isMovieLikeCategory(categorySlug)) return true;
  const s = categorySlug.toLowerCase();
  return s.includes('book') || s.includes('literature') || s.includes('podcast');
}
