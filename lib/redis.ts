/**
 * کلاینت Redis اختیاری — اگر REDIS_URL نباشد null برمی‌گردد
 * و OTP / rate-limit روی حافظهٔ پروسه می‌مانند.
 */

import { createClient, type RedisClientType } from 'redis';

type RedisHandle = RedisClientType;

const globalForRedis = globalThis as unknown as {
  __wibeRedis?: RedisHandle | null;
  __wibeRedisPromise?: Promise<RedisHandle | null>;
};

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

export async function getRedis(): Promise<RedisHandle | null> {
  if (globalForRedis.__wibeRedis !== undefined) {
    return globalForRedis.__wibeRedis;
  }
  if (globalForRedis.__wibeRedisPromise) {
    return globalForRedis.__wibeRedisPromise;
  }

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    globalForRedis.__wibeRedis = null;
    return null;
  }

  globalForRedis.__wibeRedisPromise = (async () => {
    try {
      const client = createClient({ url });
      client.on('error', (err) => {
        console.error('[redis]', err instanceof Error ? err.message : err);
      });
      await client.connect();
      globalForRedis.__wibeRedis = client as RedisHandle;
      return globalForRedis.__wibeRedis;
    } catch (error) {
      console.error('[redis] connect failed — falling back to memory', error);
      globalForRedis.__wibeRedis = null;
      return null;
    } finally {
      globalForRedis.__wibeRedisPromise = undefined;
    }
  })();

  return globalForRedis.__wibeRedisPromise;
}

/** فقط تست */
export function resetRedisForTests(): void {
  globalForRedis.__wibeRedis = undefined;
  globalForRedis.__wibeRedisPromise = undefined;
}
