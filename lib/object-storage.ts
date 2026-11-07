import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import {
  buildStorageObjectKey,
  buildStoragePublicUrl,
  getObjectStorageConfig,
  isOurStorageUrl,
  STORAGE_OBJECT_PREFIX,
} from './object-storage-config';
import crypto from 'crypto';
import { optimizeImageDetailed } from './image-optimizer';
import { buildImageDownloadHeaders } from './image-download-headers';
import { profileForStorageFolder } from './upload-profiles';
import type { ImageProfile } from './image-config';
import {
  isValidHttpImageUrl,
  normalizeImageUrlForStorage,
} from './image-url-sanitize';
import { isTmdbImageUrl } from './image-url-policy';
import {
  isPublicHttpUrl,
  ssrfSafeHttpAgent,
  ssrfSafeHttpsAgent,
} from './ssrf-guard';
import { toNodeBuffer } from './to-node-buffer';

const isDev = process.env.NODE_ENV === 'development';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatStorageUploadError(error: unknown): string {
  const msg = String((error as Error)?.message ?? error ?? '');
  const name = String((error as { name?: string })?.name ?? '');
  const code = String((error as { Code?: string; code?: string })?.Code
    ?? (error as { code?: string })?.code
    ?? '');
  if (msg.includes('ECONNREFUSED') || code === 'ECONNREFUSED') {
    return 'اتصال به ParsPack برقرار نشد — لطفاً چند لحظه بعد دوباره تلاش کنید.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout') || name === 'TimeoutError') {
    return 'زمان اتصال به ParsPack تمام شد — دوباره تلاش کنید.';
  }
  if (msg.includes('NetworkingError') || msg.includes('ENOTFOUND') || code === 'ENOTFOUND') {
    return 'خطای شبکه در اتصال به ParsPack.';
  }
  if (
    code === 'InvalidAccessKeyId' ||
    code === 'SignatureDoesNotMatch' ||
    msg.includes('InvalidAccessKeyId') ||
    msg.includes('SignatureDoesNotMatch')
  ) {
    return 'کلید دسترسی ParsPack نامعتبر است — Access Key و Secret Key را در تنظیمات بررسی کنید.';
  }
  if (code === 'AccessDenied' || msg.includes('AccessDenied') || msg.includes('Access Denied')) {
    return 'دسترسی آپلود به باکت ParsPack رد شد — دسترسی کلید و policy باکت را بررسی کنید.';
  }
  if (code === 'NoSuchBucket' || msg.includes('NoSuchBucket')) {
    return 'باکت ParsPack پیدا نشد — نام باکت را در تنظیمات بررسی کنید.';
  }
  return msg || 'خطا در آپلود به ParsPack';
}

function isRetryableStorageError(error: unknown): boolean {
  const msg = String((error as Error)?.message ?? '');
  const name = String((error as { name?: string })?.name ?? '');
  const httpStatus = Number((error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode ?? 0);
  return (
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('timeout') ||
    msg.includes('socket hang up') ||
    msg.includes('ECONNRESET') ||
    msg.includes('SlowDown') ||
    msg.includes('ServiceUnavailable') ||
    name === 'TimeoutError' ||
    httpStatus === 503 ||
    httpStatus === 500 ||
    httpStatus === 429
  );
}

async function withStorageRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableStorageError(error) || i === attempts - 1) break;
      await sleep(400 * (i + 1));
    }
  }
  throw lastError;
}

async function getS3Client() {
  const config = await getObjectStorageConfig();

  if (!config) {
    if (isDev) console.warn('ParsPack Object Storage not configured');
    return null;
  }

  return new S3Client({
    region: 'us-east-1',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    maxAttempts: 4,
  });
}

async function putObjectToBucket(
  client: S3Client,
  uploadParams: {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
  }
): Promise<void> {
  // ParsPack معمولاً با bucket policy عمومی است و ACL را پشتیبانی نمی‌کند —
  // اول بدون ACL؛ اگر سرور ACL خواست، یک‌بار با public-read تکرار کن.
  await withStorageRetry(async () => {
    try {
      const upload = new Upload({ client, params: uploadParams });
      await upload.done();
    } catch (err: unknown) {
      const msg = String((err as Error)?.message ?? '');
      const wantsAcl =
        msg.includes('AccessControlList') ||
        msg.includes('ACL') ||
        msg.includes('public-read');
      if (!wantsAcl) throw err;
      const upload = new Upload({
        client,
        params: { ...uploadParams, ACL: 'public-read' as const },
      });
      await upload.done();
    }
  });
}

