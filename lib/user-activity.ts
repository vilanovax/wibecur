import { prisma } from './prisma';

export type UserActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
  slug?: string;
  itemId?: string;
  category: unknown;
  createdAt: Date;
  likeCount: number;
  viewCount: number;
  saveCount: number;
};

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} as const;

export async function fetchUserActivities(
  userId: string,
  options: { type?: string; limit?: number } = {}
): Promise<{ activities: UserActivityItem[]; total: number; limit: number }> {
  const type = options.type ?? 'all';
  const limit = Math.min(options.limit ?? 20, 50);
  const activities = await loadActivities(userId, type, limit);

  return {
    activities,
    total: activities.length,
    limit,
  };
}

async function loadActivities(userId: string, type: string, limit: number): Promise<UserActivityItem[]> {
  const activities: UserActivityItem[] = [];
  const listWhere = { userId, deletedAt: null };

  if (type === 'all' || type === 'lists') {
    const userLists = await prisma.lists.findMany({
      where: listWhere,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        slug: true,
        createdAt: true,
        likeCount: true,
        viewCount: true,
        saveCount: true,
        categories: { select: CATEGORY_SELECT },
      },
    });

    for (const list of userLists) {
      activities.push({
        id: `list-${list.id}`,
        type: 'list_created',
        title: list.title,
        description: list.description || '',
        image: list.coverImage,
        slug: list.slug,
        category: list.categories,
        createdAt: list.createdAt,
        likeCount: list.likeCount ?? 0,
        viewCount: list.viewCount ?? 0,
        saveCount: list.saveCount ?? 0,
      });
    }
  }

  if (type === 'all' || type === 'bookmarks') {
    const bookmarks = await prisma.bookmarks.findMany({
      where: { userId, lists: { deletedAt: null } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        lists: {
          select: {
            title: true,
            description: true,
            coverImage: true,
            slug: true,
            likeCount: true,
            viewCount: true,
            saveCount: true,
            categories: { select: CATEGORY_SELECT },
          },
        },
      },
    });

    for (const bookmark of bookmarks) {
      const list = bookmark.lists;
      if (!list) continue;
      activities.push({
        id: `bookmark-${bookmark.id}`,
        type: 'bookmark',
        title: list.title,
        description: list.description || '',
        image: list.coverImage,
        slug: list.slug,
        category: list.categories,
        createdAt: bookmark.createdAt,
        likeCount: list.likeCount ?? 0,
        viewCount: list.viewCount ?? 0,
        saveCount: list.saveCount ?? 0,
      });
    }
  }

  if (type === 'all' || type === 'likes') {
    const itemLikes = await prisma.item_votes.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            lists: {
              select: {
                slug: true,
                likeCount: true,
                viewCount: true,
                saveCount: true,
                categories: { select: CATEGORY_SELECT },
              },
            },
          },
        },
      },
    });

    for (const like of itemLikes) {
      const item = like.items;
      const list = item?.lists;
      if (!item || !list) continue;
      activities.push({
        id: `item-like-${like.id}`,
        type: 'item_like',
        title: item.title,
        description: item.description || '',
        image: item.imageUrl,
        itemId: item.id,
        slug: list.slug,
        category: list.categories,
        createdAt: like.createdAt,
        likeCount: list.likeCount ?? 0,
        viewCount: list.viewCount ?? 0,
        saveCount: list.saveCount ?? 0,
      });
    }
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return activities.slice(0, limit);
}
