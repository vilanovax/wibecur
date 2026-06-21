import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { getAdminAccount } from '@/lib/admin/admins-data';
import { ADMIN_ROLES, isAdminRole, type AdminRole } from '@/lib/auth/roles';
import { isPermission, type Permission } from '@/lib/auth/permissions';
import { assertCanAssignRole, assertCanModifyAdmin } from '@/lib/auth/admin-guards';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalUser } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';
import { validateAuthPassword } from '@/lib/phone-auth';

function parsePermissions(raw: unknown): Permission[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Permission => typeof p === 'string' && isPermission(p));
}

/** PATCH: به‌روزرسانی نقش، دسترسی‌ها، وضعیت یا رمز ادمین */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_roles');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing || !isAdminRole(existing.role)) {
      return NextResponse.json({ error: 'ادمین یافت نشد' }, { status: 404 });
    }

    const nextRole = body.role !== undefined ? (body.role as AdminRole) : (existing.role as AdminRole);
    const nextIsActive = body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive;
    const useCustom = body.useCustomPermissions === true;
    const clearCustom = body.useCustomPermissions === false;
    const adminPermissions = useCustom
      ? parsePermissions(body.adminPermissions)
      : clearCustom
        ? []
        : undefined;
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;

    if (body.role !== undefined && !ADMIN_ROLES.includes(nextRole)) {
      return NextResponse.json({ error: 'نقش نامعتبر' }, { status: 400 });
    }

    const roleAssignError = assertCanAssignRole(userOrRes.role, nextRole);
    if (roleAssignError) {
      return NextResponse.json({ error: roleAssignError }, { status: 403 });
    }

    const modifyError = await assertCanModifyAdmin(
      userOrRes.id,
      userOrRes.role,
      id,
      existing.role,
      body.isActive !== undefined ? nextIsActive : undefined
    );
    if (modifyError) {
      return NextResponse.json({ error: modifyError }, { status: 403 });
    }

    if (useCustom && adminPermissions?.length === 0) {
      return NextResponse.json({ error: 'حداقل یک دسترسی انتخاب کنید' }, { status: 400 });
    }

    if (password) {
      const passwordError = validateAuthPassword(password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }
    }

    const updated = await prisma.users.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name || null }),
        ...(body.role !== undefined && { role: nextRole as UserRole }),
        ...(body.isActive !== undefined && { isActive: nextIsActive }),
        ...(adminPermissions !== undefined && { adminPermissions }),
        ...(password && { password: bcrypt.hashSync(password, 10) }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        adminPermissions: true,
        updatedAt: true,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'USER_ROLE_CHANGE',
      entityType: 'USER',
      entityId: id,
      before: minimalUser(existing),
      after: minimalUser({ ...existing, ...updated, updatedAt: updated.updatedAt }),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const account = await getAdminAccount(id);
    return NextResponse.json({
      success: true,
      data: account,
      message: 'ادمین به‌روزرسانی شد',
    });
  } catch (error: unknown) {
    console.error('admin admins PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در به‌روزرسانی' },
      { status: 500 }
    );
  }
}

/** GET: جزئیات یک ادمین */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_roles');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const account = await getAdminAccount(id);
    if (!account) {
      return NextResponse.json({ error: 'ادمین یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: account });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
