import { toAdminStorageImageSrc } from '@/lib/liara-image-url';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isCastandoImageProxyUrl } from '@/lib/castando-image-proxy';

export type AdminImageSourceKind = 'storage' | 'proxy' | 'external' | 'none';

export function classifyAdminImageSource(
  url: string | null | undefined
): AdminImageSourceKind {
  if (!url?.trim()) return 'none';
  const t = url.trim();
  if (isOurStorageUrl(t)) return 'storage';
  if (isCastandoImageProxyUrl(t)) return 'proxy';
  if (t.startsWith('http://') || t.startsWith('https://')) return 'external';
  return 'none';
}

/**
 * URL نمایش در ادمین — فقط همان مقدار DB (بدون wrap خودکار).
 * ParsPack از proxy داخلی اپ؛ بقیه همان URL ذخیره‌شده.
 */
export function resolveAdminDisplayImageSrc(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';
  const trimmed = raw.trim();

  if (isOurStorageUrl(trimmed)) {
    return toAdminStorageImageSrc(trimmed);
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
}

export const ADMIN_IMAGE_SOURCE_LABEL: Record<AdminImageSourceKind, string> = {
  storage: 'S3',
  proxy: 'پراکسی',
  external: 'خارجی',
  none: '—',
};

export const ADMIN_IMAGE_SOURCE_STYLE: Record<
  AdminImageSourceKind,
  string
> = {
  storage: 'bg-emerald-500/90 text-white',
  proxy: 'bg-sky-500/90 text-white',
  external: 'bg-amber-500/90 text-white',
  none: 'bg-gray-500/80 text-white',
};
