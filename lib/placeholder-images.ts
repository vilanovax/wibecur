/**
 * Placeholderهای محلی (همان origin) — فقط وقتی URL لیارا خالی است یا لود نشد.
 * تصاویر محتوا فقط از Liara Object Storage لود می‌شوند.
 */
export const PLACEHOLDER_COVER = '/images/placeholder-cover.svg';
export const PLACEHOLDER_SQUARE = '/images/placeholder-cover.svg';

export function getLocalPlaceholderUrl(size: 'cover' | 'square' = 'cover'): string {
  return size === 'square' ? PLACEHOLDER_SQUARE : PLACEHOLDER_COVER;
}

/** @deprecated از getLocalPlaceholderUrl استفاده کن */
export function getRandomPlaceholderUrl(
  _seed: string,
  size: 'cover' | 'square' = 'cover'
): string {
  return getLocalPlaceholderUrl(size);
}
