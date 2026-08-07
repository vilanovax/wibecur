import { prisma } from '@/lib/prisma';
import { ADMIN_ROLES, getRoleLabel, isAdminRole } from '@/lib/auth/roles';
import { normalizeAdminPermissions } from '@/lib/auth/has-permission';
import { resolveEffectivePermissions } from '@/lib/auth/permission-map';
import type { AdminRole } from '@/lib/auth/roles';
import type { Permission } from '@/lib/auth/permissions';

export type AdminAccountRow = {
  id: string;
  name: string | null;
  email: string;
  role: AdminRole;
  roleLabel: string;
  isActive: boolean;
  adminPermissions: Permission[];
  effectivePermissions: Permission[];
  createdAt: string;
  updatedAt: string;
};

const ADMIN_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  adminPermissions: true,
  createdAt: true,
  updatedAt: true,
} as const;

function mapAdminRow(row: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  adminPermissions: string[];
  createdAt: Date;
  updatedAt: Date;
}): AdminAccountRow {
  const role = row.role as AdminRole;
  const adminPermissions = normalizeAdminPermissions(row.adminPermissions);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    roleLabel: getRoleLabel(role),
    isActive: row.isActive,
    adminPermissions,
    effectivePermissions: resolveEffectivePermissions(role, adminPermissions),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAdminAccounts(): Promise<AdminAccountRow[]> {
  const rows = await prisma.users.findMany({
    where: {
      role: { in: [...ADMIN_ROLES] },
      deletedAt: null,
    },
    orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { createdAt: 'desc' }],
    select: ADMIN_SELECT,
  });

  return rows.filter((r) => isAdminRole(r.role)).map(mapAdminRow);
}

export async function getAdminAccount(id: string): Promise<AdminAccountRow | null> {
  const row = await prisma.users.findUnique({
    where: { id },
    select: { ...ADMIN_SELECT, deletedAt: true },
  });
  if (!row || !isAdminRole(row.role) || row.deletedAt) return null;
  return mapAdminRow(row);
}
