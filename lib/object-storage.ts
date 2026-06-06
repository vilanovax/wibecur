import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import axios from 'axios';
import {
  buildStorageObjectKey,
  buildStoragePublicUrl,
  getObjectStorageConfig,
  isOurStorageUrl,
} from './object-storage-config';
import crypto from 'crypto';
import { optimizeImage } from './image-optimizer';
import { profileForStorageFolder } from './upload-profiles';
import type { ImageProfile } from './image-config';
import {
  isValidHttpImageUrl,
  normalizeImageUrlForStorage,
} from './image-url-sanitize';
import { isTmdbImageUrl } from './image-url-policy';

const isDev = process.env.NODE_ENV === 'development';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatStorageUploadError(error: unknown): string {
  const msg = String((error as Error)?.message ?? error ?? '');
  if (msg.includes('ECONNREFUSED')) {
    return 'اتصال به ParsPack برقرار نشد — لطفاً چند لحظه بعد دوباره تلاش کنید.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
    return 'زمان اتصال به ParsPack تمام شد — دوباره تلاش کنید.';
  }
  if (msg.includes('NetworkingError') || msg.includes('ENOTFOUND')) {
    return 'خطای شبکه در اتصال به ParsPack.';
  }
  return msg || 'خطا در آپلود به ParsPack';
}

async function withStorageRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = String((error as Error)?.message ?? '');
      const retryable =
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('timeout') ||
        msg.includes('socket hang up');
      if (!retryable || i === attempts - 1) break;
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

async function uploadBufferToStorage(
  buffer: Buffer,
  contentType: string,
  folder: string,
  profile: Parameters<typeof optimizeImage>[1]['profile']
): Promise<string | null> {
  const client = await getS3Client();
  const config = await getObjectStorageConfig();
  if (!client || !config) return null;

  const optimized = await optimizeImage(buffer, { profile });
  const filename = `${crypto.randomUUID()}${optimized.ext}`;
  const key = buildStorageObjectKey(folder, filename);

  if (isDev) console.log('Uploading to ParsPack:', key);

  const uploadParams = {
    Bucket: config.bucketName,
    Key: key,
    Body: optimized.buffer,
    ContentType: optimized.contentType,
  };

  await withStorageRetry(async () => {
    try {
      const upload = new Upload({
        client,
        params: { ...uploadParams, ACL: 'public-read' },
      });
      await upload.done();
    } catch (aclErr: unknown) {
      if (isDev) console.warn('ACL upload failed, retrying without ACL:', (aclErr as Error).message);
      const upload = new Upload({ client, params: uploadParams });
      await upload.done();
    }
  });

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

export async function uploadImageFromUrlDetailed(
  imageUrl: string,
  folder: string = 'images',
  profile?: ImageProfile
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

    if (isDev) console.log('Downloading image from:', imageUrl);

    let response;
    try {
      response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
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

    const imageBuffer = Buffer.from(response.data);
    if (!imageBuffer.length) {
      return { ok: false, code: 'download_failed', error: 'فایل تصویر خالی است' };
    }

    const publicUrl = await uploadBufferToStorage(
      imageBuffer,
      'application/octet-stream',
      folder,
      profile ?? profileForFolder(folder)
    );

    if (!publicUrl) {
      return {
        ok: false,
        code: 'upload_failed',
        error: 'خطا در آپلود به ParsPack',
      };
    }

    if (isDev) console.log('Image uploaded:', publicUrl);
    return { ok: true, url: publicUrl };
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

export async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string = 'image/jpeg',
  folder: string = 'images',
  profile?: ImageProfile
): Promise<string | null> {
  try {
    return await uploadBufferToStorage(
      buffer,
      contentType,
      folder,
      profile ?? profileForFolder(folder)
    );
  } catch (error: unknown) {
    console.error('Error uploading image:', formatStorageUploadError(error));
    return null;
  }
}

export type ImageFolder = 'items' | 'avatars' | 'covers' | 'lists' | 'hubs';

export async function getObjectByPublicUrl(
  publicUrl: string
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  if (!isOurStorageUrl(publicUrl)) return null;

  const tryS3 = async (): Promise<{ buffer: Buffer; contentType?: string } | null> => {
    const config = await getObjectStorageConfig();
    const client = await getS3Client();
    if (!config || !client) return null;

    const u = new URL(publicUrl);
    const pathname = decodeURIComponent(u.pathname);
    const pathParts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (pathParts.length < 2) return null;
    const bucketFromUrl = pathParts[0];
    const key = pathParts.slice(1).join('/');
    if (!key) return null;

    const cmd = new GetObjectCommand({ Bucket: bucketFromUrl, Key: key });
    const res = await client.send(cmd);
    const body = res.Body;
    if (!body) return null;

    const bytes = await body.transformToByteArray();
    return { buffer: Buffer.from(bytes), contentType: res.ContentType ?? undefined };
  };

  const tryDirectFetch = async (): Promise<{ buffer: Buffer; contentType?: string } | null> => {
    try {
      const res = await axios.get(publicUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { Accept: 'image/*' },
        validateStatus: (s) => s === 200,
      });
      if (!res.data) return null;
      const contentType = res.headers['content-type'];
      return {
        buffer: Buffer.from(res.data),
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

/** خواندن فایل از ParsPack با کلید S3 — برای URLهای قدیمی Liara */
export async function getObjectByStorageKey(
  objectKey: string
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  const key = objectKey.replace(/^\/+/, '');
  if (!key.startsWith('wibe/')) return null;

  try {
    const config = await getObjectStorageConfig();
    const client = await getS3Client();
    if (!config || !client) return null;

    const cmd = new GetObjectCommand({ Bucket: config.bucketName, Key: key });
    const res = await client.send(cmd);
    const body = res.Body;
    if (!body) return null;

    const bytes = await body.transformToByteArray();
    return { buffer: Buffer.from(bytes), contentType: res.ContentType ?? undefined };
  } catch (e) {
    console.error('getObjectByStorageKey error:', (e as Error).message);
    return null;
  }
}

/** اگر URL خارج از ParsPack باشد، آپلود می‌کند */
export async function ensureImageInLiara(
  url: string | null | undefined,
  folder: ImageFolder,
  options?: { profile?: ImageProfile }
): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  const normalized = normalizeImageUrlForStorage(url);
  if (!normalized || !isValidHttpImageUrl(normalized)) {
    return null;
  }

  if (isOurStorageUrl(normalized)) {
    return normalized;
  }

  const uploaded = await uploadImageFromUrl(normalized, folder, options?.profile);
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
