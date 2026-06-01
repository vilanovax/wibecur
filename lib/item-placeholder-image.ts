import {
  inferCategorySlugFromTitle,
  normalizeCategorySlug,
  pickCategoryCoverVariant,
} from './category-cover-images';
import { isAllowedItemImageUrl, isPlaceholderCoverPath } from './image-url-policy';
import { isOurStorageUrl } from './object-storage-config';

export type ItemPlaceholderInput = {
  /** شناسه آیتم یا عنوان — برای انتخاب پایدار variant */
  seed: string;
  title?: string | null;
  categorySlug?: string | null;
};

/** تصویر placeholder محلی متناسب با دسته — پایدار بر اساس seed */
export function getItemPlaceholderImageUrl(input: ItemPlaceholderInput): string {
  const slug =
    normalizeCategorySlug(input.categorySlug) ??
    inferCategorySlugFromTitle(input.title) ??
    'default';
  const seed = (input.seed || input.title || slug).trim() || slug;
  return pickCategoryCoverVariant(slug, seed);
}

const BROKEN_IMAGE_FRAGMENTS = [
  'picsum.photos',
  'placehold.co',
  'via.placeholder.com',
  'placeholder-cover',
  'placeholder-item',
] as const;

/** آیا URL یک placeholder محلی (بنر دسته) است نه poster واقعی؟ */
export function isItemCategoryPlaceholderImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  const t = url.trim();
  if (isPlaceholderCoverPath(t)) return true;
  return t.startsWith('/images/banners/');
}

/** آیا imageUrl فعلی برای نمایش مناسب نیست و باید جایگزین شود؟ */
export function itemNeedsPlaceholderImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) return true;
  const url = imageUrl.trim();
  if (isPlaceholderCoverPath(url)) return true;
  const lower = url.toLowerCase();
  if (BROKEN_IMAGE_FRAGMENTS.some((f) => lower.includes(f))) return true;
  if (url.startsWith('/images/banners/')) return false;
  if (url.startsWith('/')) return false;
  if (isOurStorageUrl(url)) return false;
  if (isAllowedItemImageUrl(url)) return false;
  if (url.includes('upload.wikimedia.org')) return false;
  return true;
}
