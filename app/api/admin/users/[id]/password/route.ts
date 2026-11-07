import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { adminSetUserPassword } from '@/lib/user-password-server';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { isAdminRole } from '@/lib/auth/roles';
import { assertCanModifyAdmin } from '@/lib/auth/admin-guards';
import type { UserRole } from '@prisma/client';
import { revalidateAdminUsersCache } from '@/lib/admin/admin-cache';

/** PUT /api/admin/users/[id]/password — ایجاد یا تغییر رمز کاربر */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorOrRes = await requirePermission('manage_users');
    if (actorOrRes instanceof NextResponse) return actorOrRes;

    const { id } = await params;
    const body = await request.json();
    const newPassword = String(body?.newPassword ?? '');
    const confirmPassword = String(body?.confirmPassword ?? '');

    const existing = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          deletedAt: true,
          password: true,
        },
      })
    );

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    if (isAdminRole(existing.role)) {
      const roleManager = await requirePermission('manage_roles');
      if (roleManager instanceof NextResponse) return roleManager;

      const guardError = await assertCanModifyAdmin(
        roleManager.id,
        roleManager.role,
        existing.id,
        existing.role,
        true
      );
      if (guardError) {
        return NextResponse.json({ error: guardError }, { status: 403 });
      }
    }

    const result = await adminSetUserPassword(id, {
      newPassword,
      confirmPassword,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: actorOrRes.id,
      actorRole: actorOrRes.role as UserRole,
      action: 'USER_PASSWORD_SET',
      entityType: 'USER',
      entityId: id,
      before: { hasPassword: Boolean(existing.password) },
      after: { hasPassword: true },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidateAdminUsersCache();

    return NextResponse.json({
      success: true,
      message: result.message,
      hasPassword: true,
    });
  } catch (error: unknown) {
    console.error('admin set user password:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در ذخیره رمز',
      },
      { status: 500 }
    );
  }
}