async function uploadBufferToStorage(
  buffer: Buffer,
  _contentType: string,
  folder: string,
  profile: ImageProfile
): Promise<{ url: string; optimization: Awaited<ReturnType<typeof optimizeImageDetailed>> }> {
  const client = await getS3Client();
  const config = await getObjectStorageConfig();
  if (!client || !config) {
    const { checkObjectStorageReady } = await import('./object-storage-readiness');
    const readiness = await checkObjectStorageReady();
    throw new Error(readiness.error || 'ParsPack Object Storage پیکربندی نشده است');
  }

  const optimized = await optimizeImageDetailed(buffer, { profile });
  if (!optimized.buffer?.length) {
    throw new Error('بهینه‌سازی تصویر خروجی خالی برگرداند');
  }

  const filename = `${crypto.randomUUID()}${optimized.ext}`;
  const key = buildStorageObjectKey(folder, filename);

  console.info('[storage] uploading', {
    key,
    profile,
    bytes: optimized.optimizedBytes,
    dimensions: `${optimized.width ?? '?'}x${optimized.height ?? '?'}`,
  });

  await putObjectToBucket(client, {
    Bucket: config.bucketName,
    Key: key,
    Body: optimized.buffer,
    ContentType: optimized.contentType,
  });

  return {
    url: buildStoragePublicUrl(config, key),
    optimization: optimized,
  };
}

/** وب‌پی آماده‌شده را بدون بهینه‌سازی دوباره در پارس‌پک می‌گذارد. */
export async function uploadWebpBuffer(buffer: Buffer, folder: string): Promise<string | null> {
  const client = await getS3Client();
  const config = await getObjectStorageConfig();
  if (!client || !config) return null;

  const key = buildStorageObjectKey(folder, `${crypto.randomUUID()}.webp`);
  const uploadParams = {
    Bucket: config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
  };

  await putObjectToBucket(client, uploadParams);

  return buildStoragePublicUrl(config, key);
}

export type UploadImageFromUrlResult =
  | { ok: true; url: string }
  | {
      ok: false;
      error: string;
      code?: 'storage_not_configured' | 'download_failed' | 'upload_failed';
    };

function profileForFolder(folder: string) {
  return profileForStorageFolder(folder);
}

export type UploadImageFromUrlOptions = {
  timeoutMs?: number;
};

export async function uploadImageFromUrlDetailed(
  imageUrl: string,
  folder: string = 'images',
  profile?: ImageProfile,
  options?: UploadImageFromUrlOptions
): Promise<UploadImageFromUrlResult> {
  try {
    const client = await getS3Client();
    const config = await getObjectStorageConfig();

    if (!client || !config) {
      const { checkObjectStorageReady } = await import('./object-storage-readiness');
      const readiness = await checkObjectStorageReady();
      return {
        ok: false,
        code: 'storage_not_configured',
        error: readiness.error || 'ParsPack Object Storage پیکربندی نشده است',
      };
    }

    // محافظ SSRF — قبل از هر fetch سمت سرور آدرس را اعتبارسنجی کن.
    if (!isPublicHttpUrl(imageUrl)) {
      return {
        ok: false,
        code: 'download_failed',
        error: 'آدرس تصویر نامعتبر یا غیرمجاز است',
      };
    }

    if (isDev) console.log('Downloading image from:', imageUrl);

    const timeoutMs = options?.timeoutMs ?? 30000;

    let response;
    try {
      response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: timeoutMs,
        // اعتبارسنجی IP مقصد در هر اتصال/redirect توسط lookup سفارشی
        httpAgent: ssrfSafeHttpAgent,
        httpsAgent: ssrfSafeHttpsAgent,
        maxRedirects: 3,
        maxContentLength: 25 * 1024 * 1024, // سقف ۲۵MB
        headers: buildImageDownloadHeaders(imageUrl),
        validateStatus: (s) => s >= 200 && s < 400,
      });
    } catch (downloadErr: unknown) {
      const ax = downloadErr as { response?: { status?: number }; message?: string };
      const status = ax.response?.status;
      return {
        ok: false,
        code: 'download_failed',
        error: status
          ? `دانلود تصویر ناموفق (HTTP ${status})`
          : `دانلود تصویر ناموفق: ${ax.message || 'خطای شبکه'}`,
      };
    }

    const imageBuffer = toNodeBuffer(response.data as Uint8Array);
    if (!imageBuffer.length) {
      return { ok: false, code: 'download_failed', error: 'فایل تصویر خالی است' };
    }

    const publicUrl = await uploadBufferToStorage(
      imageBuffer,
      'application/octet-stream',
      folder,
      profile ?? profileForFolder(folder)
    );

    if (isDev) console.log('Image uploaded:', publicUrl.url);
    return { ok: true, url: publicUrl.url };
  } catch (error: unknown) {
    console.error('Error uploading image:', error);
    return {
      ok: false,
      code: 'upload_failed',
      error: formatStorageUploadError(error),
    };
  }
}

