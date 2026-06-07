/**
 * Object Storage — ParsPack (S3-compatible) — از پنل ادمین / دیتابیس
 */

export interface ObjectStorageConfig {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/** پیشوند مسیر فایل‌ها در باکت — مطابق نمونه: …/c466145/wibe/… */
export const STORAGE_OBJECT_PREFIX = 'wibe';

export function normalizeStorageEndpoint(endpoint: string): string {
  let value = endpoint.trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value.replace(/\/$/, '');
}

/**
 * دریافت پیکربندی Object Storage از دیتابیس
 */
export async function getObjectStorageConfig(): Promise<ObjectStorageConfig | null> {
  const { getObjectStorageSettings } = await import('./settings');
  return getObjectStorageSettings();
}

/**
 * URL عمومی ParsPack — hostname شامل parspack.net
 * مثال: https://c466145.parspack.net/c466145/wibe/photo.jpg
 */
export function isParsPackStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t.startsWith('http')) return false;
  try {
    const host = new URL(t).hostname.toLowerCase();
    return host.includes('parspack.net');
  } catch {
    return false;
  }
}

/** @deprecated Liara — فقط برای تشخیص URLهای قدیمی (خارج از استوریج فعلی) */
export function isLegacyLiaraStorageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('storage.') && host.includes('liara');
  } catch {
    return false;
  }
}

/**
 * URL تصویر روی Object Storage فعلی اپ (ParsPack)
 */
export function isOurStorageUrl(url: string): boolean {
  return isParsPackStorageUrl(url);
}

/** URL کاور دسته که قبلاً در ParsPack / wibe/hubs آپلود شده */
export function isParsPackHubsUrl(url: string): boolean {
  if (!isParsPackStorageUrl(url)) return false;
  try {
    const pathname = decodeURIComponent(new URL(url.trim()).pathname);
    return pathname.includes(`/${STORAGE_OBJECT_PREFIX}/hubs/`);
  } catch {
    return false;
  }
}

export function buildStorageObjectKey(folder: string, filename: string): string {
  const safeFolder = folder.replace(/^\/+|\/+$/g, '');
  return `${STORAGE_OBJECT_PREFIX}/${safeFolder}/${filename}`;
}

export function buildStoragePublicUrl(
  config: ObjectStorageConfig,
  objectKey: string
): string {
  const endpoint = normalizeStorageEndpoint(config.endpoint);
  const key = objectKey.replace(/^\/+/, '');
  return `${endpoint}/${config.bucketName}/${key}`;
}
