import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
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
