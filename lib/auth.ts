import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { authOptions } from '@/lib/auth-config';

// Cache session check to avoid redundant calls
const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

export async function getCurrentUser() {
  const session = await getCachedSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getCachedSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin() {
  const session = await getCachedSession();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/login');
  }
  return session;
}

/**
 * Check admin authentication for API routes (doesn't throw redirect)
 * Returns null if not authenticated
 */
export async function checkAdminAuth() {
  const session = await getCachedSession();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}
