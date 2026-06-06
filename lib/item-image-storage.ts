import { isOurStorageUrl, isLegacyLiaraStorageUrl } from '@/lib/object-storage-config';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';

/** URL تصویر روی ParsPack Object Storage (استوریج فعلی اپ) */
export function isAppObjectStorageImageUrl(url: string | null | undefined): boolean {
  return isOurStorageUrl(url || '');
}

/** @deprecated از isAppObjectStorageImageUrl استفاده کنید */
export function isLiaraObjectStorageImageUrl(url: string | null | undefined): boolean {
  return isAppObjectStorageImageUrl(url);
}

/**
 * تصویر با لینک مستقیم خارجی — نه ParsPack (شامل Liara قدیمی، TMDb، …)
 */
export function isExternalDirectImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t || isPlaceholderCoverPath(t)) return false;
  if (isAppObjectStorageImageUrl(t)) return false;
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('//');
}

export function isLegacyExternalImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  return isLegacyLiaraStorageUrl(t) || isExternalDirectImageUrl(t);
}

export function getItemEffectiveImageUrl(input: {
  imageUrl?: string | null;
  catalogImageUrl?: string | null;
}): string {
  if (typeof input.imageUrl === 'string' && input.imageUrl.trim()) {
    return input.imageUrl.trim();
  }
  if (typeof input.catalogImageUrl === 'string' && input.catalogImageUrl.trim()) {
    return input.catalogImageUrl.trim();
  }
  return '';
}

export function itemUsesExternalDirectImage(input: {
  imageUrl?: string | null;
  catalogImageUrl?: string | null;
}): boolean {
  return isExternalDirectImageUrl(getItemEffectiveImageUrl(input));
}

export function truncateImageUrl(url: string, max = 56): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

export function externalImageHost(url: string): string {
  try {
    const host = new URL(url.startsWith('//') ? `https:${url}` : url).hostname;
    if (host.includes('parspack.net')) return 'ParsPack';
    if (host.includes('liara')) return 'Liara (قدیمی)';
    return host.replace(/^www\./, '');
  } catch {
    return '—';
  }
}
