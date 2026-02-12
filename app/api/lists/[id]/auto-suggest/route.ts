import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { normalizeSuggestionTitle } from '@/lib/suggestion-utils';

const LIMIT = 6;

/**
 * GET /api/lists/[id]/auto-suggest
 * آیتم‌های پیشنهادی بر اساس دسته لیست (همان دسته، نه در این لیست، قبلاً پیشنهاد نشده).
 * Auth required. Max 6. بدون تغییر اسکیما.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId } = await params;

    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { id: true, categoryId: true },
      })
    );

    if (!list) {
      return NextResponse.json({ success: false, error: 'لیست یافت نشد' }, { status: 404 });
    }

    if (!list.categoryId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const [suggestionComments, suggestedItems, candidateItems] = await Promise.all([
      dbQuery(() =>
        prisma.list_comments.findMany({
          where: {
            listId,
            type: 'suggestion',
            deletedAt: null,
            suggestionStatus: { in: ['pending', 'approved'] },
          },
          select: { content: true },
        })
      ),
      dbQuery(() =>
        prisma.suggested_items.findMany({
          where: { listId, status: { in: ['pending', 'approved'] } },
          select: { title: true },
        })
      ),
      dbQuery(() =>
        prisma.items.findMany({
          where: {
            listId: { not: listId },
            lists: {
              categoryId: list.categoryId,
              isPublic: true,
              isActive: true,
            },
          },
          orderBy: { voteCount: 'desc' },
          take: 24,
          select: {
            id: true,
            title: true,
            imageUrl: true,
            listId: true,
            lists: { select: { categories: { select: { name: true, slug: true } } } },
          },
        })
      ),
    ]);

    const suggestedNormalized = new Set([
      ...suggestionComments.map((c) => normalizeSuggestionTitle(c.content)),
      ...suggestedItems.map((i) => normalizeSuggestionTitle(i.title)),
    ]);

    const filtered = candidateItems
      .filter((item) => !suggestedNormalized.has(normalizeSuggestionTitle(item.title)))
      .slice(0, LIMIT)
      .map((item) => ({
        id: item.id,
        title: item.title,
        category: item.lists?.categories?.name ?? null,
        image: item.imageUrl,
      }));

    return NextResponse.json({ success: true, data: filtered });
  } catch (err) {
    console.error('Auto-suggest error:', err);
    return NextResponse.json(
      { success: false, error: 'مشکلی پیش اومد' },
      { status: 500 }
    );
  }
}
