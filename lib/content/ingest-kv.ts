/**
 * ذخیرهٔ کوتاه‌مدت برای preview و idempotency ingest.
 * با REDIS_URL بین پروسه‌ها مشترک است؛ بدون آن حافظهٔ همین پروسه.
 */

import { getRedis } from '@/lib/redis';

const memory = new Map<string, { value: string; expiresAt: number }>();
const MEMORY_CAP = 2_000;

function pruneMemory(now: number) {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
  while (memory.size > MEMORY_CAP) {
    const oldest = memory.keys().next().value;
    if (oldest === undefined) break;
    memory.delete(oldest);
  }
}

export async function ingestKvSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const payload = JSON.stringify(value);
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, payload, { EX: Math.max(1, ttlSeconds) });
    return;
  }
  const now = Date.now();
  pruneMemory(now);
  memory.set(key, { value: payload, expiresAt: now + ttlSeconds * 1000 });
}

export async function ingestKvGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (redis) {
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    memory.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
}

export async function ingestKvDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  memory.delete(key);
}

/** فقط تست */
export function resetIngestKvMemoryForTests(): void {
  memory.clear();
}
