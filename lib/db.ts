import { prisma } from './prisma';

// Wrapper function with retry logic
export async function dbQuery<T>(
  queryFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      
      if (error?.code === 'P1001' || error?.message?.includes("Can't reach database")) {
        if (isLastAttempt) {
          throw new Error(
            'خطا در اتصال به دیتابیس. لطفاً اتصال اینترنت و تنظیمات دیتابیس را بررسی کنید.'
          );
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw new Error('خطا در اتصال به دیتابیس');
}

// Helper functions for common queries
export async function getCounts() {
  return dbQuery(() =>
    prisma.$transaction([
      prisma.users.count(),
      prisma.lists.count(),
      prisma.items.count(),
      prisma.categories.count(),
    ])
  );
}

