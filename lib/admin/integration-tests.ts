import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { ObjectStorageConfig } from '@/lib/object-storage-config';
import { resolveOpenAIModel } from '@/lib/openai-models';
import { normalizeOpenAICompletionOptions } from '@/lib/openai-chat';

/** کلید ماسک‌شدهٔ UI (مثل sk-p************abcd) را از تست حذف می‌کند */
export function resolveIntegrationSecret(
  bodyValue: unknown,
  savedValue: string | null | undefined
): string {
  if (typeof bodyValue === 'string') {
    const trimmed = bodyValue.trim();
    if (trimmed && !trimmed.includes('*')) {
      return trimmed;
    }
  }
  return savedValue?.trim() || '';
}

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

export async function testDeepSeekKey(
  apiKey: string,
  model?: string | null
): Promise<{ ok: true; model: string } | { ok: false; error: string }> {
  const key = apiKey.trim();
  if (!key) {
    return {
      ok: false,
      error:
        'کلید DeepSeek را وارد کنید. اگر قبلاً ذخیره کرده‌اید، فیلد را خالی بگذارید و دوباره تست کنید.',
    };
  }

  const { resolveDeepSeekModel } = await import('@/lib/deepseek-models');
  const modelId = resolveDeepSeekModel(model);

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };

    if (res.status === 401) {
      return { ok: false, error: 'کلید DeepSeek نامعتبر است' };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message || `خطای DeepSeek (${res.status})`,
      };
    }

    return { ok: true, model: modelId };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'خطا در اتصال به DeepSeek',
    };
  }
}

export async function testOpenAiKey(
  apiKey: string,
  model?: string | null
): Promise<{ ok: true; model: string } | { ok: false; error: string }> {
  const key = apiKey.trim();
  if (!key) {
    return {
      ok: false,
      error:
        'کلید OpenAI را وارد کنید. اگر قبلاً ذخیره کرده‌اید، فیلد را خالی بگذارید و دوباره تست کنید.',
    };
  }

  const modelId = resolveOpenAIModel(model);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        ...normalizeOpenAICompletionOptions(modelId, { max_tokens: 5 }),
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string };
    };

    if (res.status === 401) {
      return { ok: false, error: 'کلید OpenAI نامعتبر است' };
    }
    if (res.status === 403) {
      return {
        ok: false,
        error:
          data.error?.message ||
          'دسترسی به API یا مدل انتخاب‌شده مجاز نیست — مدل دیگری امتحان کنید',
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        error: `مدل «${modelId}» در دسترس نیست — از لیست مدل دیگری انتخاب کنید`,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message || `خطای OpenAI (${res.status})`,
      };
    }

    return { ok: true, model: modelId };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'خطا در اتصال به OpenAI',
    };
  }
}
