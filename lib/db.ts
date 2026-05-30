import { prisma, ensurePrismaConnection, resetPrismaConnection } from './prisma';
import { cache } from 'react';
import { isDbUnavailableError, isRetryableDbError } from './db-errors';

function isEngineDisconnected(error: unknown): boolean {
  const msg = String((error as Error)?.message ?? '').toLowerCase();
  return (
    msg.includes('engine is not yet connected') ||
    msg.includes('response from the engine was empty') ||
    msg.includes('client has already been released')
  );
}

function backoffMs(attempt: number, baseDelay: number): number {
  const exp = baseDelay * (attempt + 1);
  const jitter = Math.floor(Math.random() * 200);
  return exp + jitter;
}

/** Wrapper with retry + reconnect for Prisma engine / pool issues */
export async function dbQuery<T>(
  queryFn: () => Promise<T>,
  retries = 4,
  delay = 500
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      await ensurePrismaConnection();
      return await queryFn();
    } catch (error: unknown) {
      lastError = error;
      const isLastAttempt = i === retries - 1;

      if (isEngineDisconnected(error) && !isLastAttempt) {
        console.warn('Prisma engine reconnect attempt', i + 1);
        await resetPrismaConnection();
        await new Promise((resolve) => setTimeout(resolve, backoffMs(i, delay)));
        continue;
      }

      if (isRetryableDbError(error) && !isLastAttempt) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs(i, delay)));
        continue;
      }

      if (!isDbUnavailableError(error) || isLastAttempt) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, backoffMs(i, delay)));
    }
  }

  throw lastError ?? new Error('خطا در اتصال به دیتابیس');
}

export function cachedQuery<T>(queryFn: () => Promise<T>, options?: { revalidate?: number }) {
  return cache(async () => {
    return dbQuery(queryFn);
  });
}

export const getCounts = cache(async () => {
  return dbQuery(() =>
    prisma.$transaction([
      prisma.users.count(),
      prisma.lists.count(),
      prisma.items.count(),
      prisma.categories.count(),
    ])
  );
});

export const getCategories = cache(async () => {
  return dbQuery(() =>
    prisma.categories.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        order: true,
        isActive: true,
      },
      where: {
        isActive: true,
      },
    })
  );
});
