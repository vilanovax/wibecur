import { prisma } from './prisma';
import { cache } from 'react';

// Wrapper function with retry logic (optimized)
export async function dbQuery<T>(
  queryFn: () => Promise<T>,
  retries = 2,
  delay = 500
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      
      // Only retry connection errors
      if (error?.code === 'P1001' || 
          error?.code === 'P1008' ||
          error?.message?.includes("Can't reach database") ||
          error?.kind === 'Closed') {
        if (isLastAttempt) {
          // Try to reconnect once more
          try {
            await prisma.$connect();
            return await queryFn();
          } catch {
            throw new Error(
              'خطا در اتصال به دیتابیس. لطفاً اتصال اینترنت و تنظیمات دیتابیس را بررسی کنید.'
            );
          }
        }
        // Wait before retrying (reduced delay)
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw new Error('خطا در اتصال به دیتابیس');
}

// Cached wrapper for queries that can be cached
export function cachedQuery<T>(queryFn: () => Promise<T>, options?: { revalidate?: number }) {
  return cache(async () => {
    return dbQuery(queryFn);
  });
}

// Helper functions for common queries with caching
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

// Cached categories query (rarely changes)
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