export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = 'images',
  profile?: ImageProfile
): Promise<string | null> {
  const result = await uploadImageFromUrlDetailed(imageUrl, folder, profile);
  return result.ok ? result.url : null;
}

export type UploadImageBufferDetailedResult =
  | {
      ok: true;
      url: string;
      optimization: Awaited<ReturnType<typeof optimizeImageDetailed>>;
    }
  | {
      ok: false;
      code: 'storage_not_configured' | 'upload_failed';
      error: string;
    };

export async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string = 'image/jpeg',
  folder: string = 'images',
  profile?: ImageProfile
): Promise<string | null> {
  const result = await uploadImageBufferDetailed(buffer, contentType, folder, profile);
  return result.ok ? result.url : null;
}

export async function uploadImageBufferDetailed(
  buffer: Buffer,
  contentType: string = 'image/jpeg',
  folder: string = 'images',
  profile?: ImageProfile
): Promise<UploadImageBufferDetailedResult> {
  try {
    const uploaded = await uploadBufferToStorage(
      buffer,
      contentType,
      folder,
      profile ?? profileForFolder(folder)
    );
    return { ok: true, url: uploaded.url, optimization: uploaded.optimization };
  } catch (error: unknown) {
    const message = formatStorageUploadError(error);
    console.error('[storage] uploadImageBufferDetailed failed:', message, error);
    const notConfigured =
      message.includes('پیکربندی نشده') || message.includes('کامل نیست');
    return {
      ok: false,
      code: notConfigured ? 'storage_not_configured' : 'upload_failed',
      error: message,
    };
  }
}

export type ImageFolder = 'items' | 'avatars' | 'covers' | 'lists' | 'hubs' | 'site';

function parseStorageUrlParts(publicUrl: string): { bucket: string; key: string } | null {
  try {
    const u = new URL(publicUrl);
    const pathname = decodeURIComponent(u.pathname);
    const pathParts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (pathParts.length < 2) return null;
    return { bucket: pathParts[0], key: pathParts.slice(1).join('/') };
  } catch {
    return null;
  }
}

const LARGEST_STORED_FILES = 500;
const STORAGE_LIST_PAGE_MS = 8000;
const STORAGE_LIST_BUDGET_MS = 18000;

let storageSizeCache: { at: number; sizes: Map<string, number>; complete: boolean } | null = null;

function isAbortedStorageList(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String(error.name) : '';
  const message = 'message' in error ? String(error.message) : '';
  return name === 'AbortError' || name === 'TimeoutError' || message === 'Request aborted';
}

function rememberLargest(found: { key: string; bytes: number }[], key: string, bytes: number, keep: number) {
  if (found.length === keep && bytes <= found[0].bytes) return;
  let lo = 0;
  let hi = found.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (found[mid].bytes < bytes) lo = mid + 1;
    else hi = mid;
  }
  found.splice(lo, 0, { key, bytes });
  if (found.length > keep) found.shift();
}

/** بزرگ‌ترین فایل‌های فضای تصاویر. اگر خواندن طول بکشد، ناتمام برمی‌گردد. */
export async function listStorageObjectSizes(): Promise<{ sizes: Map<string, number>; complete: boolean }> {
  const now = Date.now();
  if (storageSizeCache) {
    const freshFor = storageSizeCache.complete ? 60_000 : 20_000;
    if (now - storageSizeCache.at < freshFor) {
      return { sizes: storageSizeCache.sizes, complete: storageSizeCache.complete };
    }
  }

  const found: { key: string; bytes: number }[] = [];
  const config = await getObjectStorageConfig();
  const client = await getS3Client();
  if (!config || !client) return { sizes: new Map(), complete: false };

  let token: string | undefined;
  let complete = true;
  const started = Date.now();
  try {
    do {
      if (Date.now() - started > STORAGE_LIST_BUDGET_MS) {
        complete = false;
        break;
      }
      const previous = token;
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucketName,
          Prefix: `${STORAGE_OBJECT_PREFIX}/`,
          ContinuationToken: token,
        }),
        { abortSignal: AbortSignal.timeout(STORAGE_LIST_PAGE_MS) }
      );
      for (const object of res.Contents ?? []) {
        if (object.Key && object.Size != null) rememberLargest(found, object.Key, object.Size, LARGEST_STORED_FILES);
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
      if (token && token === previous) {
        complete = false;
        break;
      }
    } while (token);
  } catch (error) {
    complete = false;
    if (!isAbortedStorageList(error)) {
      console.error('[storage] listing object sizes failed:', (error as Error).message);
    }
  }

  const sizes = new Map(found.map((item) => [item.key, item.bytes]));
  storageSizeCache = { at: now, sizes, complete };
  return { sizes, complete };
}

