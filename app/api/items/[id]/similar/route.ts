import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/items/[id]/similar — آیتم‌های مشابه (همان دسته، مرتب‌سازی با تگ و امتیاز)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: currentItemId } = await params;

    const currentItem = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: currentItemId },
        select: {
          id: true,
          listId: true,
          lists: {
            select: {
              categoryId: true,
              tags: true,
            },
          },
        },
      })
    );

    if (!currentItem) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    const categoryId = currentItem.lists?.categoryId ?? null;
    const currentTags = currentItem.lists?.tags ?? [];

    if (!categoryId) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const candidates = await dbQuery(() =>
      prisma.items.findMany({
        where: {
          id: { not: currentItemId },
          lists: {
            categoryId,
            isActive: true,
          },
          OR: [
            { item_moderation: null },
            { item_moderation: { status: { notIn: ['HIDDEN', 'UNDER_REVIEW'] } } },
          ],
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          rating: true,
          lists: {
            select: {
              tags: true,
              categories: {
                select: {
                  name: true,
                  icon: true,
                },
              },
            },
          },
        },
        take: 24,
      })
    );

    const sharedTagCount = (tags: string[]) => {
      const set = new Set(currentTags.map((t) => t.toLowerCase()));
      return tags.filter((t) => set.has(t.toLowerCase())).length;
    };

    const sorted = [...candidates]
      .sort((a, b) => {
        const aShared = sharedTagCount(a.lists?.tags ?? []);
        const bShared = sharedTagCount(b.lists?.tags ?? []);
        if (bShared !== aShared) return bShared - aShared;
        return (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, 8);

    const data = sorted.map((i) => ({
      id: i.id,
      title: i.title,
      image: i.imageUrl,
      rating: i.rating,
      category: i.lists?.categories
        ? {
            name: i.lists.categories.name,
            icon: i.lists.categories.icon ?? null,
          }
        : null,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Similar items error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت آیتم‌های مشابه' },
      { status: 500 }
    );
  }
}
