/**
 * Object Storage — Liara (پروداکشن) یا MinIO (لوکال)
 * تنظیمات از دیتابیس خوانده می‌شود (پنل ادمین / set-liara-config)
 */

export interface ObjectStorageConfig {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * دریافت پیکربندی Liara Object Storage از دیتابیس
 */
export async function getObjectStorageConfig(): Promise<ObjectStorageConfig | null> {
  const { getLiaraConfig } = await import('./settings');
  return getLiaraConfig();
}

/**
 * بررسی اینکه آیا URL از Object Storage خودمان است (Liara یا MinIO لوکال)
 */
export function isOurStorageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // Liara remote
    if (host.includes('storage.') && host.includes('liara')) return true;
    // MinIO local (localhost:9000 or 127.0.0.1:9000)
    if ((host === 'localhost' || host === '127.0.0.1') && u.port === '9000') return true;
    return false;
  } catch {
    return false;
  }
}
