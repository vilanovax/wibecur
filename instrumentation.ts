import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // امنیت: در production نبودِ Upstash یعنی rate limiting بی‌صدا خاموش است
    // (fail-open). با fail-fast در زمان بوت، deploy ناقص آشکار می‌شود.
    if (
      process.env.NODE_ENV === 'production' &&
      (!process.env.UPSTASH_REDIS_REST_URL ||
        !process.env.UPSTASH_REDIS_REST_TOKEN)
    ) {
      throw new Error(
        'Rate limiting غیرفعال است: UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN باید در production تنظیم شوند.'
      );
    }

    const { ensurePrismaConnection } = await import('./lib/prisma');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await ensurePrismaConnection();
        break;
      } catch (err) {
        console.warn(`Prisma warm-up attempt ${attempt}/3 failed:`, err);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
