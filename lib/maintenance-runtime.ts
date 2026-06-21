import { Redis } from '@upstash/redis';

const ENABLED_KEY = 'site:maintenance:enabled';
const ALLOW_ADMIN_KEY = 'site:maintenance:allowAdminBrowse';

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return Redis.fromEnv();
}

export async function syncMaintenanceRuntimeFlag(data: {
  enabled: boolean;
  allowAdminBrowse: boolean;
}): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.mset({
    [ENABLED_KEY]: data.enabled ? '1' : '0',
    [ALLOW_ADMIN_KEY]: data.allowAdminBrowse ? '1' : '0',
  });
}

export async function readMaintenanceRuntimeFlag(): Promise<{
  enabled: boolean;
  allowAdminBrowse: boolean;
} | null> {
  const redis = getRedis();
  if (!redis) return null;

  const [enabled, allowAdminBrowse] = await redis.mget<[string | null, string | null]>(
    ENABLED_KEY,
    ALLOW_ADMIN_KEY
  );
  if (enabled === null || allowAdminBrowse === null) return null;

  return {
    enabled: enabled === '1',
    allowAdminBrowse: allowAdminBrowse === '1',
  };
}
