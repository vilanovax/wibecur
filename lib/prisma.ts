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
  // Optimize connection pool settings
  // Connection pool timeout in milliseconds (default: 10 seconds)
  // This helps prevent "Timed out fetching a new connection" errors
});

// Configure connection pool settings via DATABASE_URL query parameters if not already set
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
  // Note: Connection pool parameters should be set in DATABASE_URL as query parameters
  // Example: postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=20
  // For Liara PostgreSQL, check their documentation for optimal pool settings
}

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

