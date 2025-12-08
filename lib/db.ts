import { prisma } from './prisma';
import { cache } from 'react';

// Wrapper function with retry logic (optimized)
export async function dbQuery<T>(
  queryFn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  // Ensure Prisma client is connected before executing queries
  try {
    await prisma.$connect();
  } catch (error) {
    // Connection might already be established, continue
    console.warn('Prisma connection check:', error);
  }

  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      
      // Check for connection pool timeout errors and "not connected" errors
      const isConnectionPoolError = 
        error?.code === 'P1001' || // Can't reach database
        error?.code === 'P1008' || // Operations timed out
        error?.message?.includes("Can't reach database") ||
        error?.message?.includes("connection pool") ||
        error?.message?.includes("Timed out fetching") ||
        error?.message?.includes("Engine is not yet connected") ||
        error?.message?.includes("not yet connected") ||
        error?.kind === 'Closed';
      
      // Only retry connection errors
      if (isConnectionPoolError) {
        // Try to reconnect
        try {
          await prisma.$disconnect().catch(() => {}); // Ignore disconnect errors
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
          await prisma.$connect();
        } catch (connectError) {
          if (isLastAttempt) {
            throw new Error(
              'خطا در اتصال به دیتابیس. ممکن است connection pool اشباع شده باشد. لطفاً لحظه‌ای صبر کنید و دوباره تلاش کنید.'
            );
          }
          continue;
        }
        
        if (isLastAttempt) {
          // Final attempt after reconnection
          try {
            return await queryFn();
          } catch {
            throw new Error(
              'خطا در اتصال به دیتابیس. ممکن است connection pool اشباع شده باشد. لطفاً لحظه‌ای صبر کنید و دوباره تلاش کنید.'
            );
          }
        }
        
        // Continue to retry
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

