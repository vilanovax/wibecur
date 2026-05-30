import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectPromise?: Promise<void>;
};

/** پارامترهای pool برای دیتابیس راه‌دور — جلوگیری از timeout */
function getDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '20');
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '45');
    const limit = process.env.NODE_ENV === 'development' ? '3' : '8';
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', limit);
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** اطمینان از اتصال engine — برای dev/HMR و cold start */
export async function ensurePrismaConnection(): Promise<void> {
  if (!globalForPrisma.prismaConnectPromise) {
    globalForPrisma.prismaConnectPromise = prisma.$connect().catch((err) => {
      globalForPrisma.prismaConnectPromise = undefined;
      throw err;
    });
  }
  await globalForPrisma.prismaConnectPromise;
}

/** قطع و وصل مجدد — وقتی engine disconnect شده (مثلاً بعد از HMR) */
export async function resetPrismaConnection(): Promise<void> {
  globalForPrisma.prismaConnectPromise = undefined;
  try {
    await prisma.$disconnect();
  } catch {
    // engine already dead
  }
  globalForPrisma.prismaConnectPromise = prisma.$connect().catch((err) => {
    globalForPrisma.prismaConnectPromise = undefined;
    throw err;
  });
  await globalForPrisma.prismaConnectPromise;
}
