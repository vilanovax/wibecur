import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/lib/auth-config';
import { ADMIN_ROLES, isAdminRole } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

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

/**
 * چون session استراتژی JWT است، نقش/فعال‌بودن داخل توکن تا ۳۰ روز فریز می‌ماند.
 * این تابع وضعیت واقعی کاربر را از DB می‌خواند تا ادمینِ غیرفعال‌شده/حذف‌شده/تنزل‌یافته
 * بلافاصله دسترسی‌اش قطع شود (ابطال session در لایهٔ guard). نقش تازه را هم در session منعکس می‌کند.
 */
type AppSession = Awaited<ReturnType<typeof getCachedSession>>;

const validateAdminFromDb = cache(
  async (session: AppSession) => {
    if (!session?.user?.id || !isAdmin(session)) return null;
    try {
      const row = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { role: true, isActive: true, deletedAt: true },
      });
      if (!row || !row.isActive || row.deletedAt || !isAdminRole(row.role)) {
        return null;
      }
      // نقش تازهٔ DB را روی session بنشان تا چک‌های پایین‌دستی مقدار قدیمی توکن را نبینند.
      if (session.user) session.user.role = row.role as typeof session.user.role;
      return session;
    } catch (error) {
      // در صورت خطای DB، fail-closed: دسترسی ادمین داده نشود.
      console.error('[validateAdminFromDb]', error);
      return null;
    }
  }
);

export async function requireAdmin() {
  const session = await getCachedSession();
  const valid = await validateAdminFromDb(session);
  if (!valid) {
    redirect('/login');
  }
  return valid;
}

/**
 * Check admin authentication for API routes (doesn't throw redirect)
 * Returns null if not authenticated as any admin role.
 * نقش/فعال‌بودن از DB تأیید می‌شود (نه فقط از JWT).
 */
export async function checkAdminAuth() {
  const session = await getCachedSession();
  return validateAdminFromDb(session);
}

// Re-export auth for middleware usage
export { auth };
