import {
  buildCastandoProxyImageUrl,
  isCastandoImageProxyUrl,
  needsCastandoProxyWrap,
  unwrapCastandoImageProxyUrl,
  CASTANDO_IMAGE_PROXY_PREFIX,
} from '@/lib/castando-image-proxy';
import {
  resolveDownloadUrlForBulkImport,
  resolveOmdbPoster,
  type BulkImportImageContext,
  createBulkImportImageContext,
} from '@/lib/admin/bulk-import-image';
import {
  uploadImageFromUrlDetailed,
  type ImageFolder,
  type UploadImageFromUrlResult,
} from '@/lib/object-storage';
import type { ImageProfile } from '@/lib/image-config';
import { checkObjectStorageReady } from '@/lib/object-storage-readiness';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { isTmdbImageUrl } from '@/lib/image-url-policy';
import {
  isValidHttpImageUrl,
  normalizeImageUrlForStorage,
} from '@/lib/image-url-sanitize';

export type ImportExternalImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string; code?: string };

/** URL دانلود — پراکسی castando برای منابع خارجی مسدود */
export function resolveDownloadUrlForImageImport(sourceUrl: string): string {
  const normalized = normalizeImageUrlForStorage(sourceUrl);
  if (!normalized) return '';

  if (isCastandoImageProxyUrl(normalized)) {
    return normalized;
  }

  if (needsCastandoProxyWrap(normalized)) {
    return buildCastandoProxyImageUrl(normalized);
  }

  return normalized;
}

/** ترتیب تلاش دانلود: URL مستقیم → پراکسی castando */
export function buildImageImportDownloadCandidates(sourceUrl: string): string[] {
  const normalized = normalizeImageUrlForStorage(sourceUrl);
  if (!normalized) return [];

  const candidates: string[] = [];
  const seen = new Set<string>();

  const add = (url: string | null | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || !isValidHttpImageUrl(trimmed) || seen.has(trimmed)) return;
    seen.add(trimmed);
    candidates.push(trimmed);
  };

  const inner = unwrapCastandoImageProxyUrl(normalized);
  add(inner);
  for (const variant of expandPosterUrlVariants(inner)) {
    add(variant);
  }

  if (normalized !== inner) {
    add(normalized);
    for (const variant of expandPosterUrlVariants(normalized)) {
      add(variant);
    }
  }

  const proxyUrl = resolveDownloadUrlForImageImport(normalized);
  if (proxyUrl !== inner && proxyUrl !== normalized) {
    add(proxyUrl);
    if (
      proxyUrl.startsWith(CASTANDO_IMAGE_PROXY_PREFIX) &&
      !proxyUrl.includes(encodeURIComponent('://'))
    ) {
      const proxyInner = proxyUrl.slice(CASTANDO_IMAGE_PROXY_PREFIX.length);
      add(`${CASTANDO_IMAGE_PROXY_PREFIX}${encodeURIComponent(proxyInner)}`);
    }
  }

  return candidates;
}

/** نسخه‌های رایج URL پوستر Amazon / IMDb */
function expandPosterUrlVariants(url: string): string[] {
  const variants: string[] = [];
  const lower = url.toLowerCase();
  if (!lower.includes('media-amazon.com') && !lower.includes('media-imdb.com')) {
    return variants;
  }

  const deduped = url.replace(/@@/g, '@');
  if (deduped !== url) variants.push(deduped);

  const large = url.replace(/_V1_SX\d+/i, '_V1_FMjpg_UX1000');
  if (large !== url) variants.push(large);

  if (lower.includes('m.media-amazon.com')) {
    const imdbHost = url.replace(/m\.media-amazon\.com/i, 'ia.media-imdb.com');
    if (imdbHost !== url) variants.push(imdbHost);
  }

  return variants;
}

async function uploadFromDownloadCandidates(
  candidates: string[],
  folder: ImageFolder,
  profile?: ImageProfile
): Promise<UploadImageFromUrlResult> {
  let last: UploadImageFromUrlResult = {
    ok: false,
    error: 'دانلود تصویر ناموفق بود',
    code: 'download_failed',
  };

  for (const url of candidates) {
    const upload = await uploadImageFromUrlDetailed(url, folder, profile);
    if (upload.ok) return upload;
    last = upload;
  }

  return last;
}

function extractImdbId(metadata: Record<string, unknown>): string | null {
  const raw =
    (typeof metadata.imdbId === 'string' && metadata.imdbId.trim()) ||
    (typeof metadata.imdbID === 'string' && metadata.imdbID.trim()) ||
    null;
  return raw ? raw.replace(/^imdb-/i, '') : null;
}

async function resolveDownloadTarget(
  normalized: string,
  metadata: Record<string, unknown>,
  imageCtx?: BulkImportImageContext
): Promise<string> {
  const imdbId = extractImdbId(metadata);
  if (imdbId) {
    const ctx = imageCtx ?? (await createBulkImportImageContext());
    const omdbPoster = await resolveOmdbPoster(imdbId, ctx);
    if (omdbPoster) return omdbPoster;
  }

  if (isTmdbImageUrl(normalized)) {
    const ctx = imageCtx ?? (await createBulkImportImageContext());
    return (await resolveDownloadUrlForBulkImport(normalized, metadata, ctx)) ?? normalized;
  }

  return normalized;
}

/** لینک خارجی → دانلود (پراکسی در صورت نیاز) → آپلود ParsPack */
export async function importExternalImageToStorage(
  imageUrlRaw: string | null | undefined,
  folder: ImageFolder = 'items',
  metadata: Record<string, unknown> = {},
  imageCtx?: BulkImportImageContext,
  profile?: ImageProfile
): Promise<ImportExternalImageResult> {
  const readiness = await checkObjectStorageReady();
  if (!readiness.ready) {
    return {
      ok: false,
      error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
      code: 'storage_not_configured',
    };
  }

  const normalized = normalizeImageUrlForStorage(imageUrlRaw);
  if (!normalized || !isValidHttpImageUrl(normalized)) {
    return { ok: false, error: 'آدرس تصویر نامعتبر است' };
  }

  if (isOurStorageUrl(normalized)) {
    return { ok: true, url: normalized };
  }

  const downloadTarget = await resolveDownloadTarget(normalized, metadata, imageCtx);
  if (!downloadTarget || !isValidHttpImageUrl(downloadTarget)) {
    return { ok: false, error: 'آدرس تصویر قابل دانلود نیست' };
  }

  if (isOurStorageUrl(downloadTarget)) {
    return { ok: true, url: downloadTarget };
  }

  const candidates = buildImageImportDownloadCandidates(downloadTarget);
  const upload = await uploadFromDownloadCandidates(candidates, folder, profile);

  if (!upload.ok) {
    return {
      ok: false,
      error: upload.error,
      code: upload.code,
    };
  }

  return { ok: true, url: upload.url };
}
