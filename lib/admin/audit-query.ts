import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  getEntityDisplayName,
  summarizeChangedFields,
} from '@/lib/audit/display';

export const AUDIT_DEFAULT_PAGE_SIZE = 20;
export const AUDIT_MAX_PAGE_SIZE = 50;

export type AuditListQuery = {
  actorQuery?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type AuditListRow = {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  entityName: string | null;
  changeSummary: string;
  users: { id: string; name: string | null; email: string | null } | null;
};

export type AuditDetailRow = AuditListRow & {
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
};

function endOfLocalDay(isoDate: string): Date {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return new Date(isoDate);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfLocalDay(isoDate: string): Date {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return new Date(isoDate);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function buildWhere(query: AuditListQuery) {
  const where: {
    actorId?: string | { in: string[] };
    action?: string;
    entityType?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  const actorQuery = query.actorQuery?.trim();
  if (actorQuery) {
    const matchedActors = await dbQuery(() =>
      prisma.users.findMany({
        where: {
          OR: [
            { id: actorQuery },
            { name: { contains: actorQuery, mode: 'insensitive' } },
            { email: { contains: actorQuery, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 25,
      })
    );
    where.actorId =
      matchedActors.length > 0
        ? { in: matchedActors.map((u) => u.id) }
        : actorQuery;
  }

  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = startOfLocalDay(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = endOfLocalDay(query.dateTo);
  }

  return where;
}

function toListRow(row: {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
  users: { id: string; name: string | null; email: string | null } | null;
}): AuditListRow {
  return {
    id: row.id,
    actorId: row.actorId,
    actorRole: row.actorRole,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    createdAt: row.createdAt.toISOString(),
    entityName: getEntityDisplayName(row.entityType, row.before, row.after),
    changeSummary: summarizeChangedFields(row.before, row.after),
    users: row.users,
  };
}

export async function listAuditLogs(query: AuditListQuery): Promise<{
  rows: AuditListRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    AUDIT_MAX_PAGE_SIZE,
    Math.max(1, query.pageSize ?? AUDIT_DEFAULT_PAGE_SIZE)
  );
  const where = await buildWhere(query);

  const [raw, total] = await Promise.all([
    dbQuery(() =>
      prisma.audit_log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          action: true,
          entityType: true,
          entityId: true,
          before: true,
          after: true,
          createdAt: true,
          users: { select: { id: true, name: true, email: true } },
        },
      })
    ),
    dbQuery(() => prisma.audit_log.count({ where })),
  ]);

  return {
    rows: raw.map(toListRow),
    total,
    page,
    pageSize,
  };
}

export async function getAuditLogById(id: string): Promise<AuditDetailRow | null> {
  const row = await dbQuery(() =>
    prisma.audit_log.findUnique({
      where: { id },
      select: {
        id: true,
        actorId: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityId: true,
        before: true,
        after: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        users: { select: { id: true, name: true, email: true } },
      },
    })
  );
  if (!row) return null;
  return {
    ...toListRow(row),
    before: row.before,
    after: row.after,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
  };
}
