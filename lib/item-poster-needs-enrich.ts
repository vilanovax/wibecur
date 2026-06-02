import { isTmdbImageUrl } from './image-url-policy';

/** واکشی runtime poster از TMDB غیرفعال — فقط تصاویر DB / ذخیره‌شده */
export function itemNeedsPosterEnrich(_input: {
  title: string;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  categorySlug?: string | null;
  force?: boolean;
}): boolean {
  return false;
}

/** آیا imageUrl ذخیره‌شده TMDB است؟ */
export function itemHasBlockedImageUrl(input: {
  imageUrl?: string | null;
}): boolean {
  return isTmdbImageUrl(input.imageUrl);
}
