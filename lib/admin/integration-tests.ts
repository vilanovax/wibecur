import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { ObjectStorageConfig } from '@/lib/object-storage-config';

export async function testGoogleCustomSearch(
  apiKey: string,
  searchEngineId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!apiKey.trim() || !searchEngineId.trim()) {
    return { ok: false, error: 'کلید API و Search Engine ID هر دو لازم است' };
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey.trim());
    url.searchParams.set('cx', searchEngineId.trim());
    url.searchParams.set('q', 'test');
    url.searchParams.set('num', '1');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    const data = (await res.json()) as { error?: { message?: string } };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message || `خطای Google (${res.status})`,
      };
    }

    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'خطا در اتصال به Google',
    };
  }
}

export async function testLiaraStorage(
  config: ObjectStorageConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { endpoint, bucketName, accessKeyId, secretAccessKey } = config;
  if (!endpoint?.trim() || !bucketName?.trim() || !accessKeyId?.trim() || !secretAccessKey?.trim()) {
    return { ok: false, error: 'همه فیلدهای Liara (Bucket، Endpoint، Access، Secret) لازم است' };
  }

  try {
    const client = new S3Client({
      region: 'default',
      endpoint: endpoint.trim(),
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
      forcePathStyle: true,
    });

    await client.send(
      new HeadBucketCommand({ Bucket: bucketName.trim() }),
      { requestTimeout: 15000 }
    );

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطا در اتصال به Liara';
    if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
      return { ok: false, error: 'دسترسی رد شد — کلیدها یا نام Bucket را بررسی کنید' };
    }
    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      return { ok: false, error: 'Bucket یا Endpoint یافت نشد' };
    }
    return { ok: false, error: msg };
  }
}

export async function testOpenAiKey(
  apiKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = apiKey.trim();
  if (!key) return { ok: false, error: 'کلید OpenAI را وارد کنید' };
  if (!key.startsWith('sk-')) {
    return { ok: false, error: 'فرمت کلید نامعتبر است (باید با sk- شروع شود)' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401) {
      return { ok: false, error: 'کلید OpenAI نامعتبر است' };
    }
    if (!res.ok) {
      return { ok: false, error: `خطای OpenAI (${res.status})` };
    }
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'خطا در اتصال به OpenAI',
    };
  }
}
