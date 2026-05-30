/** تشخیص خطاهای اتصال/ pool دیتابیس برای fallback امن */
export function isDbUnavailableError(error: unknown): boolean {
  const err = error as Error & { code?: string };
  const msg = String(err?.message ?? '').toLowerCase();
  return (
    err?.code === 'P1001' ||
    err?.code === 'P1008' ||
    err?.code === 'P1017' ||
    err?.code === 'P2024' ||
    err?.code === 'P2034' ||
    err?.code === 'P2010' ||
    msg.includes("can't reach database") ||
    msg.includes('connection pool') ||
    msg.includes('timed out fetching') ||
    msg.includes('operation timed out') ||
    msg.includes('connection refused') ||
    msg.includes('server has closed the connection') ||
    msg.includes('engine is not yet connected') ||
    msg.includes('response from the engine was empty') ||
    msg.includes('client has already been released') ||
    msg.includes('too many connections') ||
    msg.includes('too many clients') ||
    msg.includes('socket hang up') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('prismaclient') ||
    msg.includes('database unavailable')
  );
}

/** خطاهایی که retry کوتاه‌مدت ممکن است موفق شود */
export function isRetryableDbError(error: unknown): boolean {
  if (isDbUnavailableError(error)) return true;
  const err = error as Error & { code?: string };
  return err?.code === 'P2034' || err?.code === 'P2028';
}

export function shouldGracefulDbFallback(error: unknown): boolean {
  return isDbUnavailableError(error) || process.env.NODE_ENV === 'development';
}
