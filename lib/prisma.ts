import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectPromise?: Promise<void>;
};

/**
 * حدِ پیش‌فرض connection pool.
 * صفحهٔ دسته چند کوئری موازی (fan-out) می‌زند؛ با ۸ کانکشن این‌ها پشتِ هم صف می‌شوند.
 * پیش‌فرض prod را به ۱۶ رساندیم و با env قابل تنظیم است تا با max_connections دیتابیس
 * (و تعداد نمونه‌های اپ) هماهنگ شود. اگر PgBouncer/pooler دارید، آن را جلو بگذارید و
 * connection_limit را متناسب کم کنید.
 */
function resolveConnectionLimit(): string {
  const fromEnv = process.env.DB_CONNECTION_LIMIT?.trim();
  if (fromEnv && /^\d+$/.test(fromEnv) && Number(fromEnv) > 0) return fromEnv;
  return process.env.NODE_ENV === 'development' ? '5' : '16';
}

/** پارامترهای pool برای دیتابیس راه‌دور — جلوگیری از timeout */
function getDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '20');
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '45');
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', resolveConnectionLimit());
    }
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

function getOrCreatePrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    return globalForPrisma.prisma;
  }

  // بعد از `prisma generate` / db push، کلاینت کش‌شده در dev ممکن است مدل جدید نداشته باشد
  const stale =
    process.env.NODE_ENV !== 'production' &&
    (!('backup_jobs' in globalForPrisma.prisma) ||
      !('catalog_items' in globalForPrisma.prisma));
  if (stale) {
    const old = globalForPrisma.prisma;
    void old.$disconnect().catch(() => {});
    globalForPrisma.prismaConnectPromise = undefined;
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getOrCreatePrisma();

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
