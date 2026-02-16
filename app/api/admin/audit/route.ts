import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('view_audit');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get('actorId') ?? undefined;
    const action = searchParams.get('action') ?? undefined;
    const entityType = searchParams.get('entityType') ?? undefined;
    const dateFrom = searchParams.get('dateFrom') ?? searchParams.get('from') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? searchParams.get('to') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10)));

    const where: {
      actorId?: string;
      action?: string;
      entityType?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [rows, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          users: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.audit_log.count({ where }),
    ]);

    return NextResponse.json({
      rows,
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('Audit list error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت لاگ' },
      { status: 500 }
    );
  }
}
