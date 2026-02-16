/**
 * ثبت مرکزی Audit — فقط بعد از permission check و انجام عمل.
 * در صورت خطا در نوشتن لاگ، درخواست اصلی شکست نمی‌خورد.
 */

import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

export interface LogAuditParams {
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  const {
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    before,
    after,
    ipAddress,
    userAgent,
  } = params;

  try {
    await prisma.audit_log.create({
      data: {
        actorId,
        actorRole,
        action,
        entityType,
        entityId,
        before: before != null ? (typeof before === 'object' && before !== null ? before : { value: before }) : undefined,
        after: after != null ? (typeof after === 'object' && after !== null ? after : { value: after }) : undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    console.error('[Audit] Failed to write audit log:', err);
    // لاگ را پرتاب نکن تا درخواست اصلی شکست نخورد
  }
}