export function storageObjectBytes(publicUrl: string, sizes: Map<string, number>): number | null {
  if (!isOurStorageUrl(publicUrl)) return null;
  const parts = parseStorageUrlParts(publicUrl);
  if (!parts) return null;
  const direct = sizes.get(parts.key);
  if (direct != null) return direct;
  const bucketPrefix = `${parts.bucket}/`;
  if (parts.key.startsWith(bucketPrefix)) {
    const stripped = sizes.get(parts.key.slice(bucketPrefix.length));
    if (stripped != null) return stripped;
  }
  return sizes.get(`${parts.bucket}/${parts.key}`) ?? null;
}

/** اندازه و نوع فایل از استوریج — بدون دانلود کامل */
export async function headObjectByPublicUrl(
  publicUrl: string
): Promise<{ bytes: number; contentType?: string } | null> {
  if (!isOurStorageUrl(publicUrl)) return null;

  const parts = parseStorageUrlParts(publicUrl);
  if (!parts) return null;

  try {
    const client = await getS3Client();
    if (!client) return null;
    const res = await client.send(
      new HeadObjectCommand({ Bucket: parts.bucket, Key: parts.key })
    );
    if (res.ContentLength == null) return null;
    return { bytes: res.ContentLength, contentType: res.ContentType ?? undefined };
  } catch (e) {
    console.error('headObjectByPublicUrl error:', (e as Error).message);
    return null;
  }
}

export async function getObjectByPublicUrl(
  publicUrl: string
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  if (!isOurStorageUrl(publicUrl)) return null;

  const tryS3 = async (): Promise<{ buffer: Buffer; contentType?: string } | null> => {
    const config = await getObjectStorageConfig();
    const client = await getS3Client();
    if (!config || !client) return null;

    const parts = parseStorageUrlParts(publicUrl);
    if (!parts) return null;

    const cmd = new GetObjectCommand({ Bucket: parts.bucket, Key: parts.key });
    const res = await client.send(cmd);
    const body = res.Body;
    if (!body) return null;

    const bytes = await body.transformToByteArray();
    return { buffer: toNodeBuffer(bytes), contentType: res.ContentType ?? undefined };
  };

  const tryDirectFetch = async (): Promise<{ buffer: Buffer; contentType?: string } | null> => {
    try {
      const res = await axios.get(publicUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          Accept: 'image/*,*/*;q=0.8',
          'User-Agent': 'WibeImageProxy/1.0',
        },
        validateStatus: (s) => s === 200,
        // امنیت SSRF: اعتبارسنجی IP مقصد در هر اتصال/ریدایرکت + سقف حجم.
        httpAgent: ssrfSafeHttpAgent,
        httpsAgent: ssrfSafeHttpsAgent,
        maxRedirects: 2,
        maxContentLength: 25 * 1024 * 1024,
      });
      if (!res.data) return null;
      const contentType = res.headers['content-type'];
      return {
        buffer: toNodeBuffer(res.data as Uint8Array),
        contentType: typeof contentType === 'string' ? contentType : undefined,
      };
    } catch {
      return null;
    }
  };

  try {
    const s3Result = await tryS3();
    if (s3Result) return s3Result;
    return await tryDirectFetch();
  } catch (e) {
    console.error('getObjectByPublicUrl error:', (e as Error).message);
    return await tryDirectFetch();
  }
}

function buildStorageKeyCandidates(bucketName: string, objectKey: string): string[] {
  const key = objectKey.replace(/^\/+/, '');
  const bucket = bucketName.replace(/^\/+|\/+$/g, '');
  return [...new Set([key, `${bucket}/${key}`])];
}

