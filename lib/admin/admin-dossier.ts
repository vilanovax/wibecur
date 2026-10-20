import { prisma } from '@/lib/prisma';
import { getAdminAccount, type AdminAccountRow } from '@/lib/admin/admins-data';
import {
  getAuditActionLabel,
  getEntityDisplayName,
  getEntityTypeLabel,
} from '@/lib/audit/display';

const WINDOW_DAYS = 30;
const RECENT_LIMIT = 20;

export type AdminLoginRow = {
  id: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminOperationRow = {
  id: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityTypeLabel: string;
  entityId: string;
  entityName: string | null;
  createdAt: string;
};

export type AdminActionCount = {
  action: string;
  label: string;
  count: number;
};

export type AdminPerformance = {
  windowDays: number;
  operationCount: number;
  lastActivityAt: string | null;
  loginSuccess: number;
  loginFailure: number;
  lastLoginAt: string | null;
  byAction: AdminActionCount[];
};

export type AdminDossier = {
  account: AdminAccountRow;
  performance: AdminPerformance;
  logins: AdminLoginRow[];
  operations: AdminOperationRow[];
};

export async function getAdminDossier(id: string): Promise<AdminDossier | null> {
  const account = await getAdminAccount(id);
  if (!account) return null;

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [logins, operations, actionGroups, loginGroups, lastActivity, lastLogin] = await Promise.all([
    prisma.admin_login_event.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    }),
    prisma.audit_log.findMany({
      where: { actorId: id },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    }),
    prisma.audit_log.groupBy({
      by: ['action'],
      where: { actorId: id, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.admin_login_event.groupBy({
      by: ['success'],
      where: { userId: id, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.audit_log.findFirst({
      where: { actorId: id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.admin_login_event.findFirst({
      where: { userId: id, success: true },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const byAction = actionGroups
    .map((row) => ({
      action: row.action,
      label: getAuditActionLabel(row.action),
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    account,
    performance: {
      windowDays: WINDOW_DAYS,
      operationCount: byAction.reduce((sum, row) => sum + row.count, 0),
      lastActivityAt: lastActivity?.createdAt.toISOString() ?? null,
      loginSuccess: loginGroups.find((row) => row.success)?._count._all ?? 0,
      loginFailure: loginGroups.find((row) => !row.success)?._count._all ?? 0,
      lastLoginAt: lastLogin?.createdAt.toISOString() ?? null,
      byAction,
    },
    logins: logins.map((row) => ({
      id: row.id,
      success: row.success,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt.toISOString(),
    })),
    operations: operations.map((row) => ({
      id: row.id,
      action: row.action,
      actionLabel: getAuditActionLabel(row.action),
      entityType: row.entityType,
      entityTypeLabel: getEntityTypeLabel(row.entityType),
      entityId: row.entityId,
      entityName: getEntityDisplayName(row.entityType, row.before, row.after),
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
