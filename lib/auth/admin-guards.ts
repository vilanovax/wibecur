/**
 * قوانین امنیتی برای مدیریت ادمین‌ها
 */

import { prisma } from '@/lib/prisma';
import { isAdminRole, type AdminRole } from './roles';

export async function countActiveSuperAdmins(excludeId?: string): Promise<number> {
  return prisma.users.count({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export function assertCanAssignRole(
  actorRole: string,
  targetRole: AdminRole
): string | null {
  if (targetRole === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
    return 'فقط مدیرکل می‌تواند نقش مدیرکل تعریف کند';
  }
  return null;
}

export async function assertCanModifyAdmin(
  actorId: string,
  actorRole: string,
  targetId: string,
  targetRole: string,
  nextIsActive?: boolean
): Promise<string | null> {
  if (!isAdminRole(targetRole)) {
    return 'این کاربر ادمین نیست';
  }

  if (actorId === targetId && nextIsActive === false) {
    return 'شما نمی‌توانید خود را غیرفعال کنید';
  }

  if (targetRole === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN' && actorId !== targetId) {
    return 'فقط مدیرکل می‌تواند مدیرکل دیگر را ویرایش کند';
  }

  if (nextIsActive === false && targetRole === 'SUPER_ADMIN') {
    const others = await countActiveSuperAdmins(targetId);
    if (others === 0) {
      return 'حداقل یک مدیرکل فعال باید باقی بماند';
    }
  }

  return null;
}
