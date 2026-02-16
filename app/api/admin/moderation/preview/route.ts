import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import type { ModerationEntityType } from '@prisma/client';

const VALID: ModerationEntityType[] = ['LIST', 'COMMENT', 'USER', 'CATEGORY'];

/** GET: پیش‌نمایش کم‌حجم موجودیت برای دراور صف بررسی */
export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('view_moderation');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as ModerationEntityType | null;
    const entityId = searchParams.get('entityId');

    if (!entityType || !VALID.includes(entityType) || !entityId) {
      return NextResponse.json(
        { error: 'entityType و entityId الزامی هستند' },
        { status: 400 }
      );
    }

    if (entityType === 'LIST') {
      const list = await prisma.lists.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          likeCount: true,
          itemCount: true,
          createdAt: true,
          deletedAt: true,
          isActive: true,
          categoryId: true,
          categories: { select: { name: true, slug: true } },
        },
      });
      if (!list)
        return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
      return NextResponse.json({
        kind: 'LIST',
        ...list,
        deletedAt: list.deletedAt?.toISOString() ?? null,
        createdAt: list.createdAt.toISOString(),
      });
    }

    if (entityType === 'USER') {
      const user = await prisma.users.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          deletedAt: true,
          createdAt: true,
        },
      });
      if (!user)
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
      return NextResponse.json({
        kind: 'USER',
        ...user,
        deletedAt: user.deletedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      });
    }

    if (entityType === 'COMMENT') {
      const comment = await prisma.comments.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          content: true,
          isApproved: true,
          deletedAt: true,
          createdAt: true,
          likeCount: true,
          users: { select: { id: true, name: true, email: true } },
        },
      });
      if (!comment)
        return NextResponse.json({ error: 'کامنت یافت نشد' }, { status: 404 });
      return NextResponse.json({
        kind: 'COMMENT',
        ...comment,
        deletedAt: comment.deletedAt?.toISOString() ?? null,
        createdAt: comment.createdAt.toISOString(),
      });
    }

    if (entityType === 'CATEGORY') {
      const cat = await prisma.categories.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          deletedAt: true,
          _count: { select: { lists: true } },
        },
      });
      if (!cat)
        return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });
      return NextResponse.json({
        kind: 'CATEGORY',
        ...cat,
        deletedAt: cat.deletedAt?.toISOString() ?? null,
      });
    }

    return NextResponse.json({ error: 'نوع نامعتبر' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Moderation preview error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت پیش‌نمایش' },
      { status: 500 }
    );
  }
}
