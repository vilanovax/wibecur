import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Optimize connection pool settings
if (globalForPrisma.prisma) {
  // Reuse existing connection
} else {
  // Test connection on startup
  if (process.env.NODE_ENV === 'development') {
    prisma.$connect()
      .then(() => {
        console.log('✅ Database connected successfully');
      })
      .catch((error) => {
        console.error('❌ Failed to connect to database:', error.message);
      });
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

