import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const LIMIT_PER_TYPE = 12;
const TOTAL_LIMIT = 20;
const COMMENT_SNIPPET_LEN = 50;

export type LiveActivityItem =
  | { type: 'save'; createdAt: Date; userName: string; listTitle: string; listId: string }
  | {
      type: 'comment';
      createdAt: Date;
      userName: string;
      itemTitle: string;
      contentSnippet: string;
      itemId: string;
    }
  | { type: 'user'; createdAt: Date; userName: string }
  | { type: 'item'; createdAt: Date; itemTitle: string; listTitle: string; itemId: string };

export async function getLiveActivityData(): Promise<LiveActivityItem[]> {
  return dbQuery(async () => {
    const [bookmarks, comments, newUsers, newItems] = await Promise.all([
      prisma.bookmarks.findMany({
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        include: {
          users: { select: { name: true } },
          lists: { select: { title: true, id: true } },
        },
      }),
      prisma.comments.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        include: {
          users: { select: { name: true } },
          items: { select: { title: true, id: true } },
        },
      }),
      prisma.users.findMany({
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        select: { name: true, createdAt: true },
      }),
      prisma.items.findMany({
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        include: {
          lists: { select: { title: true } },
        },
      }),
    ]);

    const activities: LiveActivityItem[] = [];

    bookmarks.forEach((b) => {
      activities.push({
        type: 'save',
        createdAt: b.createdAt,
        userName: b.users?.name ?? 'کاربر',
        listTitle: b.lists?.title ?? 'لیست',
        listId: b.listId,
      });
    });
    comments.forEach((c) => {
      const snippet =
        c.content.length > COMMENT_SNIPPET_LEN
          ? c.content.slice(0, COMMENT_SNIPPET_LEN) + '…'
          : c.content;
      activities.push({
        type: 'comment',
        createdAt: c.createdAt,
        userName: c.users?.name ?? 'کاربر',
        itemTitle: c.items?.title ?? 'آیتم',
        contentSnippet: snippet,
        itemId: c.itemId,
      });
    });
    newUsers.forEach((u) => {
      activities.push({
        type: 'user',
        createdAt: u.createdAt,
        userName: u.name ?? 'کاربر جدید',
      });
    });
    newItems.forEach((i) => {
      activities.push({
        type: 'item',
        createdAt: i.createdAt,
        itemTitle: i.title,
        listTitle: i.lists?.title ?? 'لیست',
        itemId: i.id,
      });
    });

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return activities.slice(0, TOTAL_LIMIT);
  });
}

/** JSON-safe payload for API / SSE */
export function serializeLiveActivity(items: LiveActivityItem[]) {
  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));
}

/**
 * نسخهٔ کش‌شدهٔ مشترک — هم poll route و هم SSE stream از این استفاده می‌کنند تا
 * چند ادمینِ هم‌زمان یک چرخهٔ کوئری (هر ۱۰ث) را به‌اشتراک بگذارند، نه اینکه هر
 * اتصال SSE هر ۱۲ث ۴ کوئری خام بزند.
 */
export const getCachedLiveActivity = unstable_cache(
  async () => serializeLiveActivity(await getLiveActivityData()),
  ['admin-live-activity'],
  { revalidate: 10, tags: ['admin-live'] }
);
