import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  formatListItemAddedNotification,
  resolveItemTypeLabel,
} from '@/lib/notification-messages';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  return dbQuery(() =>
    prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    })
  );
}

export type NotifyListBookmarkersOptions = {
  itemCount?: number;
  categorySlug?: string | null;
  categoryName?: string | null;
  listTitle?: string;
  excludeUserIds?: string[];
};

async function filterBookmarkersByNotificationPref(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  try {
    const users = await dbQuery(() =>
      prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, allowBookmarkListNotifications: true },
      })
    );
    return users
      .filter((user) => user.allowBookmarkListNotifications ?? true)
      .map((user) => user.id);
  } catch {
    return userIds;
  }
}

/** اعلان به کاربرانی که لیست را بوک‌مارک کرده‌اند */
export async function notifyListBookmarkers(
  listId: string,
  options: NotifyListBookmarkersOptions = {}
) {
  try {
    const itemCount = options.itemCount ?? 1;
    const excludeSet = new Set(options.excludeUserIds ?? []);

    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: {
          slug: true,
          title: true,
          categories: { select: { slug: true, name: true } },
        },
      })
    );

    if (!list) return;

    const listTitle = options.listTitle ?? list.title ?? 'لیست';
    const categorySlug = options.categorySlug ?? list.categories?.slug ?? null;
    const categoryName = options.categoryName ?? list.categories?.name ?? null;
    const itemTypeLabel = resolveItemTypeLabel(categorySlug, categoryName);
    const { title, message } = formatListItemAddedNotification(
      itemCount,
      itemTypeLabel,
      listTitle
    );

    const bookmarks = await dbQuery(() =>
      prisma.bookmarks.findMany({
        where: { listId },
        select: { userId: true },
      })
    );

    const candidateIds = bookmarks
      .map((bookmark) => bookmark.userId)
      .filter((userId) => !excludeSet.has(userId));

    const recipientIds = await filterBookmarkersByNotificationPref(candidateIds);
    if (recipientIds.length === 0) return;

    const link = list.slug ? `/lists/${list.slug}` : `/lists/${listId}`;

    await Promise.all(
      recipientIds.map((userId) =>
        createNotification(userId, 'list_item_added', title, message, link)
      )
    );
  } catch (error) {
    console.error('Error notifying list bookmarkers:', error);
  }
}

export async function fetchNotificationPreferences(userId: string): Promise<{
  allowBookmarkListNotifications: boolean;
  allowCommentNotifications: boolean;
}> {
  const defaults = {
    allowBookmarkListNotifications: true,
    allowCommentNotifications: true,
  };

  try {
    const userPrefs = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          allowBookmarkListNotifications: true,
          allowCommentNotifications: true,
        },
      })
    );
    if (!userPrefs) return defaults;
    return {
      allowBookmarkListNotifications: userPrefs.allowBookmarkListNotifications ?? true,
      allowCommentNotifications: userPrefs.allowCommentNotifications ?? true,
    };
  } catch {
    try {
      const userPrefs = await dbQuery(() =>
        prisma.users.findUnique({
          where: { id: userId },
          select: { allowCommentNotifications: true },
        })
      );
      return {
        ...defaults,
        allowCommentNotifications: userPrefs?.allowCommentNotifications ?? true,
      };
    } catch {
      return defaults;
    }
  }
}
