/**
 * Object Storage — فقط Liara (از پنل ادمین / دیتابیس)
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
 * بررسی اینکه آیا URL از Liara Object Storage خودمان است
 */
export function isOurStorageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes('storage.') && host.includes('liara');
  } catch {
    return false;
  }
}
