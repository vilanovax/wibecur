import axios from 'axios';
import { ensureImageInLiara, type ImageFolder } from '@/lib/object-storage';
import { isTmdbImageUrl } from '@/lib/image-url-policy';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { getDecryptedSettings } from '@/lib/settings';
import { normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';

export type BulkImportImageContext = {
  omdbApiKey: string | null;
  omdbPosterCache: Map<string, string | null>;
};

export async function createBulkImportImageContext(): Promise<BulkImportImageContext> {
  const settings = await getDecryptedSettings();
  return {
    omdbApiKey: settings.omdbApiKey ?? null,
    omdbPosterCache: new Map(),
  };
}

export async function fetchOmdbPosterByImdbId(
  imdbId: string,
  omdbApiKey: string
): Promise<string | null> {
  try {
    const url = `https://www.omdbapi.com/?apikey=${omdbApiKey}&i=${imdbId}&plot=short`;
    const response = await axios.get(url, { timeout: 8000 });
    const poster = response.data?.Poster;
    if (typeof poster === 'string' && poster.trim() && poster !== 'N/A') {
      return poster.trim();
    }
  } catch {
    /* OMDb در دسترس نیست */
  }
  return null;
}

export async function resolveOmdbPoster(
  imdbId: string,
  ctx: BulkImportImageContext
): Promise<string | null> {
  if (ctx.omdbPosterCache.has(imdbId)) {
    return ctx.omdbPosterCache.get(imdbId) ?? null;
  }
  if (!ctx.omdbApiKey) {
    ctx.omdbPosterCache.set(imdbId, null);
    return null;
  }
  const poster = await fetchOmdbPosterByImdbId(imdbId, ctx.omdbApiKey);
  ctx.omdbPosterCache.set(imdbId, poster);
  return poster;
}

/** URL قابل دانلود — TMDB → OMDb poster در صورت امکان */
export async function resolveDownloadUrlForBulkImport(
  imageUrlRaw: string | null | undefined,
  metadata: Record<string, unknown>,
  ctx?: BulkImportImageContext
): Promise<string | null> {
  const unwrapped = normalizeImageUrlForStorage(imageUrlRaw);
  if (!unwrapped) return null;

  if (isOurStorageUrl(unwrapped)) return unwrapped;
  if (!isTmdbImageUrl(unwrapped)) return unwrapped;

  const imdbId =
    (typeof metadata.imdbId === 'string' && metadata.imdbId.trim()) ||
    (typeof metadata.imdbID === 'string' && metadata.imdbID.trim()) ||
    null;

  if (!imdbId) return unwrapped;

  const imageCtx = ctx ?? (await createBulkImportImageContext());
  const omdbPoster = await resolveOmdbPoster(imdbId, imageCtx);
  return omdbPoster || unwrapped;
}

/** تصویر import — unwrap پروکسی، fallback OMDb، آپلود ParsPack */
export async function resolveBulkImportImageForStorage(
  imageUrlRaw: string | null | undefined,
  metadata: Record<string, unknown>,
  folder: ImageFolder = 'items',
  ctx?: BulkImportImageContext
): Promise<string | undefined> {
  const downloadUrl = await resolveDownloadUrlForBulkImport(imageUrlRaw, metadata, ctx);
  if (!downloadUrl) return undefined;

  if (isOurStorageUrl(downloadUrl)) return downloadUrl;

  const stored = await ensureImageInLiara(downloadUrl, folder);
  if (!stored) return undefined;
  if (isTmdbImageUrl(stored)) return undefined;
  return stored;
}
