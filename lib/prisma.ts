import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** پارامترهای pool برای دیتابیس راه‌دور — جلوگیری از timeout */
function getDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '20');
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '30');
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '5');
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

