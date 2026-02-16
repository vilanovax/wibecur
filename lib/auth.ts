import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/lib/auth-config';

// Cache session check to avoid redundant calls
const getCachedSession = cache(async () => {
  try {
    return await auth();
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
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

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'ANALYST', 'EDITOR'] as const;

function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return !!session?.user?.role && ADMIN_ROLES.includes(session.user.role as (typeof ADMIN_ROLES)[number]);
}

export async function requireAdmin() {
  const session = await getCachedSession();
  if (!session || !isAdmin(session)) {
    redirect('/login');
  }
  return session;
}

/**
 * Check admin authentication for API routes (doesn't throw redirect)
 * Returns null if not authenticated as any admin role
 */
export async function checkAdminAuth() {
  const session = await getCachedSession();
  if (!session || !isAdmin(session)) {
    return null;
  }
  return session;
}

// Re-export auth for middleware usage
export { auth };
