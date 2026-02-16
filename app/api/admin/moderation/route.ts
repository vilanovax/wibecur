import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import type { ModerationStatus, ModerationType, ModerationEntityType } from '@prisma/client';

/** GET: لیست موارد صف بررسی با فیلتر و صفحه‌بندی */
export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('view_moderation');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ModerationType | null;
    const entityType = searchParams.get('entityType') as ModerationEntityType | null;
    const status = searchParams.get('status') as ModerationStatus | null;
    const severity = searchParams.get('severity');
    const assigneeId = searchParams.get('assigneeId');
    const assigneeFilter = searchParams.get('assigneeFilter');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') ?? '20', 10)));
    const skip = (page - 1) * pageSize;

    const validStatuses: ModerationStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'IGNORED'];
    const validTypes: ModerationType[] = ['REPORT', 'AUTO_FLAG', 'ANOMALY', 'PENDING'];
    const validEntityTypes: ModerationEntityType[] = ['LIST', 'COMMENT', 'USER', 'CATEGORY'];

    const where: Record<string, unknown> = {};
    if (type && validTypes.includes(type)) where.type = type;
    if (entityType && validEntityTypes.includes(entityType)) where.entityType = entityType;
    if (status && validStatuses.includes(status)) where.status = status;
    if (severity) {
      const s = parseInt(severity, 10);
      if (s >= 1 && s <= 3) where.severity = s;
    }
    if (assigneeId) where.assigneeId = assigneeId;
    else if (assigneeFilter === 'me') where.assigneeId = userOrRes.id;
    else if (assigneeFilter === 'unassigned') where.assigneeId = null;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      prisma.moderation_case.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          users: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      prisma.moderation_case.count({ where }),
    ]);

    const listIds = rawItems.filter((i) => i.entityType === 'LIST').map((i) => i.entityId);
    const userIds = rawItems.filter((i) => i.entityType === 'USER').map((i) => i.entityId);
    const commentIds = rawItems.filter((i) => i.entityType === 'COMMENT').map((i) => i.entityId);
    const categoryIds = rawItems.filter((i) => i.entityType === 'CATEGORY').map((i) => i.entityId);

    const [lists, users, comments, categories] = await Promise.all([
      listIds.length > 0
        ? prisma.lists.findMany({
            where: { id: { in: listIds } },
            select: { id: true, title: true, slug: true, categories: { select: { name: true, slug: true } } },
          })
        : [],
      userIds.length > 0
        ? prisma.users.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, role: true },
          })
        : [],
      commentIds.length > 0
        ? prisma.comments.findMany({
            where: { id: { in: commentIds } },
            select: { id: true, content: true },
          })
        : [],
      categoryIds.length > 0
        ? prisma.categories.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, slug: true },
          })
        : [],
    ]);

    const listMap = new Map(lists.map((l) => [l.id, l]));
    const userMap = new Map(users.map((u) => [u.id, u]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const items = rawItems.map((row) => {
      const base = { ...row, users: row.users };
      let entityPreview: { title?: string; categoryName?: string; name?: string; email?: string; role?: string; body?: string } | null = null;
      if (row.entityType === 'LIST') {
        const l = listMap.get(row.entityId);
        if (l) entityPreview = { title: l.title ?? l.slug ?? row.entityId, categoryName: l.categories?.name ?? undefined };
      } else if (row.entityType === 'USER') {
        const u = userMap.get(row.entityId);
        if (u) entityPreview = { name: u.name ?? undefined, email: u.email, role: u.role };
      } else if (row.entityType === 'COMMENT') {
        const c = commentMap.get(row.entityId);
        if (c) entityPreview = { body: c.content };
      } else if (row.entityType === 'CATEGORY') {
        const cat = categoryMap.get(row.entityId);
        if (cat) entityPreview = { title: cat.name };
      }
      return { ...base, entityPreview };
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err: unknown) {
    console.error('Moderation list error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت صف بررسی' },
      { status: 500 }
    );
  }
}
