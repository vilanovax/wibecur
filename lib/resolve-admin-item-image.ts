import { isPlaceholderCoverPath, isTmdbImageUrl } from './image-url-policy';
import {
  isCorruptImageUrl,
  isValidHttpImageUrl,
  normalizeImageUrlForStorage,
} from './image-url-sanitize';

const META_IMAGE_KEYS = ['posterUrl', 'poster', 'imageUrl', 'coverUrl'] as const;

export type AdminItemImageSource = {
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  catalogImageUrl?: string | null;
  /** در پنل ادمین TMDB هم امتحان می‌شود (مثل فرم ویرایش) */
  allowTmdb?: boolean;
};

export function parseItemMetadata(
  metadata?: Record<string, unknown> | null | string
): Record<string, unknown> | null {
  if (!metadata) return null;
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

/** نرمال‌سازی URL ذخیره‌شده — پوشش حالت‌های رایج DB */
export function normalizeAdminImageUrl(raw: string): string | null {
  if (isCorruptImageUrl(raw)) {
    const fixed = normalizeImageUrlForStorage(raw);
    if (isValidHttpImageUrl(fixed)) return fixed;
    return null;
  }

  const t = raw.trim();
  if (!t || isPlaceholderCoverPath(t)) return null;
  if (isValidHttpImageUrl(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/')) return t;
  if (/^storage\.[a-z0-9.-]+\.liara\.space\//i.test(t) || /^[a-z0-9.-]*\.liara\.space\//i.test(t)) {
    return `https://${t.replace(/^\/+/, '')}`;
  }
  return null;
}

/** آدرس thumbnail در پنل ادمین — همان منطق فرم ویرایش (URL ذخیره‌شده) */
export function resolveAdminItemThumbnail(input: AdminItemImageSource): string {
  const allowTmdb = input.allowTmdb !== false;
  const candidates: string[] = [];
  const meta = parseItemMetadata(input.metadata ?? null);

  if (typeof input.imageUrl === 'string' && input.imageUrl.trim()) {
    candidates.push(input.imageUrl.trim());
  }
  if (typeof input.catalogImageUrl === 'string' && input.catalogImageUrl.trim()) {
    candidates.push(input.catalogImageUrl.trim());
  }
  if (meta) {
    for (const key of META_IMAGE_KEYS) {
      const val = meta[key];
      if (typeof val === 'string' && val.trim()) candidates.push(val.trim());
    }
  }

  for (const raw of candidates) {
    if (!allowTmdb && isTmdbImageUrl(raw)) continue;
    const normalized = normalizeAdminImageUrl(raw);
    if (normalized) return normalized;
  }

  return '';
}
