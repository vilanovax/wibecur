import { getObjectStorageConfig } from './object-storage-config';

export type ObjectStorageReadiness = {
  ready: boolean;
  error?: string;
  missing?: ('accessKey' | 'secretKey' | 'bucket' | 'endpoint')[];
};

/** آیا ParsPack Object Storage برای آپلود پیکربندی شده است؟ */
export async function checkObjectStorageReady(): Promise<ObjectStorageReadiness> {
  const config = await getObjectStorageConfig();

  if (config) {
    return { ready: true };
  }

  const { getDecryptedSettings } = await import('./settings');
  const settings = await getDecryptedSettings();
  const missing: ObjectStorageReadiness['missing'] = [];

  if (!settings.liaraEndpoint) missing.push('endpoint');
  if (!settings.liaraBucketName) missing.push('bucket');
  if (!settings.liaraAccessKey) missing.push('accessKey');
  if (!settings.liaraSecretKey) missing.push('secretKey');

  if (missing.length === 0) {
    return {
      ready: false,
      error: 'اتصال به ParsPack Object Storage برقرار نشد. تنظیمات را بررسی کنید.',
    };
  }

  const labels: Record<string, string> = {
    endpoint: 'Endpoint',
    bucket: 'Bucket Name',
    accessKey: 'Access Key',
    secretKey: 'Secret Key',
  };

  return {
    ready: false,
    missing,
    error: `ParsPack Object Storage کامل نیست — ${missing.map((m) => labels[m]).join(' و ')} را در پنل ادمین → تنظیمات وارد کنید.`,
  };
}

/** @deprecated */
export const checkLiaraStorageReady = checkObjectStorageReady;

export type LiaraStorageReadiness = ObjectStorageReadiness;
