import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { listAdminAccounts } from '@/lib/admin/admins-data';
import { ADMIN_ROLES, isAdminRole, type AdminRole } from '@/lib/auth/roles';
import { isPermission, type Permission } from '@/lib/auth/permissions';
import { assertCanAssignRole } from '@/lib/auth/admin-guards';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';
import { validateAuthPassword } from '@/lib/phone-auth';
import { ADMIN_ROLE_TEMPLATES } from '@/lib/auth/role-templates';
import { PERMISSION_GROUPS } from '@/lib/auth/permission-groups';

function parsePermissions(raw: unknown): Permission[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Permission => typeof p === 'string' && isPermission(p));
}

/** GET: لیست ادمین‌ها + قالب‌های نقش */
export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_roles');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const admins = await listAdminAccounts();
    return NextResponse.json({
      success: true,
      data: {
        admins,
        roleTemplates: ADMIN_ROLE_TEMPLATES,
        permissionGroups: PERMISSION_GROUPS,
      },
    });
  } catch (error: unknown) {
    console.error('admin admins GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}

/** POST: ایجاد ادمین جدید */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_roles');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role as AdminRole;
    const useCustom = body.useCustomPermissions === true;
    const adminPermissions = useCustom ? parsePermissions(body.adminPermissions) : [];

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'ایمیل معتبر وارد کنید' }, { status: 400 });
    }

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: 'نقش نامعتبر' }, { status: 400 });
    }

    const roleError = assertCanAssignRole(userOrRes.role, role);
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 });
    }

    if (useCustom && adminPermissions.length === 0) {
      return NextResponse.json({ error: 'حداقل یک دسترسی انتخاب کنید' }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email }, select: { id: true, role: true } });
    if (existing) {
      if (isAdminRole(existing.role)) {
        return NextResponse.json({ error: 'این ایمیل از قبل ادمین است' }, { status: 409 });
      }
      return NextResponse.json(
        { error: 'این ایمیل متعلق به کاربر عادی است — ابتدا نقش را از بخش کاربران تغییر دهید' },
        { status: 409 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const created = await prisma.users.create({
      data: {
        id: nanoid(),
        name: name || null,
        email,
        password: hashedPassword,
        role: role as UserRole,
        isActive: true,
        adminPermissions: useCustom ? adminPermissions : [],
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'USER_ROLE_CHANGE',
      entityType: 'USER',
      entityId: created.id,
      after: { role: created.role, email: created.email, adminPermissions: useCustom ? adminPermissions : [] },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: 'ادمین جدید ایجاد شد',
    });
  } catch (error: unknown) {
    console.error('admin admins POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در ایجاد ادمین' },
      { status: 500 }
    );
  }
}