/** خواندن فایل از ParsPack با کلید S3 — برای URLهای قدیمی Liara */
export async function getObjectByStorageKey(
  objectKey: string,
  options?: { legacyUrl?: string }
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  const key = objectKey.replace(/^\/+/, '');
  if (!key.startsWith('wibe/')) return null;

  try {
    const config = await getObjectStorageConfig();
    const client = await getS3Client();
    if (config && client) {
      for (const candidate of buildStorageKeyCandidates(config.bucketName, key)) {
        try {
          const cmd = new GetObjectCommand({ Bucket: config.bucketName, Key: candidate });
          const res = await client.send(cmd);
          const body = res.Body;
          if (!body) continue;

          const bytes = await body.transformToByteArray();
          return { buffer: toNodeBuffer(bytes), contentType: res.ContentType ?? undefined };
        } catch {
          /* کلید بعدی */
        }
      }

      const fromPublic = await getObjectByPublicUrl(buildStoragePublicUrl(config, key));
      if (fromPublic) return fromPublic;
    }
  } catch (e) {
    console.error('getObjectByStorageKey error:', (e as Error).message);
  }

  // فایل هنوز migrate نشده — تلاش از Liara قدیمی (سرور، نه مرورگر)
  const legacyCandidates = [
    options?.legacyUrl?.trim(),
    `https://storage.c2.liara.space/${key}`,
    `https://storage.iran.liara.space/${key}`,
  ].filter((u): u is string => !!u);

  for (const legacyUrl of [...new Set(legacyCandidates)]) {
    try {
      const res = await axios.get(legacyUrl, {
        responseType: 'arraybuffer',
        timeout: 12000,
        headers: { Accept: 'image/*' },
        validateStatus: (s) => s === 200,
        httpAgent: ssrfSafeHttpAgent,
        httpsAgent: ssrfSafeHttpsAgent,
        maxRedirects: 2,
        maxContentLength: 25 * 1024 * 1024,
      });
      if (!res.data) continue;
      const contentType = res.headers['content-type'];
      void ensureImageInLiara(legacyUrl, folderFromStorageKey(key)).catch(() => {});
      return {
        buffer: toNodeBuffer(res.data as Uint8Array),
        contentType: typeof contentType === 'string' ? contentType : undefined,
      };
    } catch {
      /* candidate بعدی */
    }
  }

  return null;
}

function folderFromStorageKey(key: string): ImageFolder {
  const segment = key.split('/')[1];
  if (segment === 'avatars') return 'avatars';
  if (segment === 'covers') return 'covers';
  if (segment === 'items') return 'items';
  if (segment === 'hubs') return 'hubs';
  if (segment === 'site') return 'site';
  return 'covers';
}

/** اگر URL خارج از ParsPack باشد، آپلود می‌کند */
export async function ensureImageInLiara(
  url: string | null | undefined,
  folder: ImageFolder,
  options?: { profile?: ImageProfile; forceOptimize?: boolean }
): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  const normalized = normalizeImageUrlForStorage(url);
  if (!normalized || !isValidHttpImageUrl(normalized)) {
    return null;
  }

  const profile = options?.profile ?? profileForStorageFolder(folder);

  if (isOurStorageUrl(normalized) && !options?.forceOptimize) {
    return normalized;
  }

  if (isOurStorageUrl(normalized) && options?.forceOptimize) {
    const existing = await getObjectByPublicUrl(normalized);
    if (existing?.buffer?.length) {
      try {
        const reuploaded = await uploadBufferToStorage(
          existing.buffer,
          existing.contentType || 'image/png',
          folder,
          profile
        );
        return reuploaded.url;
      } catch (error) {
        console.error('[storage] forceOptimize reupload failed:', formatStorageUploadError(error));
        return normalized;
      }
    }
    return normalized;
  }

  const uploaded = await uploadImageFromUrl(normalized, folder, profile);
  if (uploaded) return uploaded;

  // TMDB و URLهای مسدود را ذخیره نکن
  if (isTmdbImageUrl(normalized)) return null;
  return normalized;
}

/** alias */
export const ensureImageInStorage = ensureImageInLiara;

export async function testObjectStorageConnection(): Promise<boolean> {
  try {
    const client = await getS3Client();
    return !!client;
  } catch (error) {
    console.error('ParsPack connection test failed:', error);
    return false;
  }
}

export async function testLiaraConnection(): Promise<boolean> {
  return testObjectStorageConnection();
}
