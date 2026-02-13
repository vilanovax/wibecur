import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { calculateCuratorResult } from '@/lib/curator';
import { getActiveSpotlightForUser } from '@/lib/spotlight';

// GET /api/public-profile/[username] — پروفایل عمومی کریتور (بدون نیاز به لاگین)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    const { username } = await params;
    const raw = (username || '').trim().toLowerCase();
    if (!raw) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { username: raw },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        bio: true,
        avatarType: true,
        avatarId: true,
        avatarStatus: true,
        showBadge: true,
        reputationScore: true,
        curatorScore: true,
        curatorLevel: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    const [
      publicLists,
      listsCount,
      followersCount,
      followingCount,
      isFollowing,
      likedListIds,
      listComments,
      approvedSuggestions,
      creatorRanking,
      activeSpotlight,
    ] = await Promise.all([
      prisma.lists.findMany({
        where: { userId, isActive: true, isPublic: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          saveCount: true,
          likeCount: true,
          itemCount: true,
          viewCount: true,
          updatedAt: true,
          isFeatured: true,
          categoryId: true,
          categories: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          _count: { select: { items: true, list_likes: true, bookmarks: true } },
        },
      }),
      prisma.lists.count({ where: { userId, isActive: true, isPublic: true } }),
      prisma.follows.count({ where: { followingId: userId } }),
      prisma.follows.count({ where: { followerId: userId } }),
      currentUserId
        ? prisma.follows
            .findUnique({
              where: {
                followerId_followingId: { followerId: currentUserId, followingId: userId },
              },
            })
            .then((r) => !!r)
        : Promise.resolve(false),
      prisma.list_likes.findMany({
        where: { userId },
        select: { listId: true },
      }),
      prisma.list_comments.findMany({
        where: { userId, deletedAt: null, isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          content: true,
          type: true,
          suggestionStatus: true,
          createdAt: true,
          listId: true,
          lists: { select: { title: true, slug: true } },
        },
      }),
      prisma.suggested_items.findMany({
        where: { userId, status: 'approved' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, updatedAt: true, listId: true, lists: { select: { title: true, slug: true } } },
      }),
      prisma.creator_rankings.findUnique({
        where: { userId },
        select: { globalRank: true, monthlyRank: true },
      }),
      getActiveSpotlightForUser(prisma, userId),
    ]);

    const totalSaves = publicLists.reduce((s, l) => s + (l.saveCount ?? 0), 0);
    const totalLikes = publicLists.reduce((s, l) => s + (l.likeCount ?? 0), 0);
    const viralCount = publicLists.filter((l) => (l.likeCount ?? 0) >= 50).length;
    const avgLikes = listsCount > 0 ? totalLikes / listsCount : 0;
    const approvedItemsCount = await prisma.suggested_items.count({
      where: { userId, status: 'approved' },
    });

    const curatorResult = calculateCuratorResult({
      listsCount,
      avgLikesPerList: avgLikes,
      approvedItemsCount,
      savedCount: totalSaves,
      viralListsCount: viralCount,
    });

    const categoryCounts: Record<string, { name: string; slug: string; icon: string; count: number }> = {};
    for (const list of publicLists) {
      const cat = list.categories;
      if (cat) {
        if (!categoryCounts[cat.id]) {
          categoryCounts[cat.id] = { name: cat.name, slug: cat.slug, icon: cat.icon, count: 0 };
        }
        categoryCounts[cat.id].count++;
      }
    }
    const expertise = Object.values(categoryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const totalTagCount = expertise.reduce((s, e) => s + e.count, 0) || 1;
    const topTags = expertise.slice(0, 4).map((e) => ({
      ...e,
      percent: Math.round((e.count / totalTagCount) * 100),
    }));

    const featuredLists = publicLists.filter((l) => l.isFeatured);
    const likedIds = likedListIds.map((x) => x.listId);
    const likedLists =
      likedIds.length > 0
        ? await prisma.lists.findMany({
            where: { id: { in: likedIds }, isActive: true, isPublic: true },
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              saveCount: true,
              likeCount: true,
              itemCount: true,
              updatedAt: true,
              categories: { select: { name: true, slug: true, icon: true } },
              _count: { select: { items: true, list_likes: true, bookmarks: true } },
            },
          })
        : [];
    const likedListsFormatted = likedLists.map((l) => ({
      ...l,
      likes: l.likeCount ?? l._count?.list_likes ?? 0,
      saves: l.saveCount ?? l._count?.bookmarks ?? 0,
      items: l.itemCount ?? l._count?.items ?? 0,
    }));

    const allPublicLists = publicLists.map((l) => ({
      ...l,
      likes: l.likeCount ?? l._count?.list_likes ?? 0,
      saves: l.saveCount ?? l._count?.bookmarks ?? 0,
      items: l.itemCount ?? l._count?.items ?? 0,
    }));

    type ActivityItem =
      | { type: 'comment'; id: string; content: string; createdAt: Date; listTitle: string; listSlug: string }
      | { type: 'suggestion'; id: string; title: string; updatedAt: Date; listTitle: string; listSlug: string };
    const activity: ActivityItem[] = [
      ...listComments.map((c) => ({
        type: 'comment' as const,
        id: c.id,
        content: c.content.slice(0, 120),
        createdAt: c.createdAt,
        listTitle: c.lists?.title ?? '',
        listSlug: c.lists?.slug ?? '',
      })),
      ...approvedSuggestions.map((s) => ({
        type: 'suggestion' as const,
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        listTitle: s.lists?.title ?? '',
        listSlug: s.lists?.slug ?? '',
      })),
    ];
    activity.sort((a, b) => {
      const da = a.type === 'comment' ? a.createdAt : a.updatedAt;
      const db = b.type === 'comment' ? b.createdAt : b.updatedAt;
      return new Date(db).getTime() - new Date(da).getTime();
    });
    const recentActivity = activity.slice(0, 3);

    const displayUsername = user.username ?? raw;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: displayUsername,
          bio: user.bio,
          avatarType: user.avatarType,
          avatarId: user.avatarId,
          avatarStatus: user.avatarStatus,
          showBadge: user.showBadge,
          reputationScore: user.reputationScore ?? 0,
          curatorLevel: curatorResult.level,
          curatorScore: curatorResult.score,
          curatorNextLevelLabel: curatorResult.nextLevelLabel,
          curatorPointsToNext: curatorResult.pointsToNextLevel,
          globalRank: creatorRanking?.globalRank ?? null,
          monthlyRank: creatorRanking?.monthlyRank ?? null,
          spotlightActive: !!activeSpotlight,
          spotlightType: activeSpotlight?.type ?? null,
          spotlightEndDate: activeSpotlight?.endDate ?? null,
        },
        stats: {
          listsCount,
          followersCount,
          followingCount,
          savedCount: totalSaves,
          reputationScore: user.reputationScore ?? 0,
        },
        isFollowing: !!isFollowing,
        topTags,
        featuredLists,
        publicLists: allPublicLists,
        likedLists: likedListsFormatted,
        recentActivity,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
