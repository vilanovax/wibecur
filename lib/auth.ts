import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/lib/auth-config';
import { ADMIN_ROLES, isAdminRole } from '@/lib/auth/roles';

// Re-export for callers that used lib/auth ADMIN_ROLES
export { ADMIN_ROLES, isAdminRole };

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

function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return !!session?.user?.role && isAdminRole(session.user.role);
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
