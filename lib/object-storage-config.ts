/**
 * Object Storage Configuration
 * لوکال: MinIO (Docker)
 * پروداکشن: Liara Object Storage / S3
 */

export type ObjectStorageProvider = 'minio' | 'liara';

export interface ObjectStorageConfig {
  provider: ObjectStorageProvider;
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Public URL base برای ساخت URL نهایی (ممکن است با endpoint متفاوت باشد، مثلاً در داکر) */
  publicUrlBase?: string;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * دریافت تنظیمات MinIO از متغیرهای محیطی (لوکال)
 */
function getMinioConfig(): ObjectStorageConfig | null {
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const bucketName = process.env.MINIO_BUCKET || 'wibecur';
  const accessKeyId = process.env.MINIO_ACCESS_KEY || 'wibecur';
  const secretAccessKey = process.env.MINIO_SECRET_KEY || 'wibecur_minio_secret';

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    provider: 'minio',
    endpoint,
    bucketName,
    accessKeyId,
    secretAccessKey,
    // برای مرورگر: از localhost استفاده کن (نه minio از داخل داکر)
    publicUrlBase: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
  };
}

/**
 * دریافت پیکربندی object storage فعال
 * لوکال: MinIO (از env یا مقادیر پیش‌فرض docker-compose)
 * پروداکشن: Liara Object Storage از دیتابیس
 */
export async function getObjectStorageConfig(): Promise<ObjectStorageConfig | null> {
  const provider = process.env.OBJECT_STORAGE_PROVIDER?.toLowerCase();

  // صریحاً minio خواسته شده
  if (provider === 'minio') {
    return getMinioConfig();
  }

  // صریحاً liara یا پروداکشن → Liara از DB
  if (provider === 'liara' || !isDev) {
    const { getLiaraConfig } = await import('./settings');
    const liara = await getLiaraConfig();
    if (liara) {
      return {
        provider: 'liara',
        endpoint: liara.endpoint,
        bucketName: liara.bucketName,
        accessKeyId: liara.accessKeyId,
        secretAccessKey: liara.secretAccessKey,
      };
    }
    if (!isDev) return null;
  }

  // لوکال بدون Liara: MinIO با مقادیر پیش‌فرض docker-compose
  if (isDev) {
    return getMinioConfig();
  }

  return null;
}

/**
 * بررسی اینکه آیا URL از object storage خودمان است (MinIO یا Liara)
 */
export function isOurStorageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // Liara
    if (host.includes('storage.') && host.includes('liara')) return true;
    // MinIO لوکال
    if (host === 'localhost' && u.port === '9000') return true;
    if (host === '127.0.0.1' && u.port === '9000') return true;
    return false;
  } catch {
    return false;
  }
}
