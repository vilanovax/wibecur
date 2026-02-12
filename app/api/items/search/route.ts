import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { normalizeSuggestionTitle } from '@/lib/suggestion-utils';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;

/**
 * GET /api/items/search?q=...&listId=...
 * Search items by title (case-insensitive contains).
 * If listId provided: for each result alreadyInList, alreadySuggested, suggestionCommentId.
 * Auth required. Min 3 chars. Minimal payload.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const listId = searchParams.get('listId')?.trim() || null;

    if (q.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const items = await dbQuery(() =>
      prisma.items.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
        },
        take: MAX_RESULTS,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          listId: true,
          lists: {
            select: {
              categories: { select: { name: true, slug: true } },
            },
          },
        },
      })
    );

    if (!listId) {
      return NextResponse.json({
        success: true,
        data: items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          categoryName: item.lists?.categories?.name ?? null,
          categorySlug: item.lists?.categories?.slug ?? null,
          alreadyInList: false,
          alreadySuggested: false,
          suggestionCommentId: null as string | null,
        })),
      });
    }

    // Build set of normalized titles that are already suggested for this list
    const [suggestionComments, suggestedItems] = await Promise.all([
      dbQuery(() =>
        prisma.list_comments.findMany({
          where: {
            listId,
            type: 'suggestion',
            deletedAt: null,
            suggestionStatus: { in: ['pending', 'approved'] },
          },
          select: { id: true, content: true },
        })
      ),
      dbQuery(() =>
        prisma.suggested_items.findMany({
          where: {
            listId,
            status: { in: ['pending', 'approved'] },
          },
          select: { title: true },
        })
      ),
    ]);

    const suggestedNormalizedToCommentId = new Map<string, string>();
    for (const c of suggestionComments) {
      suggestedNormalizedToCommentId.set(normalizeSuggestionTitle(c.content), c.id);
    }
    const suggestedNormalizedSet = new Set([
      ...suggestionComments.map((c) => normalizeSuggestionTitle(c.content)),
      ...suggestedItems.map((i) => normalizeSuggestionTitle(i.title)),
    ]);

    const data = items.map((item) => {
      const normalizedTitle = normalizeSuggestionTitle(item.title);
      const alreadyInList = item.listId === listId;
      const alreadySuggested = !alreadyInList && suggestedNormalizedSet.has(normalizedTitle);
      const suggestionCommentId = alreadySuggested
        ? suggestedNormalizedToCommentId.get(normalizedTitle) ?? null
        : null;

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        categoryName: item.lists?.categories?.name ?? null,
        categorySlug: item.lists?.categories?.slug ?? null,
        alreadyInList,
        alreadySuggested,
        suggestionCommentId,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Items search error:', err);
    return NextResponse.json(
      { success: false, error: 'مشکلی پیش اومد، دوباره امتحان کن ✨' },
      { status: 500 }
    );
  }
}
