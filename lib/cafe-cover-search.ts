import { normalizeCafeMetadataFields } from '@/lib/cafe-metadata';

export type CafeCoverMetadata = {
  address?: string;
  instagram?: string;
  website?: string;
  mapsUrl?: string;
  cuisine?: string;
};

const CAFE_CATEGORY_SLUGS = new Set(['cafe', 'restaurant']);

export function isCafeCategorySlug(slug?: string | null): boolean {
  if (!slug) return false;
  const normalized = slug.toLowerCase().trim();
  if (CAFE_CATEGORY_SLUGS.has(normalized)) return true;
  return normalized.includes('cafe') || normalized.includes('restaurant');
}

export function extractCafeCoverMetadata(
  metadata: unknown
): CafeCoverMetadata {
  const normalized = normalizeCafeMetadataFields(
    metadata != null && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : null
  );

  return {
    address: typeof normalized.address === 'string' ? normalized.address : undefined,
    instagram: typeof normalized.instagram === 'string' ? normalized.instagram : undefined,
    website: typeof normalized.website === 'string' ? normalized.website : undefined,
    mapsUrl: typeof normalized.mapsUrl === 'string' ? normalized.mapsUrl : undefined,
    cuisine: typeof normalized.cuisine === 'string' ? normalized.cuisine : undefined,
  };
}

/** کوئری جستجوی تصویر کافه/رستوران — فقط «رستوران کافه {نام}» */
export function buildCafePhotoSearchQuery(
  title: string,
  _metadata?: CafeCoverMetadata | null,
  _listTitle?: string | null
): string {
  const name = title.trim();
  if (!name) return 'رستوران کافه';
  return `رستوران کافه ${name}`.slice(0, 120);
}
