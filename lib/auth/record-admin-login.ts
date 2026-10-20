import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/auth/roles';
import { getRequestMeta } from '@/lib/audit/request-meta';

/** ورود موفق یا ناموفق ادمین را ثبت می‌کند. شکست ثبت، ورود را قطع نمی‌کند. */
export async function recordAdminLogin(input: {
  userId: string;
  role: string;
  success: boolean;
  request?: Request;
}): Promise<void> {
  if (!isAdminRole(input.role)) return;

  const meta = input.request
    ? getRequestMeta(input.request)
    : { ipAddress: null, userAgent: null };

  try {
    await prisma.admin_login_event.create({
      data: {
        userId: input.userId,
        success: input.success,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  } catch (error) {
    console.error('[admin-login]', error);
  }
}
